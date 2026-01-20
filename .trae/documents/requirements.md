# Sienna Bee – Requirements

## Goal
Build a single-page spelling practice app for 4th-grade spelling bee preparation with audio pronunciation, instant feedback, and mastery tracking.

## Users
- Primary: Sienna (4th grade).
- Secondary: Parent/teacher (developer/admin only for seeding).

## Spelling Levels
- One Bee
- Two Bee
- Three Bee

## Study Loop
- User selects a level.
- App loads words for the level and merges progress state.
- App excludes words marked `mastered` from the active queue.
- App prioritizes words marked `trouble`, then words with no progress (`new`).
- App displays:
  - A speaker button to pronounce the current word.
  - A text input for the user to type the spelling.
  - The word text is not shown during the attempt.

## Validation & Feedback
- On Enter:
  - If correct:
    - Show success feedback and trigger confetti.
    - Offer a “Mark Mastered” action.
  - If incorrect:
    - Show “Try again” feedback.
    - Update progress to `trouble` and increment attempts.

## Mastery Tracking
- “Mark Mastered” sets status to `mastered`.
- Mastered words are removed from the active queue for the selected level.

## Audio (TTS)
- Uses the browser’s `SpeechSynthesisUtterance`.
- Rate: `0.8`.

## Admin / Seeding
- Developer-only UI for seeding initial word lists.
- Seeding is idempotent (safe to run multiple times without duplicates).

## Non-Functional
- Distraction-free kid-friendly UI.
- Fast loads and smooth interactions.
- Vercel-ready SPA deployment.
