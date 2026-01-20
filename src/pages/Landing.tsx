import { useNavigate } from "react-router-dom";
import { User, GraduationCap } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="mb-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFD700] shadow-xl">
            <span className="text-5xl">🐝</span>
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-black text-zinc-900">Speller Bee</h1>
        <p className="text-xl font-medium text-zinc-600">Who is using the app today?</p>
      </div>

      <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
        <button
          onClick={() => navigate("/welcome")}
          className="group relative flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-xl ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
        >
          <div className="mb-4 rounded-full bg-amber-100 p-6 text-amber-600 group-hover:bg-amber-200">
            <User className="h-10 w-10" />
          </div>
          <span className="text-2xl font-black text-zinc-900">Student</span>
          <span className="mt-2 text-sm font-medium text-zinc-500">I want to play!</span>
        </button>

        <button
          onClick={() => navigate("/parent/login")}
          className="group relative flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-xl ring-1 ring-zinc-100 transition hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
        >
          <div className="mb-4 rounded-full bg-blue-100 p-6 text-blue-600 group-hover:bg-blue-200">
            <GraduationCap className="h-10 w-10" />
          </div>
          <span className="text-2xl font-black text-zinc-900">Parent</span>
          <span className="mt-2 text-sm font-medium text-zinc-500">Manage account</span>
        </button>
      </div>
    </div>
  );
}
