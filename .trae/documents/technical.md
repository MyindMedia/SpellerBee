# Sienna Bee – Technical Design

## Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Backend/DB: Convex
- Hosting: Vercel (SPA)

## Data Model (Convex)
Tables:
- `words` (static dictionary)
  - `word: string`
  - `level: string` ("One Bee" | "Two Bee" | "Three Bee")
  - `definition?: string`
  - Indexes:
    - `by_level(level)`
    - `by_level_word(level, word)` for idempotent seeding
- `progress` (user state)
  - `wordId: Id<"words">`
  - `status: "new" | "trouble" | "mastered"`
  - `attempts: number`
  - `lastPracticed: number` (unix ms)
  - Index:
    - `by_wordId(wordId)`

## Convex Functions
- Query: `getStudyList({ level })`
  - Load all `words` for `level`.
  - Load all `progress` records.
  - Merge status per word (`new` if missing).
  - Filter out `mastered`.
  - Sort: `trouble` first (higher attempts first), then `new`.
- Mutation: `updateProgress({ wordId, status })`
  - Upsert progress by `wordId`.
  - For `trouble`: set status, increment attempts, update `lastPracticed`.
  - For `mastered`: set status, update `lastPracticed`.
- Mutation: `seedWords({ words })`
  - For each (word, level): insert into `words` if not present.
  - Return counts inserted/skipped.

## Frontend Integration
- `ConvexProvider` wraps the React app.
- Uses `useQuery` for `getStudyList`.
- Uses `useMutation` for `updateProgress` and `seedWords`.

## Deployment
- Vercel SPA rewrite to `index.html`.
- Environment variable `VITE_CONVEX_URL` must be set in Vercel.
