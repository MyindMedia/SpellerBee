# Sienna Bee – Page & Component Design

## Single Page Layout
- Header
  - App title
  - Level selector (One/Two/Three Bee)
  - Optional progress stats (count remaining)
- Main card
  - Speaker button (plays TTS)
  - Input field for spelling
  - Feedback line (correct/try again)
  - Actions:
    - “Mark Mastered” (only after a correct guess)
    - “Skip” (optional)
- Footer (hidden admin affordance)

## Components
- `StudyPage`
  - Owns level state, current word selection, and feedback state.
- `SpellingCard`
  - UI for speaker, input, feedback, and actions.
- `LevelSelect`
  - Dropdown or segmented control.
- `AdminSeedPanel`
  - Hidden panel (enabled via `?admin=1` setting stored in localStorage).

## UX Notes
- Use large font sizes, high contrast, and generous spacing.
- Keep the word itself hidden while practicing.
- Confetti on correct answers.
