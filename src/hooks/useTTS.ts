import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { speak as browserSpeak } from "@/utils/speech";
import { audioManager } from "@/utils/audioManager";

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const speakAction = useAction(api.eleven.generateAudio);

  const speak = useCallback(async (text: string, opts?: { voiceId?: string }) => {
    setIsPlaying(true);
    setError(null);
    
    try {
      // 1. Try ElevenLabs
      const audioBase64 = await speakAction({ text, voiceId: opts?.voiceId });
      
      if (audioBase64) {
          const url = `data:audio/mp3;base64,${audioBase64}`;
          await audioManager.play(url);
      } else {
          throw new Error("No audio data returned");
      }

    } catch (err) {
      console.error("ElevenLabs TTS failed:", err);
      // 2. Fallback to Browser TTS
      // Browser TTS doesn't use the audioManager directly but we should still stop others
      audioManager.stop();
      browserSpeak(text, opts);
    } finally {
      setIsPlaying(false);
    }
  }, [speakAction]);

  return { speak, isPlaying, error };
}
