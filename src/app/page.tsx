"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Heart, MapPin, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Profile } from "@/lib/profiles";

type Tab = "Home" | "Discover" | "Matches";

export default function DiscoverApp() {
  const [tab, setTab] = useState<Tab>("Discover");
  const [feed, setFeed] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [feedError, setFeedError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [matchPopup, setMatchPopup] = useState<Profile | null>(null);
  const [swipeKey, setSwipeKey] = useState(0);
  const [lastAction, setLastAction] = useState<"like" | "pass">("like");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [feedResponse, matchesResponse] = await Promise.all([fetch("/api/feed"), fetch("/api/matches")]);
      if (!feedResponse.ok || !matchesResponse.ok) {
        const failedResponse = !feedResponse.ok ? feedResponse : matchesResponse;
        const errorData = await failedResponse.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorData?.error || "Could not load profiles. Please try again.");
      }
      const feedData = await feedResponse.json();
      const matchesData = await matchesResponse.json();
      setFeed(feedData.profiles);
      setMatches(matchesData.matches);
      setFeedError("");
      setNotice("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We couldn’t load your discoveries. Please try again.";
      setFeedError(message);
      setNotice(message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), notice.includes("Vercel deployment") ? 9000 : 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const active = feed[0];
  const remaining = feed.length;

  const swipe = useCallback(async (action: "like" | "pass") => {
    if (!active || busy) return;
    setBusy(true);
    setLastAction(action);
    setNotice(action === "like" ? `You liked ${active.name}` : `You passed on ${active.name}`);
    try {
      const response = await fetch("/api/swipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: active.id, action }) });
      if (response.status === 409) { await refresh(); return; }
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorData?.error || "Could not save swipe. Please try again.");
      }
      const data = await response.json();
      setFeed((current) => current.filter((profile) => profile.id !== active.id));
      setSwipeKey((key) => key + 1);
      if (data.matched) {
        setMatchPopup(data.profile);
        setMatches((current) => current.some((match) => match.id === active.id) ? current : [active, ...current]);
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : "That didn’t go through. Please try again."); }
    finally { setBusy(false); }
  }, [active, busy, refresh]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") void swipe("like");
      if (event.key === "ArrowLeft") void swipe("pass");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [swipe]);

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" aria-label="Coy Discover home" onClick={() => setTab("Home")}><span className="brand-mark"><Heart size={19} fill="currentColor" /></span><span>coy<span className="brand-muted">discover</span></span></button>
      <nav className="desktop-tabs" aria-label="Main navigation">
        {(["Home", "Discover", "Matches"] as Tab[]).map((item) => <button key={item} className={`nav-tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>{item}{item === "Matches" && matches.length > 0 && <span className="count">{matches.length}</span>}</button>)}
      </nav>
      <div className="profile-switch demo-switch" aria-label="Single-user demo mode"><span className="user-dot">D</span><span className="user-label">Demo mode</span></div>
    </header>

    <div className="mobile-tabs" aria-label="Main navigation">
      {(["Home", "Discover", "Matches"] as Tab[]).map((item) => <button key={item} className={`mobile-tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>{item === "Home" ? <Sparkles size={19} /> : item === "Discover" ? <Heart size={19} /> : <MessageCircle size={19} />}<span>{item}</span></button>)}
    </div>

    {tab === "Discover" && <motion.section className="discover-view" key="discover" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
      <div className="discover-heading"><div><div className="eyebrow"><span className="live-dot" /> YOUR NEXT GOOD THING</div><h1>Make room for <em>maybe.</em></h1><p>Meet someone new, at your own pace.</p></div><div className="progress-chip"><span className="progress-number">{loading ? "—" : remaining}</span><span>profiles<br />to discover</span></div></div>
      <div className="discovery-layout">
        <section className="card-column" aria-label="Profile discovery">
          <div className="card-stage">
            {loading ? <div className="loading-card"><div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line short" /><div className="skeleton-pills"><i /><i /><i /></div><div className="loading-caption"><span className="spinner" /> Finding your people…</div></div> : feedError ? <div className="empty-card"><span className="empty-icon"><ShieldCheck size={25} /></span><h2>Connect your private storage</h2><p>{feedError}</p><button className="primary-button" onClick={() => void refresh()}>Try again</button></div> : active ? <AnimatePresence mode="popLayout">
              <ProfileCard key={active.id + swipeKey} profile={active} onSwipe={swipe} exitAction={lastAction} />
            </AnimatePresence> : <div className="empty-card"><span className="empty-icon"><Sparkles size={27} /></span><h2>You’re all caught up</h2><p>You’ve met everyone in today’s edit. Come back soon — there’s always someone new to discover.</p></div>}
          </div>
          {!loading && active && <div className="action-row"><button disabled={busy} className="action-button pass-button" onClick={() => void swipe("pass")} aria-label="Pass"><X size={25} strokeWidth={2.5} /></button><button disabled={busy} className="action-button like-button" onClick={() => void swipe("like")} aria-label="Like"><Heart size={24} fill="currentColor" strokeWidth={2.3} /></button></div>}
          <div className="swipe-hint"><span><ArrowLeft size={13} /> pass</span><span>drag to decide</span><span>like <ArrowRight size={13} /></span></div>
        </section>
        <aside className="side-rail"><div className="privacy-card"><span className="privacy-icon"><ShieldCheck size={20} /></span><div><h3>Your likes stay yours.</h3><p>We’ll only tell someone you liked them if they like you back. That’s Coy.</p></div><div className="privacy-rule"><span><Check size={14} /></span> Private by design</div></div><div className="edit-card"><div className="edit-meta"><span>THE COY EDIT</span><span>{String(Math.min(30, Math.max(1, 31 - remaining))).padStart(2, "0")} / 30</span></div><h3>Better connections<br />start with a little<br /><em>curiosity.</em></h3><div className="edit-line" /><p>Thoughtfully picked people, one at a time. No rush, no pressure.</p><div className="edit-hearts"><Heart size={13} fill="currentColor" /><Heart size={13} fill="currentColor" /><Heart size={13} fill="currentColor" /></div></div><p className="keyboard-note"><kbd>←</kbd> pass <kbd>→</kbd> like</p></aside>
      </div>
      {notice && <motion.div key={notice} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="toast" role="status" aria-live="polite"><span className={notice.startsWith("You liked") ? "toast-heart" : "toast-check"}>{notice.startsWith("You liked") ? <Heart size={15} fill="currentColor" /> : <Check size={15} />}</span>{notice}</motion.div>}
    </motion.section>}
    {tab === "Home" && <section className="blank-home" aria-label="Home" />}
    {tab === "Matches" && <MatchesView matches={matches} loading={loading} onOpenDiscover={() => setTab("Discover")} />}
    <footer className="footer"><span>Made with care, by Coy <Heart size={12} fill="currentColor" /></span><span>Good connections, good boundaries.</span></footer>
    <AnimatePresence>{matchPopup && <MatchCelebration profile={matchPopup} onClose={() => setMatchPopup(null)} onSeeMatches={() => { setMatchPopup(null); setTab("Matches"); }} />}</AnimatePresence>
  </main>;
}

function ProfileCard({ profile, onSwipe, exitAction }: { profile: Profile; onSwipe: (action: "like" | "pass") => void; exitAction: "like" | "pass" }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);
  return <motion.article className="profile-card" style={{ x, rotate }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.82} onDragEnd={(_, info) => { if (info.offset.x > 100) onSwipe("like"); else if (info.offset.x < -100) onSwipe("pass"); }} initial={{ scale: .96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ x: exitAction === "like" ? 420 : -420, opacity: 0, rotate: exitAction === "like" ? 22 : -22, transition: { duration: .26 } }} transition={{ type: "spring", stiffness: 280, damping: 26 }} whileTap={{ cursor: "grabbing" }}>
    <Image className="profile-photo" src={profile.photo} alt={`${profile.name}, ${profile.age}`} fill sizes="(max-width: 520px) 92vw, 360px" priority draggable={false} />
    <div className="photo-shade" />
    <motion.div className="swipe-label like-label" style={{ opacity: likeOpacity }}>LIKE</motion.div><motion.div className="swipe-label pass-label" style={{ opacity: passOpacity }}>PASS</motion.div>
    <div className="card-topline"><span className="verified"><Check size={12} /> coy pick</span><span className="distance"><MapPin size={12} /> {profile.distance}</span></div>
    <div className="profile-info"><div className="name-line"><h2>{profile.name}, {profile.age}</h2><span className="online-dot" /></div><p className="location-line"><MapPin size={14} /> {profile.location}</p><p className="bio">{profile.bio}</p><div className="interest-list">{profile.interests.map((interest) => <span key={interest}>{interest}</span>)}</div></div>
  </motion.article>;
}

function MatchesView({ matches, loading, onOpenDiscover }: { matches: Profile[]; loading: boolean; onOpenDiscover: () => void }) {
  return <motion.section className="matches-view" key="matches" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}><div className="matches-heading"><div className="eyebrow"><span className="live-dot" /> YOUR MUTUAL CONNECTIONS</div><h1>Good things <em>go both ways.</em></h1><p>Every person here liked you back. Say hello when you’re ready.</p></div>
    {loading ? <div className="match-loading">Loading your connections…</div> : matches.length ? <div className="match-grid">{matches.map((profile) => <article className="match-card" key={profile.id}><div className="match-image-wrap"><Image src={profile.photo} alt={`${profile.name}, ${profile.age}`} fill sizes="(max-width: 520px) 46vw, 220px" /><span className="match-heart"><Heart size={16} fill="currentColor" /></span></div><div className="match-card-body"><h2>{profile.name}, {profile.age}</h2><p><MapPin size={13} /> {profile.location}</p><div className="match-interests">{profile.interests.slice(0, 2).map((interest) => <span key={interest}>{interest}</span>)}</div><span className="mutual-note"><Check size={13} /> You both liked each other</span></div></article>)}</div> : <div className="matches-empty"><span className="empty-icon"><Heart size={25} /></span><h2>Your story starts with a yes.</h2><p>When you and someone both like each other, you’ll find them here. Your incoming likes stay private until then.</p><button className="primary-button" onClick={onOpenDiscover}><Heart size={16} /> Discover people</button></div>}
  </motion.section>;
}

function MatchCelebration({ profile, onClose, onSeeMatches }: { profile: Profile; onClose: () => void; onSeeMatches: () => void }) {
  const confetti = useMemo(() => Array.from({ length: 28 }, (_, index) => ({ left: `${(index * 37) % 100}%`, delay: `${(index % 7) * .12}s`, hue: (index * 29) % 360 })), []);
  return <motion.div className="match-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="confetti">{confetti.map((bit, index) => <i key={index} style={{ left: bit.left, animationDelay: bit.delay, background: `hsl(${bit.hue} 85% 68%)` }} />)}</div><button className="close-match" onClick={onClose} aria-label="Close"><X size={23} /></button><motion.div className="match-celebration" initial={{ scale: .82, y: 24 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 250, damping: 20 }}><div className="match-photo-pair"><Image src={profile.photo} alt="" width={91} height={91} /><div className="pair-heart"><Heart size={23} fill="currentColor" /></div><div className="self-avatar">A</div></div><span className="match-kicker"><Sparkles size={15} /> IT’S A MATCH</span><h1>Well, hello <em>{profile.name}.</em></h1><p>You both liked each other. A lovely little beginning.</p><div className="match-actions"><button className="primary-button" onClick={onSeeMatches}><MessageCircle size={16} /> See your matches</button><button className="text-button" onClick={onClose}>Keep discovering</button></div><span className="privacy-promise"><ShieldCheck size={14} /> Your likes stay private. Always.</span></motion.div></motion.div>;
}
