import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Trophy } from "lucide-react";
import StickerChart from "@/components/StickerChart";
import { useAppStore } from "@/store/useAppStore";
import { anyApi } from "convex/server";
import { useQuery } from "convex/react";

export default function Awards() {
  const navigate = useNavigate();
  const childName = useAppStore((state) => state.childName) || "Speller";
  const studentId = useAppStore((state) => state.studentId);
  const activeUserId = studentId || childName || "anonymous";
  
  // We need to fetch counts for all levels to show total progress
  const wordCounts = useQuery(anyApi.myFunctions.getWordCounts); // This might need update to get mastered count per level?
  // Currently getMasteredCount requires a level arg.
  // Let's just use the StickerChart component which expects a single count for now, 
  // or maybe we sum them up?
  // Ideally, awards should track total mastery across the app.
  
  // For now, let's just re-use the StickerChart but make it look grander.
  // Since StickerChart takes a count, we need to pass the current level's count or a global count.
  // Let's fetch counts for all levels individually
  const count1 = useQuery(anyApi.myFunctions.getMasteredCount, { level: "One Bee", userId: activeUserId }) ?? 0;
  const count2 = useQuery(anyApi.myFunctions.getMasteredCount, { level: "Two Bee", userId: activeUserId }) ?? 0;
  const count3 = useQuery(anyApi.myFunctions.getMasteredCount, { level: "Three Bee", userId: activeUserId }) ?? 0;
  
  const totalMastered = count1 + count2 + count3;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-100 to-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Spelling
        </button>

        <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-amber-400 shadow-xl ring-4 ring-white">
                <Trophy className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-black text-zinc-900">{childName}'s Trophy Room</h1>
            <p className="mt-2 text-lg font-medium text-zinc-600">
                You have mastered <span className="font-bold text-amber-600">{totalMastered}</span> words in total!
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-zinc-100">
                <h3 className="mb-4 text-center text-xl font-black text-zinc-900">One Bee</h3>
                <StickerChart count={count1} />
            </div>
             <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-zinc-100">
                <h3 className="mb-4 text-center text-xl font-black text-zinc-900">Two Bee</h3>
                <StickerChart count={count2} />
            </div>
             <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-zinc-100">
                <h3 className="mb-4 text-center text-xl font-black text-zinc-900">Three Bee</h3>
                <StickerChart count={count3} />
            </div>
        </div>
      </div>
    </div>
  );
}
