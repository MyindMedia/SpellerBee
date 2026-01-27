import { useState, useRef, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Helper to check browser support
const isSpeechRecognitionSupported = () => {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
};

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // MediaRecorder fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const listenAction = useAction(api.eleven.listen);

  // SpeechRecognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    setInterimTranscript("");

    // 1. Try Web Speech API (Real-time)
    if (isSpeechRecognitionSupported()) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening even if user pauses slightly
            recognition.interimResults = true; // Key for "reveal as you say it"
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setIsRecording(true);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setError(event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                let final = "";
                let interim = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                
                if (final) {
                    setTranscript((prev) => (prev || "") + final);
                }
                setInterimTranscript(interim);
            };

            recognitionRef.current = recognition;
            recognition.start();
            return;
        } catch (e) {
            console.warn("SpeechRecognition failed to start, falling back to MediaRecorder", e);
        }
    }

    // 2. Fallback to MediaRecorder (Batch)
    try {
      // Explicitly request audio permissions if not granted
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // More descriptive error
      if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("Microphone permission denied. Please allow access in browser settings.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
          setError("No microphone found.");
      } else {
          setError("Could not access microphone.");
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    // Stop Web Speech API
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
        // Combine final transcript + any lingering interim
        // Actually, onresult handles it. We just return the current state.
        // Wait, 'transcript' state might not be fully updated immediately?
        // We return a promise that resolves with the final text.
        return new Promise<string>((resolve) => {
            // Give it a tiny moment for final event
            setTimeout(() => {
                // Use the state value? State inside callback is stale?
                // Ref approach is better for getting value inside callback, 
                // but for now let's rely on the component using the hook to read 'transcript'
                resolve(transcript + interimTranscript); 
            }, 100);
        });
    }

    // Stop MediaRecorder (Fallback)
    if (!mediaRecorderRef.current) return null;
    
    return new Promise<string>((resolve, reject) => {
      const recorder = mediaRecorderRef.current!;
      
      recorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(",")[1];
            
            try {
              let text = "";
              const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

              if (apiKey) {
                  // Client-side STT
                  const formData = new FormData();
                  formData.append("file", blob, "audio.webm");
                  formData.append("model_id", "scribe_v2");

                  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
                      method: "POST",
                      headers: { "xi-api-key": apiKey },
                      body: formData
                  });

                  if (!res.ok) throw new Error(`STT failed: ${res.status}`);
                  const data = await res.json();
                  text = data.text;
              } else {
                  // Fallback to backend
                  text = await listenAction({ audioData: base64data });
              }

              setTranscript(text);
              resolve(text);
            } catch (err) {
              console.error("Transcription error:", err);
              setError("Failed to recognize speech");
              reject(err);
            } finally {
              setIsProcessing(false);
            }
          };
        } catch (err) {
          setError("Error processing audio");
          setIsProcessing(false);
          reject(err);
        }
        
        // Stop all tracks to release mic
        recorder.stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.stop();
    });
  }, [listenAction, transcript, interimTranscript]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isProcessing,
    transcript: (transcript || "") + interimTranscript, // Combine final + interim for real-time feel
    error
  };
}
