import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles, ArrowRight, User } from "lucide-react";
import confetti from "canvas-confetti";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";

export default function Welcome() {
  const [name, setName] = useState("");
  const setChildName = useAppStore((state) => state.setChildName);
  const setStudentId = useAppStore((state) => state.setStudentId);
  const navigate = useNavigate();
  const { user } = useUser();
  
  // If parent is logged in, fetch their students
  const students = useQuery(anyApi.parent.getStudents) ?? [];

  const handleStart = (studentName: string, studentId: string | null = null) => {
    if (!studentName.trim()) return;
    setChildName(studentName.trim());
    setStudentId(studentId);
    
    // Fun confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FF69B4", "#00BFFF"]
    });

    setTimeout(() => {
      navigate("/tutorial");
    }, 1000);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#FFF7CC] via-white to-white px-4">
      <div className="w-full max-w-md text-center">
        <button 
            onClick={handleBack}
            className="mb-4 text-sm font-bold text-zinc-400 hover:text-zinc-600"
        >
            ← Back
        </button>
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFD700] shadow-xl">
            <span className="text-5xl">🐝</span>
          </div>
        </div>
        
        <h1 className="mb-2 text-4xl font-black tracking-tight text-zinc-900">
          Speller Bee
        </h1>
        <p className="mb-8 text-lg font-medium text-zinc-600">
          Learn to spell with magic words!
        </p>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
          {user ? (
             students.length > 0 ? (
             <div className="mb-6">
                <p className="mb-4 text-lg font-bold text-zinc-800">Who is playing?</p>
                <div className="grid grid-cols-2 gap-3">
                    {students.map(s => (
                        <button
                            key={s._id}
                            onClick={() => handleStart(s.name, s._id)}
                            className="flex flex-col items-center rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                        >
                            <div className="mb-2 rounded-full bg-blue-100 p-3 text-blue-600">
                                <User className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-zinc-900">{s.name}</span>
                        </button>
                    ))}
                </div>
             </div>
             ) : (
                <div className="text-center">
                    <p className="mb-4 text-lg font-bold text-zinc-800">No students found.</p>
                    <p className="text-zinc-600 mb-6">Ask your parent to add you in the dashboard.</p>
                    <button
                        onClick={() => navigate("/parent/dashboard")}
                        className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
             )
          ) : (
            <div className="text-center">
                <p className="mb-4 text-lg font-medium text-zinc-600">
                    Students must be added by a parent to play.
                </p>
                <button
                    onClick={() => navigate("/parent/login")}
                    className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-blue-700"
                >
                    Parent Login
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
