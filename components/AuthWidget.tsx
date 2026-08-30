"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

// Compact header control: shows "Sign In" when logged out (opens a small
// dropdown with a combined sign-in/sign-up form), or the user's email +
// "Sign Out" when logged in. Deliberately not a full-page auth flow — this
// is an optional, low-friction add-on so the dashboard stays fully usable
// without an account; being signed in just persists filter/layout prefs
// (see components/Dashboard.tsx's usePersistedPrefs effect).
export default function AuthWidget() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Signup failed");
          setLoading(false);
          return;
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(mode === "signup" ? "Account created, but sign-in failed — try signing in." : "Invalid email or password");
        setLoading(false);
        return;
      }
      setOpen(false);
      resetForm();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="h-[26px] w-16 shrink-0" />;
  }

  if (session?.user) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-[140px] truncate text-[10px] text-slate-500 sm:inline" title={session.user.email || ""}>
          {session.user.email}
        </span>
        <button
          onClick={() => signOut({ redirect: false })}
          className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
      >
        Sign In
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[1100] mt-1 w-64 rounded border border-[#3a3a3a] bg-[#0e0e0ef5] p-3 shadow-2xl">
          <div className="mb-2 flex gap-2 text-[10px] font-bold uppercase tracking-widest">
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={mode === "signin" ? "text-[#d4b36a]" : "text-slate-500 hover:text-slate-300"}
            >
              Sign In
            </button>
            <span className="text-slate-700">/</span>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={mode === "signup" ? "text-[#d4b36a]" : "text-slate-500 hover:text-slate-300"}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#d4b36a]/60"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-[#3a3a3a] bg-[#1a1a1a] px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#d4b36a]/60"
            />
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded border border-[#d4b36a]/60 bg-[#1e1e1e] py-1 text-[10px] font-bold uppercase tracking-widest text-[#d4b36a] transition hover:bg-[#262626] disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
