
import { anyApi } from "convex/server";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
const AUDIO_CACHE = new Map<string, string>();

async function generateAudioClientSide(text: string, apiKey: string) {
    const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Sarah
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",
            output_format: "mp3_44100_128",
        }),
    });

    if (!response.ok) {
        throw new Error(`ElevenLabs API failed: ${response.status} ${await response.text()}`);
    }

    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function speak(text: string, opts?: { rate?: number }) {
  if (typeof window === "undefined") return false;

  // 1. Try ElevenLabs
  try {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (AUDIO_CACHE.has(cacheKey)) {
        const audio = new Audio(AUDIO_CACHE.get(cacheKey));
        await audio.play();
        return true;
    }

    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    let url: string;

    if (apiKey) {
        console.log("Using Client-Side ElevenLabs API");
        url = await generateAudioClientSide(text, apiKey);
    } else {
        console.log("Using Backend ElevenLabs Action");
        const base64 = await convex.action(anyApi.eleven.generateAudio, { text });
        if (!base64) throw new Error("No audio returned");
        url = `data:audio/mp3;base64,${base64}`;
    }
    
    // Cache it
    AUDIO_CACHE.set(cacheKey, url);

    const audio = new Audio(url);
    await audio.play();
    return true;

  } catch (e) {
    console.warn("ElevenLabs TTS failed, falling back to browser TTS", e);
    // Continue to fallback below...
  }

  // 2. Fallback to Browser Speech Synthesis
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts?.rate ?? 0.8;
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoiceNames = [
    "Google US English", "Samantha", "Microsoft Zira", 
    "Karen", "Tessa", "Google UK English Female"
  ];

  const voice = 
    voices.find(v => preferredVoiceNames.includes(v.name)) || 
    voices.find(v => v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Woman"))) ||
    voices.find(v => v.lang.startsWith("en"));

  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
}

// Pre-load voices
if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
