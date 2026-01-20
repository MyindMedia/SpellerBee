import { describe, expect, it } from "vitest";
import { isCorrectGuess, normalizeForCompare } from "@/utils/spelling";

describe("normalizeForCompare", () => {
  it("trims, lowercases, collapses whitespace", () => {
    expect(normalizeForCompare("  Hello   World  ")).toBe("hello world");
  });

  it("removes diacritics", () => {
    expect(normalizeForCompare("señor")).toBe("senor");
  });
});

describe("isCorrectGuess", () => {
  it("matches case-insensitively", () => {
    expect(isCorrectGuess("February", "february")).toBe(true);
  });

  it("matches without diacritics", () => {
    expect(isCorrectGuess("senor", "señor")).toBe(true);
  });

  it("does not match different words", () => {
    expect(isCorrectGuess("window", "widow")).toBe(false);
  });
});

