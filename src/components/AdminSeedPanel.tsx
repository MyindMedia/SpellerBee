import { useMemo, useState } from "react";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { Bug, Database, Lock, X } from "lucide-react";
import { WORD_LISTS, type Level } from "@/data/wordLists";

function buildPayload(levels: Level[]) {
  const out: { word: string; level: string; sentence?: string }[] = [];
  for (const level of levels) {
    for (const item of WORD_LISTS[level]) {
      out.push({
        word: item.word,
        level,
        sentence: item.sentence,
      });
    }
  }
  return out;
}

export default function AdminSeedPanel(props: {
  enabled: boolean;
  onDisable: () => void;
}) {
  const seedWords = useMutation(anyApi.myFunctions.seedWords);
  const wordCounts = useQuery(anyApi.myFunctions.getWordCounts);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const allPayload = useMemo(
    () => buildPayload(["One Bee", "Two Bee", "Three Bee"]),
    [],
  );

  if (!props.enabled) return null;

  async function runSeed(levels: Level[]) {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const payload = buildPayload(levels);
      const res = await seedWords({ words: payload });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-100"
      >
        <Bug className="h-4 w-4" />
        Admin
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-zinc-900">
                  Seeding (Developer)
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Safe to run multiple times. Existing words will be skipped.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
               {wordCounts && (
                  <div className="mb-2 flex gap-4 text-xs text-zinc-500">
                     <div>One Bee: {wordCounts["One Bee"] || 0}</div>
                     <div>Two Bee: {wordCounts["Two Bee"] || 0}</div>
                     <div>Three Bee: {wordCounts["Three Bee"] || 0}</div>
                  </div>
               )}
              
              <button
                type="button"
                disabled={busy}
                onClick={() => void runSeed(["One Bee", "Two Bee", "Three Bee"])}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#FFD700] px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:brightness-95 disabled:opacity-60"
              >
                <Database className="h-4 w-4" />
                Seed All ({allPayload.length} words)
              </button>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(["One Bee", "Two Bee", "Three Bee"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={busy}
                    onClick={() => void runSeed([lvl])}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Seed {lvl}
                  </button>
                ))}
              </div>

              {result ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Inserted: {result.inserted} · Skipped: {result.skipped}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={props.onDisable}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
              >
                <Lock className="h-4 w-4" />
                Disable Admin
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

