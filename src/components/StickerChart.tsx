
import { Star } from "lucide-react";

export default function StickerChart(props: { count: number }) {
  const earned = Math.floor(props.count / 10);
  const progress = props.count % 10;

  return (
    <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm mt-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900">Sticker Chart</h3>
        <span className="text-xs font-medium text-zinc-500">
          {10 - progress} more for next sticker!
        </span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Earned Stickers */}
        {Array.from({ length: earned }).map((_, i) => (
          <div 
            key={i} 
            className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 animate-in zoom-in duration-300"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          </div>
        ))}

        {/* Next Sticker Progress */}
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 border-2 border-dashed border-zinc-200">
            <div 
                className="absolute inset-0 rounded-full bg-amber-100 opacity-20 transition-all duration-500"
                style={{ clipPath: `inset(${100 - (progress * 10)}% 0 0 0)` }}
            />
            <span className="text-xs font-bold text-zinc-400">{progress}/10</span>
        </div>
      </div>
    </div>
  );
}
