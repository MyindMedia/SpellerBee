import confetti from "canvas-confetti";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSeedPanel from "@/components/AdminSeedPanel";
import LevelSelect from "@/components/LevelSelect";
import SpellingCard, { type StudyItem } from "@/components/SpellingCard";
import { useAdminEnabled } from "@/hooks/useAdminEnabled";
import type { Level } from "@/data/wordLists";
import { useAppStore } from "@/store/useAppStore";
import StickerChart from "@/components/StickerChart";
import { useTTS } from "@/hooks/useTTS";
import { Trophy } from "lucide-react";

function pickNextId(items: StudyItem[], currentId: string | null) {
  if (items.length === 0) return null;
  if (!currentId) return items[0]._id;
  const idx = items.findIndex((x) => x._id === currentId);
  if (idx === -1) return items[0]._id;
  return items[(idx + 1) % items.length]._id;
}

export default function Home() {
  const [level, setLevel] = useState<Level>("One Bee");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const admin = useAdminEnabled();
  const { speak } = useTTS();
  const childName = useAppStore((state) => state.childName);
  const studentId = useAppStore((state) => state.studentId);
  const activeUserId = studentId || childName || "anonymous";
  const navigate = useNavigate();

  // Load user settings to get preferred voice
  const userSettings = useQuery(anyApi.settings.getSettings);
  const voiceId = userSettings?.voiceId;

  const itemsRaw = useQuery(anyApi.myFunctions.getStudyList, { level, userId: activeUserId });
  const items = useMemo(() => {
      const list = (itemsRaw ?? []) as StudyItem[];
      if (!list.length) return [];

      // Group by status/priority to preserve learning order, but shuffle within groups
      const trouble = list.filter(i => i.status === "trouble");
      const newWords = list.filter(i => i.status === "new");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mastered = list.filter(i => (i.status as any) === "mastered");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const others = list.filter(i => i.status !== "trouble" && i.status !== "new" && (i.status as any) !== "mastered");

      // Simple shuffle function
      const shuffle = (array: StudyItem[]) => {
          return array.sort(() => Math.random() - 0.5);
      };

      // Keep trouble words at top (but shuffled among themselves)
      // Then new words (shuffled)
      // Then others (shuffled)
      return [
          ...shuffle(trouble),
          ...shuffle(newWords),
          ...shuffle(others),
          ...mastered // Mastered usually filtered out by backend but just in case
      ];
  }, [itemsRaw]);

  const remainingCount = itemsRaw ? items.length : 0;

  useEffect(() => {
    if (!itemsRaw) return;
    if (items.length === 0) {
      setCurrentId(null);
      return;
    }
    if (currentId && items.some((w) => w._id === currentId)) return;
    setCurrentId(items[0]._id);
  }, [currentId, items, itemsRaw]);

  const current = useMemo(() => {
    if (!currentId) return null;
    return items.find((w) => w._id === currentId) ?? null;
  }, [currentId, items]);

  const updateProgress = useMutation(anyApi.myFunctions.updateProgress);
  const masteredCount = useQuery(anyApi.myFunctions.getMasteredCount, { level, userId: activeUserId }) ?? 0;

  const header = (
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5">
      <div>
        <div className="text-xl font-black tracking-tight text-zinc-900">
          Speller Bee 🐝
        </div>
        <div className="text-sm font-medium text-zinc-600">
          Hi, <span className="font-bold text-amber-600">{childName}</span>! Let's spell!
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
            onClick={() => navigate("/awards")}
            className="flex flex-col items-end mr-2 hover:opacity-80 transition"
        >
            <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Awards</span>
            <span className="flex items-center gap-1 text-lg font-black text-amber-500 tabular-nums leading-none">
                <Trophy className="w-4 h-4" />
                {masteredCount}
            </span>
        </button>
        <LevelSelect value={level} onChange={setLevel} />
        {/* Admin panel removed as requested */}
      </div>
    </div>
  );

  useEffect(() => {
    if (!childName) return;
    if (voiceId === undefined) return; // Wait for settings to load (can be null if not set, but undefined is loading)
    
    // Only greet once per session or level change if desired
    // For now, let's just greet on mount
    void speak(`Welcome back, ${childName}! Let's get spelling!`, { voiceId: voiceId || undefined });
  }, [childName, speak, voiceId]); 

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#FFF7CC] via-white to-white">
      {header}

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 pb-10">
        {ttsError ? (
          <div className="w-full max-w-xl rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {ttsError}
          </div>
        ) : null}

        {!itemsRaw ? (
          <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-48 animate-pulse rounded bg-zinc-100" />
            <div className="mt-4 h-12 w-full animate-pulse rounded-2xl bg-zinc-100" />
            <div className="mt-4 h-11 w-40 animate-pulse rounded-2xl bg-zinc-100" />
          </div>
        ) : current ? (
          <SpellingCard
            item={current}
            remainingCount={remainingCount}
            voiceId={voiceId}
            onSpeak={() => {
              setTtsError(null);
              // speak function from useTTS hook
              void speak(current.word, { voiceId });
            }}
            onCorrect={() => {
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.7 },
                colors: ["#FFD700", "#16a34a", "#0ea5e9", "#f97316"],
              });
            }}
            onMarkTrouble={async () => {
              await updateProgress({ wordId: current._id, status: "trouble", userId: activeUserId });
            }}
            onMarkMastered={async () => {
              const next = pickNextId(items, current._id);
              setCurrentId(next);
              await updateProgress({ wordId: current._id, status: "mastered", userId: activeUserId });
            }}
            onSkip={() => {
              setCurrentId(pickNextId(items, current._id));
            }}
          />
        ) : (
          <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="text-lg font-extrabold text-zinc-900">
              All mastered!
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-600">
              Pick another level or seed more words.
            </div>
          </div>
        )}

        {/* Developer hint hidden */}
        
        <StickerChart count={masteredCount} />
      </div>

      {/* Hidden Parent Dashboard Access */}
      <button
        onClick={() => navigate("/parent/dashboard")}
        className="fixed bottom-4 left-4 rounded-lg p-2 text-xs font-bold text-zinc-300 opacity-50 hover:bg-zinc-100 hover:text-zinc-600 hover:opacity-100"
      >
        Parent Dashboard
      </button>
    </div>
  );
}
