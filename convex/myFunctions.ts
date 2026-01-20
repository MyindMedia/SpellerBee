import { mutationGeneric, queryGeneric } from "convex/server";

type ProgressStatus = "new" | "trouble" | "mastered";

type WordDoc = {
  _id: string;
  word: string;
  level: string;
  sentence?: string;
};

type ProgressDoc = {
  _id: string;
  wordId: string;
  status?: string;
  attempts?: number;
  lastPracticed?: number;
};

type StudyItem = {
  _id: string;
  word: string;
  level: string;
  sentence?: string;
  status: ProgressStatus;
  attempts: number;
  lastPracticed: number;
};

function statusRank(status: ProgressStatus) {
  if (status === "trouble") return 0;
  if (status === "new") return 1;
  return 2;
}

export const getStudyList = queryGeneric(
  async (ctx, args: { level: string }) => {
    const words = (await ctx.db
      .query("words")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .collect()) as WordDoc[];

    const progress = (await ctx.db.query("progress").collect()) as ProgressDoc[];
    const progressByWordId = new Map<string, ProgressDoc>();
    for (const p of progress) progressByWordId.set(p.wordId, p);

    const merged: StudyItem[] = words
      .map((w) => {
        const p = progressByWordId.get(w._id);
        const status: ProgressStatus = (p?.status ?? "new") as ProgressStatus;
        return {
          _id: w._id,
          word: w.word,
          level: w.level,
          sentence: w.sentence,
          status,
          attempts: p?.attempts ?? 0,
          lastPracticed: p?.lastPracticed ?? 0,
        };
      })
      .filter((w) => w.status !== "mastered")
      .sort((a, b) => {
        const rankA = statusRank(a.status);
        const rankB = statusRank(b.status);
        if (rankA !== rankB) return rankA - rankB;

        if (a.status === "trouble") {
          if (a.attempts !== b.attempts) return b.attempts - a.attempts;
          if (a.lastPracticed !== b.lastPracticed)
            return a.lastPracticed - b.lastPracticed;
        }

        return String(a.word).localeCompare(String(b.word));
      });

    return merged;
  },
);

export const getMasteredCount = queryGeneric(async (ctx) => {
  const mastered = await ctx.db
    .query("progress")
    .filter((q) => q.eq(q.field("status"), "mastered"))
    .collect();
  return mastered.length;
});


export const updateProgress = mutationGeneric(
  async (ctx, args: { wordId: string; status: "trouble" | "mastered" }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_wordId", (q) => q.eq("wordId", args.wordId))
      .first();

    if (!existing) {
      const attempts = args.status === "trouble" ? 1 : 0;
      await ctx.db.insert("progress", {
        wordId: args.wordId,
        status: args.status,
        attempts,
        lastPracticed: now,
      });
      return;
    }

    if (args.status === "trouble") {
      await ctx.db.patch(existing._id, {
        status: "trouble",
        attempts: (existing.attempts ?? 0) + 1,
        lastPracticed: now,
      });
      return;
    }

    await ctx.db.patch(existing._id, {
      status: "mastered",
      lastPracticed: now,
    });
  },
);

export const seedWords = mutationGeneric(
  async (
    ctx,
    args: { words: { word: string; level: string; sentence?: string }[] },
  ) => {
    let inserted = 0;
    let skipped = 0;

    // Use a loop to avoid hitting limits, but ideally we should batch read first.
    // However, since we are seeding level by level, let's just optimize the read.
    // Reading one by one inside a loop is bad practice in Convex (N+1 queries).
    
    // Better approach: Read ALL words for the target levels first, then compare in memory.
    const levelsToSeed = new Set(args.words.map(w => w.level));
    const existingWordsMap = new Map<string, WordDoc>();

    for (const level of levelsToSeed) {
        const wordsInLevel = await ctx.db
            .query("words")
            .withIndex("by_level", (q) => q.eq("level", level))
            .collect();
        
        for (const w of wordsInLevel) {
            existingWordsMap.set(`${w.level}:${w.word}`, w as WordDoc);
        }
    }

    for (const w of args.words) {
      const key = `${w.level}:${w.word}`;
      const existing = existingWordsMap.get(key);

      if (existing) {
        if (w.sentence && !existing.sentence) {
             // Cast to any to bypass ID type check for now, or import Id type
             await ctx.db.patch(existing._id as any, { sentence: w.sentence });
             inserted += 1;
             continue;
        }
        skipped += 1;
        continue;
      }

      await ctx.db.insert("words", {
        word: w.word,
        level: w.level,
        sentence: w.sentence,
      });
      inserted += 1;
    }

    return { inserted, skipped };
  },
);

export const getWordCounts = queryGeneric(async (ctx) => {
  const allWords = await ctx.db.query("words").collect();
  const counts: Record<string, number> = {};
  
  for (const w of allWords) {
    const lvl = (w as WordDoc).level;
    counts[lvl] = (counts[lvl] || 0) + 1;
  }
  
  return counts;
});
