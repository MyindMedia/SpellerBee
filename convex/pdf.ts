"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import * as pdf from "pdf-parse";

export const extractWordsFromPdf = action({
  args: { fileData: v.string() }, // Base64 encoded PDF
  handler: async (ctx, args) => {
    try {
      const buffer = Buffer.from(args.fileData, "base64");
      const data = await pdf(buffer);
      
      // Basic extraction logic: 
      // 1. Split by newlines or spaces
      // 2. Filter for words (alpha only, length > 2)
      // 3. Dedup
      
      const text = data.text;
      const words = text
        .split(/[\s\n,.!?]+/)
        .map(w => w.toLowerCase().trim())
        .filter(w => /^[a-z]{3,}$/.test(w)); // Only 3+ letter words, no numbers/symbols
        
      const uniqueWords = [...new Set(words)];
      
      return uniqueWords.slice(0, 100); // Limit to 100 words per import for safety
    } catch (e) {
      console.error("PDF Parse Error:", e);
      throw new Error("Failed to parse PDF");
    }
  },
});
