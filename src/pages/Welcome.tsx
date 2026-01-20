import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function Welcome() {
  const [name, setName] = useState("");
  const setChildName = useAppStore((state) => state.setChildName);
  const navigate = useNavigate();

  const handleStart = () => {
    if (!name.trim()) return;
    setChildName(name.trim());
    
    // Fun confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FF69B4", "#00BFFF"]
    });

    setTimeout(() => {
      navigate("/tutorial");
    }, 1000);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FFF7CC] via-white to-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFD700] shadow-xl">
            <span className="text-5xl">🐝</span>
          </div>
        </div>
        
        <h1 className="mb-2 text-4xl font-black tracking-tight text-zinc-900">
          Speller Bee
        </h1>
        <p className="mb-8 text-lg font-medium text-zinc-600">
          Learn to spell with magic words!
        </p>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
          <label className="mb-4 block text-lg font-bold text-zinc-800">
            What is your name?
          </label>
          
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="Type your name..."
            className="mb-6 w-full rounded-2xl border-2 border-zinc-200 bg-zinc-50 px-4 py-4 text-center text-xl font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-[#FFD700] focus:outline-none focus:ring-4 focus:ring-[#FFD700]/20"
            autoFocus
          />

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFD700] px-6 py-4 text-lg font-black text-zinc-900 shadow-[0_4px_0_0_#e6c200] transition active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_#e6c200]"
          >
            <Sparkles className="h-5 w-5 transition group-hover:rotate-12" />
            Let's Go!
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
