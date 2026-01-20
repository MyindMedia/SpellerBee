type Level = "One Bee" | "Two Bee" | "Three Bee";

export default function LevelSelect(props: {
  value: Level;
  onChange: (level: Level) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700">Level</span>
      <select
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm outline-none transition focus:border-zinc-300 focus:ring-4 focus:ring-[#FFD700]/20"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as Level)}
      >
        <option value="One Bee">One Bee</option>
        <option value="Two Bee">Two Bee</option>
        <option value="Three Bee">Three Bee</option>
      </select>
    </div>
  );
}

