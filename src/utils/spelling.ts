export function normalizeForCompare(value: string) {
  const collapsed = value
    .trim()
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .toLowerCase();

  return collapsed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function isCorrectGuess(guess: string, answer: string) {
  return normalizeForCompare(guess) === normalizeForCompare(answer);
}

