import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  RotateCcw,
  SkipForward,
  Volume2,
  X,
  Lightbulb,
  Gamepad2,
  Keyboard,
  Mic,
} from "lucide-react";
import { isCorrectGuess } from "@/utils/spelling";
import { useSound } from "@/hooks/useSound";
import { useTTS } from "@/hooks/useTTS";
import { useVoiceInput } from "@/hooks/useVoiceInput";

type StudyStatus = "new" | "trouble";

export type StudyItem = {
  _id: string;
  word: string;
  level: string;
  sentence?: string;
  status: StudyStatus;
  attempts: number;
};

type ScrambleChar = {
  id: number;
  char: string;
  used: boolean;
};

export default function SpellingCard(props: {
  item: StudyItem;
  remainingCount: number;
  onSpeak: () => void;
  onMarkTrouble: () => Promise<void> | void;
  onMarkMastered: () => Promise<void> | void;
  onSkip: () => void;
  onCorrect: () => void;
  voiceId?: string; // Added voiceId prop
}) {
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<"idle" | "correct" | "incorrect">(
    "idle",
  );
  const [showHint, setShowHint] = useState(false);
  const [mode, setMode] = useState<"standard" | "scramble">("standard");
  const [scrambleChars, setScrambleChars] = useState<ScrambleChar[]>([]);
  const { playSuccess, playError, playConfetti } = useSound();
  
  const { speak, isPlaying: isSpeaking } = useTTS();
  const { startRecording, stopRecording, isRecording, isProcessing, transcript } = useVoiceInput();

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-fill guess from voice transcript
  useEffect(() => {
    if (transcript) {
        // Normalize: remove spaces and non-alpha, lowercase
        // e.g. "C A T" -> "cat"
        const clean = transcript.replace(/[^a-zA-Z]/g, "").toLowerCase();
        setGuess(clean);
    }
  }, [transcript]);

  // Handle Auto-Listen Flow
  const handleSpeakAndListen = async () => {
    // 1. Speak
    await speak(props.item.word, { voiceId: props.voiceId });
    
    // 2. Start Listening immediately after
    // Only if not already correct and in standard mode
    if (result !== "correct" && mode === "standard") {
        void startRecording();
    }
  };

  const statusChip = useMemo(() => {
    if (props.item.status === "trouble") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
          Trouble
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
        New
      </span>
    );
  }, [props.item.status]);

  const [failedAttempts, setFailedAttempts] = useState(0);

  // Reset state when word changes
  useEffect(() => {
    setGuess("");
    setResult("idle");
    setShowHint(false);
    setFailedAttempts(0);
    
    // Stop recording if active when word changes
    if (isRecording) {
        void stopRecording();
    }
    
    // Prepare scramble chars
    const chars = props.item.word.split("").map((c, i) => ({
      id: i,
      char: c,
      used: false,
    }));
    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setScrambleChars(chars);

    if (mode === "standard") {
      inputRef.current?.focus();
    }
  }, [props.item._id, props.item.word, mode, isRecording, stopRecording]);

  async function submit() {
    // If recording, stop it first
    if (isRecording) {
        await stopRecording();
    }

    const correct = isCorrectGuess(guess, props.item.word);
    if (correct) {
      setResult("correct");
      playSuccess();
      props.onCorrect();
      return;
    }
    setResult("incorrect");
    setFailedAttempts(prev => {
        const newVal = prev + 1;
        // Trigger spell-out on 2nd failure (which is when newVal === 2)
        if (newVal === 2) {
            void handleSpellOut(props.item.word);
        }
        return newVal;
    });
    playError();
    await props.onMarkTrouble();
  }

  const [spellingOverlay, setSpellingOverlay] = useState<{
    word: string;
    currentIndex: number;
    show: boolean;
  }>({ word: "", currentIndex: -1, show: false });

  const handleSpellOut = async (word: string) => {
      // Show overlay
      setSpellingOverlay({ word, currentIndex: -1, show: true });

      // Start audio
      const letters = word.split("").join(" - ");
      const text = `${word}. ${letters}. ${word}.`;
      
      // Calculate timing roughly (this is approximate without events from backend)
      // We'll animate visually based on a timer that matches speaking speed
      const totalDuration = text.length * 80; // Rough ms per char
      const letterDuration = 600; // ms per letter spoken
      const initialDelay = 1000; // Time to say first word

      // Start speaking
      void speak(text, { voiceId: props.voiceId });

      // Animate visual spelling
      // 1. First word spoken
      await new Promise(r => setTimeout(r, initialDelay));
      
      // 2. Letters spoken
      for (let i = 0; i < word.length; i++) {
          setSpellingOverlay(prev => ({ ...prev, currentIndex: i }));
          await new Promise(r => setTimeout(r, letterDuration));
      }

      // 3. Final word spoken
      setSpellingOverlay(prev => ({ ...prev, currentIndex: word.length })); // Show full word
      await new Promise(r => setTimeout(r, 1000));
      
      // Hide after done
      setSpellingOverlay({ word: "", currentIndex: -1, show: false });
  };

  function handleScrambleClick(charId: number) {
    if (result === "correct") return;
    
    setScrambleChars((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, used: true } : c)),
    );
    const char = scrambleChars.find((c) => c.id === charId)?.char || "";
    setGuess((prev) => prev + char);
    setResult("idle");
  }

  const feedback =
    result === "correct" ? (
      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 animate-bounce">
        <Check className="h-4 w-4" />
        Correct! 🎉
      </div>
    ) : result === "incorrect" ? (
      <div className="flex flex-col gap-2">
        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-rose-700">
            <X className="h-4 w-4" />
            Try again.
        </div>
        {failedAttempts >= 2 && (
             <div className="rounded-xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-800 ring-1 ring-amber-200 animate-in fade-in slide-in-from-top-2">
                The correct spelling is: <span className="text-lg uppercase tracking-widest">{props.item.word}</span>
            </div>
        )}
      </div>
    ) : (
      <div className="mt-3 text-sm text-zinc-600">
        {mode === "standard" ? "Press Enter to check." : "Build the word!"}
      </div>
    );

  return (
    <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Remaining: {props.remainingCount}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {statusChip}
            <span className="text-xs font-medium text-zinc-500">
              Attempts: {props.item.attempts}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            type="button"
            onClick={() => setMode(mode === "standard" ? "scramble" : "standard")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50"
            title={mode === "standard" ? "Switch to Scramble Game" : "Switch to Standard Mode"}
          >
            {mode === "standard" ? <Gamepad2 className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
          </button>
          
          <button
            type="button"
            onClick={handleSpeakAndListen}
            disabled={isSpeaking || isRecording}
            className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-4 ${
                isRecording 
                ? "bg-rose-500 text-white animate-pulse ring-rose-200" 
                : "bg-[#FFD700] text-zinc-900 hover:brightness-95 ring-[#FFD700]/30"
            } disabled:opacity-50`}
            title={isRecording ? "Listening..." : "Hear word & Speak"}
          >
            {isRecording ? (
                <>
                    <Mic className="h-4 w-4 animate-bounce" />
                    Listening...
                </>
            ) : (
                <>
                    <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                    Speak
                </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8">
        
        {/* Hint Section */}
        {props.item.sentence && (
            <div className="mb-6">
                {!showHint ? (
                    <button 
                        onClick={() => setShowHint(true)}
                        // Only show hint button if 2 failed attempts
                        disabled={failedAttempts < 2}
                        className={`text-xs font-medium flex items-center gap-1 ${failedAttempts < 2 ? "text-zinc-300 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
                        title={failedAttempts < 2 ? "Hint unlocks after 2 incorrect tries" : "Show Hint"}
                    >
                        <Lightbulb className="w-3 h-3" /> Show Hint Sentence {failedAttempts < 2 && "(Locked)"}
                    </button>
                ) : (
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-900 text-lg font-medium text-center animate-in fade-in zoom-in">
                        {props.item.sentence.replace("___", "_______")}
                    </div>
                )}
            </div>
        )}

        {mode === "standard" ? (
          <>
            <label className="block text-sm font-semibold text-zinc-800">
              Type the spelling
            </label>
            <div className="mt-2 flex items-center gap-3">
                <div className="relative flex-1">
                    <input
                    ref={inputRef}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") void submit();
                    }}
                    className={`h-14 w-full rounded-2xl border bg-white px-4 text-xl text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-300 ${
                        isRecording 
                        ? "border-rose-400 ring-4 ring-rose-100" 
                        : "border-zinc-200 focus:border-zinc-300 focus:ring-4 focus:ring-[#FFD700]/20"
                    }`}
                    placeholder={isRecording ? "Say the letters..." : isProcessing ? "Thinking..." : "Type here…"}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    disabled={result === "correct" || isProcessing}
                    />
                    {/* Animated Letter Reveal Effect Overlay (Optional, or just rely on input value update) */}
                </div>
                
                <button
                    type="button"
                    onClick={() => {
                        if (isRecording) void stopRecording();
                        else void startRecording();
                    }}
                    disabled={result === "correct" || isProcessing}
                    className={`flex-none h-14 w-14 inline-flex items-center justify-center rounded-2xl transition-all shadow-sm border ${
                        isRecording 
                        ? "bg-rose-500 border-rose-600 text-white scale-105 shadow-md animate-pulse ring-4 ring-rose-200" 
                        : "bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                    title={isRecording ? "Stop Listening" : "Start Listening"}
                >
                    <Mic className="h-6 w-6" />
                </button>
            </div>
          </>
        ) : (
            <div className="flex flex-col items-center">
                <div className="h-16 w-full flex items-center justify-center gap-2 border-b-2 border-zinc-100 mb-6">
                    {guess.split("").map((char, i) => (
                        <span key={i} className="text-3xl font-bold text-zinc-800 animate-in fade-in zoom-in duration-200">
                            {char}
                        </span>
                    ))}
                    {guess.length === 0 && <span className="text-zinc-300 italic">Tap letters below</span>}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    {scrambleChars.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleScrambleClick(item.id)}
                            disabled={item.used || result === "correct"}
                            className={`
                                h-14 w-14 rounded-xl text-2xl font-bold shadow-sm transition-all
                                ${item.used 
                                    ? "bg-zinc-100 text-zinc-300 scale-90" 
                                    : "bg-white border-2 border-[#FFD700] text-zinc-900 hover:-translate-y-1 hover:shadow-md active:scale-95"
                                }
                            `}
                        >
                            {item.char}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="h-8">{feedback}</div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {result === "correct" ? (
          <button
            type="button"
            onClick={() => {
                void props.onMarkMastered();
                playConfetti();
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          >
            <Check className="h-4 w-4" />
            Mark Mastered
          </button>
        ) : (
          <>
            <button
                type="button"
                onClick={() => void submit()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-200"
            >
                Check
            </button>
            <button
                type="button"
                onClick={() => {
                setGuess("");
                setResult("idle");
                if (mode === "scramble") {
                     setScrambleChars((prev) => prev.map(c => ({...c, used: false})));
                } else {
                    inputRef.current?.focus();
                }
                }}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-100"
            >
                <RotateCcw className="h-4 w-4" />
                Clear
            </button>
          </>
        )}

        <button
          type="button"
          onClick={props.onSkip}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-100"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Visual Spelling Overlay */}
      {spellingOverlay.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex gap-2">
                {spellingOverlay.word.split("").map((char, index) => (
                    <div 
                        key={index}
                        className={`
                            flex h-20 w-16 items-center justify-center rounded-2xl text-4xl font-black shadow-lg transition-all duration-300
                            ${index === spellingOverlay.currentIndex 
                                ? "scale-125 bg-amber-400 text-white ring-4 ring-amber-200 -translate-y-4" 
                                : index < spellingOverlay.currentIndex || spellingOverlay.currentIndex === spellingOverlay.word.length
                                    ? "bg-white text-zinc-900 opacity-100"
                                    : "bg-white/10 text-white/20 opacity-50"
                            }
                        `}
                    >
                        {char}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
