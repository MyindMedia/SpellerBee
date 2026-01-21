"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { ElevenLabsClient } from "elevenlabs";

// Initialize client
// Note: We access the API key from process.env. 
// You must set ELEVENLABS_API_KEY in your Convex dashboard or .env.local
const getClient = () => {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY is missing in environment variables");
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  console.log("ElevenLabs API Key loaded: " + apiKey.substring(0, 8) + "...");
  return new ElevenLabsClient({ apiKey });
};

export const generateAudio = action({
  args: { text: v.string(), voiceId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY is missing");
      throw new Error("ELEVENLABS_API_KEY is not set");
    }
    
    // Use provided voiceId or default to "Sarah"
    const voiceId = args.voiceId || "EXAVITQu4vr4xnSDxMaL"; 

    try {
      console.log(`Generating audio for text: "${args.text.substring(0, 20)}..." with voice: ${voiceId}`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
          model_id: "eleven_turbo_v2",
          output_format: "mp3_44100_128",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API Error:", response.status, errorText);
        throw new Error(`ElevenLabs API failed with status ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log("Audio generation successful, size:", buffer.length);
      return buffer.toString("base64");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("ElevenLabs TTS Error:", error);
      throw new Error("Failed to generate speech");
    }
  },
});

export const listen = action({
  args: { audioData: v.string() }, // Base64 encoded audio
  handler: async (ctx, args) => {
    const client = getClient();
    
    try {
      // Convert base64 to Buffer
      const audioBuffer = Buffer.from(args.audioData, "base64");
      
      // Scribe API expects a file-like object or blob.
      // The SDK's speechToText.convert method signature:
      // (file: File | Blob | ReadStream, ...)
      
      // We can create a Blob from the buffer
      const blob = new Blob([audioBuffer], { type: "audio/webm" });

      const transcription = await client.speechToText.convert({
        file: blob,
        model_id: "scribe_v2",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // The SDK response type might vary, checking documentation it returns an object with text.
      // We cast to any to avoid strict type checks if the SDK types are slightly off.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (transcription as any).text;

    } catch (error) {
      console.error("ElevenLabs STT Error:", error);
      throw new Error("Failed to transcribe audio");
    }
  },
});
