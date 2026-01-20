import { useNavigate } from "react-router-dom";
import { User, Users, GraduationCap } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-black text-zinc-900">Speller Bee</h1>
        <p className="mb-12 text-xl font-medium text-zinc-600">
          Who is using the app today?
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Card */}
          <button
            onClick={() => navigate("/welcome")}
            className="group relative flex flex-col items-center rounded-3xl border-2 border-zinc-100 bg-white p-10 shadow-xl transition hover:scale-105 hover:border-[#FFD700] hover:shadow-2xl"
          >
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#FFD700] shadow-lg group-hover:animate-bounce">
              <span className="text-6xl">🐝</span>
            </div>
            <h2 className="mb-2 text-3xl font-black text-zinc-900">Student</h2>
            <p className="text-lg text-zinc-500">I want to practice spelling!</p>
          </button>

          {/* Parent Card */}
          <button
            onClick={() => navigate("/parent/login")}
            className="group relative flex flex-col items-center rounded-3xl border-2 border-zinc-100 bg-white p-10 shadow-xl transition hover:scale-105 hover:border-blue-500 hover:shadow-2xl"
          >
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-lg">
              <Users className="h-16 w-16" />
            </div>
            <h2 className="mb-2 text-3xl font-black text-zinc-900">Parent</h2>
            <p className="text-lg text-zinc-500">Manage accounts & progress</p>
          </button>
        </div>
      </div>
    </div>
  );
}
