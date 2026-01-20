import { useState, useRef, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const listenAction = useAction(api.eleven.listen);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.start();
      setIsRecording(true);
      setError(null);
      setTranscript(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    
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
                  // Client-side STT to bypass cloud IP block
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
  }, [listenAction]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    isProcessing,
    transcript,
    error
  };
}
