import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { anyApi } from "convex/server";
import { useMutation, useQuery } from "convex/react"; // Note: login is query but we might need action/mutation wrapper for safety or just client logic
// Actually loginParent is a query, which is fine for simple check, but usually auth is mutation.
// Let's use the query to check.

import { ConvexHttpClient } from "convex/browser";
const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export default function ParentLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  
  const navigate = useNavigate();
  const setParentId = useAppStore((state) => state.setParentId);

  const createParent = useMutation(anyApi.parent.createParent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isSignup) {
        const id = await createParent({ username, pin });
        setParentId(id);
        navigate("/parent/dashboard");
      } else {
        // Query login
        const parent = await convex.query(anyApi.parent.loginParent, { username, pin });
        if (!parent) {
          setError("Invalid username or pin");
        } else {
          setParentId(parent._id);
          navigate("/parent/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-black text-zinc-900">
          {isSignup ? "Create Parent Account" : "Parent Login"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-zinc-700">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. mom_smith"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-bold text-zinc-700">4-Digit PIN</label>
            <input
              type="password"
              required
              maxLength={4}
              pattern="\d{4}"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="1234"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-center text-sm font-medium text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Please wait..." : (isSignup ? "Create Account" : "Login")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            {isSignup ? "Already have an account? Login" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
