
import { useCallback, useRef } from "react";

export function useSound() {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.current.state === "suspended") {
      void audioContext.current.resume();
    }
    return audioContext.current;
  }, []);

  const playSuccess = useCallback(() => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // "Ding" sound: High sine wave with quick decay
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, [initAudio]);

  const playError = useCallback(() => {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // "Buzz" sound: Low sawtooth with short duration
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [initAudio]);

  const playConfetti = useCallback(() => {
     // A cheerful major arpeggio
     const ctx = initAudio();
     const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
     const now = ctx.currentTime;
     
     notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = "triangle";
        
        const time = now + (i * 0.08);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        
        osc.start(time);
        osc.stop(time + 0.4);
     });
  }, [initAudio]);

  return { playSuccess, playError, playConfetti };
}
