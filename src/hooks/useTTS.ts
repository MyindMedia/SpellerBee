import { useState, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { speak as browserSpeak } from "@/utils/speech";

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const speakAction = useAction(api.eleven.generateAudio);

  const speak = useCallback(async (text: string, opts?: { voiceId?: string }) => {
    // Cancel any current browser speech
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    // Stop any current audio
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    setIsPlaying(true);
    setError(null);
    
    try {
      // 1. Try ElevenLabs
      const audioBase64 = await speakAction({ text, voiceId: opts?.voiceId });
      
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioRef.current = audio;
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
            resolve();
            setIsPlaying(false);
        };
        audio.onerror = (e) => {
            reject(e);
            setIsPlaying(false);
        };
        audio.play().catch((e) => {
            // Abort error is expected if we pause/cancel
            if (e.name !== "AbortError") reject(e);
        });
      });

    } catch (err) {
      console.error("ElevenLabs TTS failed:", err);
      // 2. Fallback to Browser TTS
      browserSpeak(text, opts);
      setIsPlaying(false);
    }
  }, [speakAction]);

  return { speak, isPlaying, error };
}
