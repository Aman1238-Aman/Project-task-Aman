"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Heart, LockKeyhole, ShieldCheck } from "lucide-react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export function PhoneLogin({ client, onVerified }: { client: SupabaseClient; onVerified: (session: Session) => void }) {
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalized = phone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setError("Enter a valid number with its country code, for example +91 98765 43210.");
      return;
    }
    setBusy(true);
    try {
      const { error: sendError } = await client.auth.signInWithOtp({ phone: normalized });
      if (sendError) throw sendError;
      setPhone(normalized);
      setStage("otp");
      setMessage("A six-digit sign-in code has been sent to your phone.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t send the code. Check the number and try again.");
    } finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) { setError("Enter the six-digit code from your SMS."); return; }
    setBusy(true);
    try {
      const { data, error: verifyError } = await client.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (verifyError) throw verifyError;
      if (!data.session) throw new Error("The code was accepted, but no sign-in session was returned. Please try again.");
      onVerified(data.session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code could not be verified. Check it and try again.");
    } finally { setBusy(false); }
  }

  return <main className="login-shell">
    <div className="login-glow login-glow-one" /><div className="login-glow login-glow-two" />
    <header className="login-brand"><span className="brand-mark"><Heart size={19} fill="currentColor" /></span><span>coy<span className="brand-muted">discover</span></span><span className="extension-pill">ASSIGNMENT PREVIEW</span></header>
    <section className="login-layout">
      <div className="login-story"><div className="eyebrow"><span className="live-dot" /> A LITTLE MORE COURAGE, A LOT MORE CARE</div><h1>Meet someone new.<br /><em>Stay true to Coy.</em></h1><p>This assignment prototype adds profile discovery while keeping every like private until it’s mutual.</p><div className="login-promise"><span><ShieldCheck size={17} /></span><div><strong>Your likes stay private.</strong><small>Only mutual likes become matches.</small></div></div><div className="login-promise"><span><LockKeyhole size={17} /></span><div><strong>Sign in with your phone.</strong><small>No password needed. We’ll text a one-time code.</small></div></div></div>
      <div className="login-card">
        <div className="login-card-icon"><Heart size={18} fill="currentColor" /></div>
        <span className="login-kicker">WELCOME TO COY DISCOVER</span>
        <h2>{stage === "phone" ? "Your number, please." : "Check your messages."}</h2>
        <p className="login-copy">{stage === "phone" ? "We’ll send you a one-time code to keep your discovery deck yours." : `Enter the six-digit code sent to ${phone}.`}</p>
        {stage === "phone" ? <form onSubmit={sendCode} className="login-form">
          <label htmlFor="phone-number">Mobile number</label>
          <input id="phone-number" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" autoFocus />
          <small className="field-hint">Include your country code. Example: +91 for India.</small>
          {error && <p className="login-error" role="alert">{error}</p>}
          {message && <p className="login-success" role="status">{message}</p>}
          <button className="login-submit" type="submit" disabled={busy}>{busy ? "Sending code…" : <>Send my code <ArrowRight size={16} /></>}</button>
        </form> : <form onSubmit={verifyCode} className="login-form">
          <label htmlFor="phone-otp">Six-digit code</label>
          <input id="phone-otp" className="otp-input" type="text" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" autoFocus />
          {error && <p className="login-error" role="alert">{error}</p>}
          {message && <p className="login-success" role="status">{message}</p>}
          <button className="login-submit" type="submit" disabled={busy}>{busy ? "Checking code…" : <>Verify & continue <ArrowRight size={16} /></>}</button>
          <button className="login-back" type="button" onClick={() => { setStage("phone"); setOtp(""); setError(""); setMessage(""); }}><ArrowLeft size={14} /> Change phone number</button>
        </form>}
        <div className="login-privacy"><ShieldCheck size={15} /> Your number is sent to Supabase Auth for code verification.</div>
      </div>
    </section>
    <footer className="login-footer"><span>18+ only · Fictional demo profiles</span><span>Secure phone verification</span></footer>
  </main>;
}
