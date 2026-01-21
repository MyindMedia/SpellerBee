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
  userId: string;
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
  async (ctx, args: { level: string; userId: string }) => {
    const words = (await ctx.db
      .query("words")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .collect()) as WordDoc[];

    // Filter progress by userId
    const progress = (await ctx.db
      .query("progress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()) as ProgressDoc[];

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

export const getMasteredCount = queryGeneric(async (ctx, args: { level: string; userId: string }) => {
    // We need to count mastered words for a specific user in a specific level
    // Since progress doesn't store level directly, we have to join or filter
    
    // 1. Get all mastered progress for this user
    const userMastered = await ctx.db
        .query("progress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("status"), "mastered"))
        .collect();
        
    if (userMastered.length === 0) return 0;

    // 2. Get words for this level
    // This is slightly inefficient but safe for small datasets (kids vocab)
    const levelWords = await ctx.db
        .query("words")
        .withIndex("by_level", (q) => q.eq("level", args.level))
        .collect();
        
    const levelWordIds = new Set(levelWords.map(w => w._id));

    // 3. Intersect
    let count = 0;
    for (const p of userMastered) {
        if (levelWordIds.has(p.wordId)) {
            count++;
        }
    }

    return count;
});


export const updateProgress = mutationGeneric(
  async (ctx, args: { wordId: string; status: "trouble" | "mastered"; userId: string }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("progress")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_user_word", (q) => (q.eq("userId", args.userId) as any).eq("wordId", args.wordId as any))
      .first();

    if (!existing) {
      const attempts = args.status === "trouble" ? 1 : 0;
      await ctx.db.insert("progress", {
        userId: args.userId,
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
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
