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

  const itemsRaw = useQuery(anyApi.myFunctions.getStudyList, { level, userId: activeUserId });
  const items = useMemo(() => (itemsRaw ?? []) as StudyItem[], [itemsRaw]);

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
        {/* Only show Admin panel if enabled via URL previously */}
        {admin.enabled && <AdminSeedPanel enabled={admin.enabled} onDisable={admin.disable} />}
      </div>
    </div>
  );

  useEffect(() => {
    // Only greet once per session or level change if desired
    // For now, let's just greet on mount
    void speak(`Welcome back, ${childName}! Let's get spelling!`);
  }, [childName, speak]); 

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
            onSpeak={() => {
              setTtsError(null);
              // speak function from useTTS hook
              void speak(current.word);
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

        {/* Hiding the developer hint for kids version, unless admin enabled */}
        {admin.enabled && (
             <div className="w-full max-w-xl text-center text-xs font-medium text-zinc-500">
                Developer seeding: add <span className="font-mono">?admin=1</span> to the URL.
            </div>
        )}
        
        <StickerChart count={masteredCount} />
      </div>
    </div>
  );
}
