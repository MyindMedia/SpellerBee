import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { ArrowRight, Volume2, Mic, Keyboard } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

export default function Tutorial() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setHasSeenTutorial = useAppStore((state) => state.setHasSeenTutorial);
  const { speak } = useTTS();

  const steps = [
    {
      title: "Listen carefully!",
      desc: "Tap the speaker button to hear the word.",
      icon: <Volume2 className="h-12 w-12 text-blue-500" />,
      voice: "Tap the speaker button to hear the word.",
    },
    {
      title: "Say it or Type it!",
      desc: "Use the microphone to spell out loud, or type the letters.",
      icon: <div className="flex gap-4"><Mic className="h-12 w-12 text-rose-500" /><Keyboard className="h-12 w-12 text-purple-500" /></div>,
      voice: "You can use the microphone to spell out loud, or type the letters.",
    },
    {
      title: "Earn Stickers!",
      desc: "Master 10 words to get a shiny sticker for your chart.",
      icon: <span className="text-5xl">⭐</span>,
      voice: "Master 10 words to get a shiny sticker for your chart.",
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      void speak(steps[step + 1].voice);
    } else {
      setHasSeenTutorial(true);
      navigate("/");
    }
  };

  // Speak first step on mount
  useState(() => {
    void speak(steps[0].voice);
  });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 text-center">
      <div className="w-full max-w-lg rounded-3xl bg-[#FFF7CC] p-8 shadow-2xl ring-4 ring-white">
        <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-white p-6 shadow-md">
                {steps[step].icon}
            </div>
        </div>
        
        <h2 className="mb-4 text-3xl font-black text-zinc-900">
          {steps[step].title}
        </h2>
        <p className="mb-8 text-xl font-medium text-zinc-700">
          {steps[step].desc}
        </p>

        <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
                <div key={i} className={`h-3 rounded-full transition-all ${i === step ? "w-8 bg-amber-500" : "w-3 bg-amber-200"}`} />
            ))}
        </div>

        <button
          onClick={handleNext}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
        >
          {step === steps.length - 1 ? "I'm Ready!" : "Next"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
