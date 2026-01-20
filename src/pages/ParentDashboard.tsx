import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { anyApi } from "convex/server";
import { useMutation, useQuery, useAction } from "convex/react";
import { Plus, Upload, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const students = useQuery(anyApi.parent.getStudents);
  const createStudent = useMutation(anyApi.parent.createStudent);
  const addCustomWord = useMutation(anyApi.parent.addCustomWord);
  const extractWordsFromPdf = useAction(anyApi.pdf.extractWordsFromPdf);

  const [view, setView] = useState<"students" | "words">("students");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!isLoaded) return null;
  if (!user) {
      // If we are here and not logged in, redirect
      // (Though useEffect is better for navigation, this prevents render flicker)
      setTimeout(() => navigate("/parent/login"), 0);
      return null;
  }

  const handleLogout = () => {
    signOut(() => navigate("/"));
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await createStudent({ name: newStudentName });
    setNewStudentName("");
    setShowAddStudent(false);
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    await addCustomWord({ 
        word: newWord.toLowerCase(), 
        level: "Custom" 
    });
    setNewWord("");
    setShowAddWord(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(",")[1];
            const words = await extractWordsFromPdf({ fileData: base64 });
            
            // Add words sequentially
            for (const word of words) {
                await addCustomWord({
                    word,
                    level: "Custom"
                });
            }
            alert(`Added ${words.length} words from PDF!`);
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error(err);
        alert("Failed to upload PDF");
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
             <h1 className="text-xl font-black text-zinc-900">Parent Dashboard</h1>
             <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {user.firstName || user.username || user.emailAddresses[0].emailAddress}
             </span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-zinc-200">
          <button
            onClick={() => setView("students")}
            className={`pb-3 text-sm font-bold ${view === "students" ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500"}`}
          >
            Students
          </button>
          <button
            onClick={() => setView("words")}
            className={`pb-3 text-sm font-bold ${view === "words" ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500"}`}
          >
            Custom Words
          </button>
        </div>

        {view === "students" ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-800">Your Students</h2>
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </button>
            </div>

            {showAddStudent && (
              <form onSubmit={handleCreateStudent} className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Student Name"
                    className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 outline-none focus:border-blue-500"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">Save</button>
                  <button type="button" onClick={() => setShowAddStudent(false)} className="rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600">Cancel</button>
                </div>
              </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {students?.map((student) => (
                <div key={student._id} className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <span className="text-2xl font-black">{student.name[0].toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">{student.name}</h3>
                  <div className="mt-4 flex w-full gap-2">
                    <button className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50">
                        Stats
                    </button>
                  </div>
                </div>
              ))}
              {students?.length === 0 && (
                <div className="col-span-full py-10 text-center text-zinc-500">
                  No students yet. Add one to get started!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
             <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-zinc-800">Custom Word List</h2>
              <div className="flex gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50">
                    {uploading ? "Uploading..." : "Upload PDF"}
                    <Upload className="h-4 w-4" />
                    <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
                </label>
                <button
                    onClick={() => setShowAddWord(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Word
                </button>
              </div>
            </div>

            {showAddWord && (
              <form onSubmit={handleAddWord} className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a word..."
                    className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 outline-none focus:border-blue-500"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">Add</button>
                  <button type="button" onClick={() => setShowAddWord(false)} className="rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600">Cancel</button>
                </div>
              </form>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <p className="text-sm text-zinc-500">
                    Custom words will appear in the "Custom" level for all your students.
                </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
