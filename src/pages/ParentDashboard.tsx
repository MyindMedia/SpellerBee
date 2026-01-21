import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { anyApi } from "convex/server";
import { useMutation, useQuery, useAction } from "convex/react";
import { Plus, Upload, LogOut, Mic, Settings, Check } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { VOICES } from "@/data/voices";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut, session } = useClerk();
  
  // Debug Auth (Temporary)
  const handleDebugAuth = async () => {
    try {
        const token = await session?.getToken({ template: "convex" });
        if (!token) {
            alert("No token generated! Check if template 'convex' exists in Clerk.");
            return;
        }
        // Basic decode
        const parts = token.split(".");
        if (parts.length !== 3) {
            alert("Invalid token format");
            return;
        }
        const payload = JSON.parse(atob(parts[1]));
        console.log("Token Payload:", payload);
        alert(`Token Info:\nIssuer: ${payload.iss}\nAudience: ${payload.aud}\nTemplate: convex`);
        
        // Log the exact expected issuer
        console.log("Expected Issuer:", "https://suitable-phoenix-68.clerk.accounts.dev");
        
        if (payload.iss !== "https://suitable-phoenix-68.clerk.accounts.dev") {
             alert(`MISMATCH! Expected: https://suitable-phoenix-68.clerk.accounts.dev\nGot: ${payload.iss}`);
        }
        
    } catch (e) {
        console.error(e);
        alert("Error fetching token: " + e);
    }
  };

  const students = useQuery(anyApi.parent.getStudents);
  const createStudent = useMutation(anyApi.parent.createStudent);
  const addCustomWord = useMutation(anyApi.parent.addCustomWord);
  const extractWordsFromPdf = useAction(anyApi.pdf.extractWordsFromPdf);
  
  // Voice Settings
  const userSettings = useQuery(api.settings.getSettings);
  const updateVoice = useMutation(api.settings.updateVoice);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  // Move these hooks up, before any conditional returns
  const [view, setView] = useState<"students" | "words" | "settings">("students");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (userSettings?.voiceId) {
        setSelectedVoiceId(userSettings.voiceId);
    }
  }, [userSettings]);

  useEffect(() => {
    if (isLoaded && !user) {
        navigate("/parent/login");
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded || !user) return null;

  const handleLogout = () => {
    // Navigate first, then sign out to avoid "Not authenticated" errors on the current page
    navigate("/");
    setTimeout(() => signOut(), 100);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    setError(null);
    try {
        await createStudent({ name: newStudentName });
        setNewStudentName("");
        setShowAddStudent(false);
    } catch (err) {
        console.error("Failed to create student:", err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = (err as any).message || "Unknown error";
        setError(`Failed to create student: ${msg}`);
    }
  };

  const handleUpdateVoice = (voiceId: string) => {
      setSelectedVoiceId(voiceId);
  };

  const handleApplySettings = async () => {
      if (selectedVoiceId) {
          setIsSavingSettings(true);
          try {
              await updateVoice({ voiceId: selectedVoiceId });
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 2000);
          } catch (e) {
              console.error(e);
              alert("Failed to save settings");
          } finally {
              setIsSavingSettings(false);
          }
      }
  };


  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    
    // Split by comma or newline, trim, filter empty
    const wordsToAdd = newWord
        .split(/[\n,]+/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);

    for (const word of wordsToAdd) {
        await addCustomWord({ 
            word: word, 
            level: "Custom" 
        });
    }

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
             <button onClick={handleDebugAuth} className="text-[10px] text-zinc-300 hover:text-zinc-500">
                Debug
             </button>
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
          <button
            onClick={() => setView("settings")}
            className={`pb-3 text-sm font-bold ${view === "settings" ? "border-b-2 border-blue-600 text-blue-600" : "text-zinc-500"}`}
          >
            Settings
          </button>
        </div>

        {view === "students" ? (
          <div>
            {error && (
                <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Student Name"
                    className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 outline-none focus:border-blue-500"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white sm:flex-none">Save</button>
                    <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600 sm:flex-none">Cancel</button>
                  </div>
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-zinc-700">Enter words (separated by commas or new lines)</label>
                  <textarea
                    placeholder="cat, dog, elephant..."
                    className="min-h-[100px] w-full rounded-xl border border-zinc-200 px-4 py-2 outline-none focus:border-blue-500"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white sm:flex-none">Add Words</button>
                    <button type="button" onClick={() => setShowAddWord(false)} className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600 sm:flex-none">Cancel</button>
                  </div>
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
        {view === "settings" && (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-zinc-800">Tutor Voice</h2>
                    <button 
                        onClick={handleApplySettings}
                        disabled={selectedVoiceId === userSettings?.voiceId || isSavingSettings}
                        className={`rounded-xl px-6 py-2 font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:shadow-none ${
                            saveSuccess ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isSavingSettings ? "Saving..." : saveSuccess ? "Saved!" : "Apply Changes"}
                    </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {VOICES.map((voice) => (
                        <button
                            key={voice.id}
                            onClick={() => handleUpdateVoice(voice.id)}
                            className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                                selectedVoiceId === voice.id 
                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500" 
                                : "border-zinc-200 bg-white hover:border-blue-300 hover:bg-zinc-50"
                            }`}
                        >
                            <div className="text-left">
                                <p className="font-bold text-zinc-900">{voice.name}</p>
                                <p className="text-sm text-zinc-500">{voice.description}</p>
                            </div>
                            {selectedVoiceId === voice.id && (
                                <div className="rounded-full bg-emerald-500 p-1 text-white shadow-sm">
                                    <Check className="h-5 w-5" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
