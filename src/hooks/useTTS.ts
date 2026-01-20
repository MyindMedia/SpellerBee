import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { speak as browserSpeak } from "@/utils/speech";

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const speakAction = useAction(api.eleven.generateAudio);

  const speak = useCallback(async (text: string) => {
    setIsPlaying(true);
    setError(null);
    
    try {
      // 1. Try ElevenLabs
      const audioBase64 = await speakAction({ text });
      
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        audio.play().catch(reject);
      });

    } catch (err) {
      console.error("ElevenLabs TTS failed:", err);
      // 2. Fallback to Browser TTS
      browserSpeak(text);
    } finally {
      setIsPlaying(false);
    }
  }, [speakAction]);

  return { speak, isPlaying, error };
}
