import { useState, useEffect } from "react";
import { type Level } from "@/data/wordLists";
import { Star, Check, X } from "lucide-react";

const LEVEL_INFO: Record<Level, { title: string; desc: string; color: string }> = {
  "One Bee": {
    title: "One Bee",
    desc: "Short 3-letter words. Perfect for warming up!",
    color: "bg-emerald-100 text-emerald-800",
  },
  "Two Bee": {
    title: "Two Bee",
    desc: "Longer words with tricky sounds. You can do it!",
    color: "bg-blue-100 text-blue-800",
  },
  "Three Bee": {
    title: "Three Bee",
    desc: "Expert level! Big words for big brains.",
    color: "bg-purple-100 text-purple-800",
  },
};

export default function LevelSelect(props: {
  value: Level;
  onChange: (level: Level) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<Level | null>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value as Level;
    if (newLevel === props.value) return;
    
    setPendingLevel(newLevel);
    setShowModal(true);
  };

  const confirmChange = () => {
    if (pendingLevel) {
      props.onChange(pendingLevel);
    }
    setShowModal(false);
    setPendingLevel(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          className="h-10 rounded-2xl border-2 border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-900 shadow-sm outline-none transition hover:border-zinc-300 focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20"
          value={props.value}
          onChange={handleSelect}
        >
          <option value="One Bee">One Bee</option>
          <option value="Two Bee">Two Bee</option>
          <option value="Three Bee">Three Bee</option>
        </select>
      </div>

      {showModal && pendingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in fade-in zoom-in duration-200 rounded-3xl bg-white p-6 shadow-2xl">
            <div className={`mb-4 inline-flex rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider ${LEVEL_INFO[pendingLevel].color}`}>
              New Level Unlocked
            </div>
            
            <h3 className="mb-2 text-2xl font-black text-zinc-900">
              Ready for {LEVEL_INFO[pendingLevel].title}?
            </h3>
            
            <p className="mb-8 text-lg font-medium text-zinc-600">
              {LEVEL_INFO[pendingLevel].desc}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-zinc-100 bg-white py-3 font-bold text-zinc-600 hover:bg-zinc-50"
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
              <button
                onClick={confirmChange}
                className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 font-bold text-white shadow-lg hover:bg-zinc-800"
              >
                <Check className="h-5 w-5" />
                Start!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
