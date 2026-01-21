import { describe, expect, it } from "vitest";
import { speak } from "@/utils/speech";

describe("speak", () => {
  it("returns false in non-browser environments", async () => {
    expect(await speak("hello")).toBe(false);
  });
});

