"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { UserRound, X } from "lucide-react";

export default function AuthWidget() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const id = useId();
  const dismiss = () => { setOpen(false); trigger.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    emailInput.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) { setError(data?.error || "Signup failed"); return; }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(mode === "signup" ? "Account created, but sign-in failed. Try signing in." : "Invalid email or password");
        return;
      }
      dismiss();
      setEmail("");
      setPassword("");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally { setLoading(false); }
  };

  if (status === "loading") return <div className="w-20 h-9" aria-label="Loading account" />;
  if (session?.user) return (
    <div className="auth-account"><span title={session.user.email || ""}>{session.user.email}</span>
      <button className="auth-trigger" onClick={() => signOut({ redirect: false })}>Sign out</button>
    </div>
  );
  return (
    <div className="auth-widget" ref={root}>
      <button ref={trigger} className="auth-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={id}>
        <UserRound size={15} aria-hidden="true" />Sign in
      </button>
      {open && <section className="auth-popover" id={id} role="dialog" aria-label="Workspace account">
        <div className="auth-heading"><h2>Your workspace.</h2><button className="desk-icon-button" onClick={dismiss} aria-label="Close account"><X size={18} /></button></div>
        <p>Save your filters, layout and audio preferences. Exploring the dashboard does not require an account.</p>
        <div className="auth-mode">
          <button aria-pressed={mode === "signin"} onClick={() => { setMode("signin"); setError(null); }}>Sign in</button>
          <button aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setError(null); }}>Create account</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor={`${id}-email`}>Email address</label>
          <input ref={emailInput} id={`${id}-email`} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor={`${id}-password`}>Password <span className="surface-muted">(8 characters minimum)</span></label>
          <input id={`${id}-password`} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="surface-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>
      </section>}
    </div>
  );
}
