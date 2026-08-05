import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Search, ChevronDown,
  Sparkles, Lock, Globe, MessageSquareWarning, Fingerprint, Star,
  ArrowRight, Check, Minus, X, ScanLine, FileWarning, Users, CreditCard,
  TrendingDown, Zap, AlertTriangle,
} from "lucide-react";
import { Reveal, Badge, GaugeChart, riskTone } from "../components/Shared.jsx";
import { api, ApiError } from "../lib/api.js";

/* ---------------- Hero ---------------- */
function TypedURL() {
  const examples = ["totally-legit-deals.shop", "amaz0n-rewards-claim.com", "your-bank-secure-login.net"];
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = examples[idx % examples.length];
    let t;
    if (!deleting && text.length < current.length) t = setTimeout(() => setText(current.slice(0, text.length + 1)), 55);
    else if (!deleting && text.length === current.length) t = setTimeout(() => setDeleting(true), 1400);
    else if (deleting && text.length > 0) t = setTimeout(() => setText(text.slice(0, -1)), 30);
    else if (deleting && text.length === 0) { setDeleting(false); setIdx((i) => i + 1); }
    return () => clearTimeout(t);
  }, [text, deleting, idx]);
  return (
    <span className="text-text">
      {text}
      <span className="inline-block w-[2px] h-[1em] align-middle ml-0.5 bg-accent" style={{ animation: "blink 1s step-end infinite" }} />
    </span>
  );
}

function Hero({ url, setUrl, onScan }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, #2563EB22, transparent 70%)", animation: "float1 12s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute top-10 right-[-160px] h-[460px] w-[460px] rounded-full" style={{ background: "radial-gradient(circle, #14B8A622, transparent 70%)", animation: "float2 14s ease-in-out infinite" }} />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8 pt-20 pb-24 text-center">
        <Reveal><div className="flex justify-center mb-7"><Badge tone="accent"><Sparkles size={12} /> AI-Powered Threat Detection</Badge></div></Reveal>
        <Reveal delay={80}>
          <h1 className="text-[40px] leading-[1.08] sm:text-[56px] lg:text-[68px] font-bold tracking-tight text-text">
            Detect scam websites
            <br />
            <span style={{ background: "linear-gradient(90deg, #2563EB, #14B8A6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              before they scam you.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] sm:text-[18px] leading-relaxed text-sub">
            ScamShield AI runs a real scan of any URL — live SSL check, WHOIS lookup, page content
            analysis, and URL-structure heuristics — and explains exactly why a site is safe or risky.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mx-auto mt-10 flex max-w-2xl flex-col sm:flex-row items-stretch gap-3 rounded-[16px] p-2 bg-bg2 border border-border">
            <div className="flex flex-1 items-center gap-3 rounded-[12px] px-4 py-3.5 bg-white">
              <Globe size={18} className="text-sub shrink-0" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onScan()}
                placeholder=""
                className="w-full bg-transparent text-[15px] outline-none text-text"
              />
              {!url && (
                <div className="absolute pointer-events-none -ml-[1px] text-[15px]" style={{ marginLeft: "-1px" }}>
                  <span className="opacity-0">.</span>
                </div>
              )}
              {!url && (
                <div className="absolute pl-[46px] pointer-events-none text-[15px] hidden sm:block" style={{ position: "absolute" }}>
                </div>
              )}
            </div>
            <button
              onClick={onScan}
              className="flex items-center justify-center gap-2 rounded-[12px] px-6 py-3.5 text-[15px] font-semibold text-white bg-accent transition-transform hover:scale-[1.03] active:scale-[0.98]"
              style={{ boxShadow: "0 8px 20px -8px rgba(37,99,235,0.55)" }}
            >
              <Search size={17} /> Analyze Website
            </button>
          </div>
          {!url && (
            <p className="mt-2 text-[13px] text-sub">
              Try: <TypedURL />
            </p>
          )}
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Badge tone="teal"><ShieldCheck size={12} /> Real live scanning</Badge>
            <Badge tone="accent"><Sparkles size={12} /> AI Powered</Badge>
            <Badge tone="success"><Lock size={12} /> Privacy First</Badge>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl bg-accent/20" style={{ animation: "pulse-soft 3s ease-in-out infinite" }} />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-accent to-accent2">
                <ShieldCheck size={44} color="#fff" strokeWidth={2} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Features / How it works (static, unchanged) ---------------- */
const FEATURES = [
  { icon: Sparkles, title: "AI Content Detection", desc: "Flags AI-generated product copy and boilerplate scam language patterns." },
  { icon: MessageSquareWarning, title: "Urgency Language Detection", desc: "Identifies manipulative countdowns, fake stock alerts, and pressure tactics." },
  { icon: Globe, title: "WHOIS Domain Analysis", desc: "Checks domain age, registrar history, and ownership changes." },
  { icon: Lock, title: "SSL Verification", desc: "Validates certificate authority, issue date, and encryption strength." },
  { icon: Fingerprint, title: "Contact Validation", desc: "Confirms phone numbers and support emails actually appear on the page." },
  { icon: Star, title: "Fake Review Detection", desc: "Detects review bursts, duplicate phrasing, and bot-like rating patterns." },
  { icon: Users, title: "Brand Impersonation", desc: "Flags domains that reference a real brand without being that brand's site." },
  { icon: TrendingDown, title: "Price Manipulation", desc: "Flags fake discounts and inflated 'was' prices with no history." },
  { icon: CreditCard, title: "Payment Pressure", desc: "Flags checkout copy that pushes irreversible payment methods." },
  { icon: ShieldQuestion, title: "Dead Policy Links", desc: "Follows privacy-policy links to confirm they actually resolve." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
      <Reveal className="text-center max-w-2xl mx-auto mb-16">
        <Badge tone="accent">Under the hood</Badge>
        <h2 className="mt-5 text-[32px] sm:text-[40px] font-bold tracking-tight text-text">Ten signals. One risk score.</h2>
        <p className="mt-4 text-[16px] text-sub">Every scan runs the full detection stack — no single check has to be right alone.</p>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 60}>
            <div className="group h-full rounded-[20px] p-6 border border-border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-[12px] mb-4 bg-blue-50 transition-transform duration-300 group-hover:scale-110">
                <f.icon size={20} className="text-accent" />
              </div>
              <h3 className="text-[15px] font-semibold mb-1.5 text-text">{f.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-sub">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Globe, title: "Paste a URL", desc: "Drop in any website address to scan." },
  { icon: ScanLine, title: "Server scans the site", desc: "SSL, WHOIS, DNS, and page content are pulled live." },
  { icon: Zap, title: "Risk engine evaluates", desc: "Signals are weighted into a single explainable score." },
  { icon: FileWarning, title: "Receive the explanation", desc: "See exactly which signals drove the score." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-bg2">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-text">How it works</h2>
          <p className="mt-4 text-[16px] text-sub">From link to verdict in a few seconds.</p>
        </Reveal>
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-[2px]" style={{ background: "linear-gradient(90deg, #2563EB, #14B8A6)" }} />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full mb-5 bg-white border-2 border-accent">
                  <s.icon size={20} className="text-accent" />
                </div>
                <span className="text-[12px] font-semibold mb-1 text-accent2">STEP {i + 1}</span>
                <h3 className="text-[16px] font-semibold mb-1.5 text-text">{s.title}</h3>
                <p className="text-[13.5px] leading-relaxed max-w-[220px] text-sub">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- LIVE, REAL scan section ---------------- */
const STAGE_LABELS = ["Connecting & checking SSL", "Looking up WHOIS record", "Resolving DNS", "Fetching & analyzing page content", "Scoring risk signals"];

function LiveScan({ url, setUrl }) {
  const [state, setState] = useState("idle"); // idle | scanning | done | error
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const tickRef = useRef(null);

  const runScan = async () => {
    if (!url.trim() || state === "scanning") return;
    setState("scanning");
    setError(null);
    setStageIdx(0);
    tickRef.current = setInterval(() => {
      setStageIdx((s) => Math.min(s + 1, STAGE_LABELS.length - 1));
    }, 900);

    try {
      const data = await api.scan(url, true);
      clearInterval(tickRef.current);
      setStageIdx(STAGE_LABELS.length - 1);
      setResult(data);
      setState("done");
    } catch (e) {
      clearInterval(tickRef.current);
      setError(e instanceof ApiError ? e.message : "Something went wrong running the scan.");
      setState("error");
    }
  };

  useEffect(() => () => clearInterval(tickRef.current), []);

  return (
    <section id="live-demo" className="mx-auto max-w-5xl px-6 lg:px-8 py-24">
      <Reveal className="text-center max-w-2xl mx-auto mb-14">
        <Badge tone="teal">Live scan</Badge>
        <h2 className="mt-5 text-[32px] sm:text-[40px] font-bold tracking-tight text-text">Scan a real website</h2>
        <p className="mt-4 text-[16px] text-sub">This calls the actual ScamShield API — real SSL, WHOIS, and content checks, not a simulation.</p>
      </Reveal>

      <Reveal delay={100}>
        <div className="rounded-[24px] p-6 sm:p-8 bg-white border border-border" style={{ boxShadow: "0 20px 50px -20px rgba(17,24,39,0.15)" }}>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex flex-1 items-center gap-2.5 rounded-[12px] px-4 py-3 bg-bg2 border border-border">
              <Globe size={16} className="text-sub shrink-0" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runScan()}
                placeholder="https://example.com"
                className="w-full bg-transparent text-[14px] outline-none text-text"
              />
            </div>
            <button
              onClick={runScan}
              disabled={state === "scanning" || !url.trim()}
              className="flex items-center justify-center gap-2 rounded-[12px] px-6 py-3 text-[14px] font-semibold text-white bg-accent transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {state === "scanning" ? "Scanning…" : "Run scan"}
              {state !== "scanning" && <ArrowRight size={15} />}
            </button>
          </div>

          {state === "idle" && (
            <div className="rounded-[16px] py-14 text-center bg-bg2 border border-dashed border-border">
              <ScanLine size={28} className="text-sub mx-auto mb-3" />
              <p className="text-[14px] text-sub">Enter a URL above and run a real scan.</p>
            </div>
          )}

          {state === "scanning" && (
            <div className="space-y-4">
              {STAGE_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${i < stageIdx ? "bg-green-50 border-green-100" : i === stageIdx ? "bg-blue-50 border-blue-100" : "bg-hoverbg border-border"}`}>
                    {i < stageIdx ? <Check size={13} className="text-success" /> : (
                      <div className={`h-2 w-2 rounded-full ${i === stageIdx ? "bg-accent" : "bg-border"}`} style={{ animation: i === stageIdx ? "pulse-soft 1s ease-in-out infinite" : "none" }} />
                    )}
                  </div>
                  <span className="text-[13.5px] flex-1" style={{ color: i <= stageIdx ? "#111827" : "#6B7280", fontWeight: i === stageIdx ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
              ))}
              <p className="text-[12px] text-sub pt-2">Real network calls can take several seconds — WHOIS and SSL especially.</p>
            </div>
          )}

          {state === "error" && (
            <Reveal>
              <div className="rounded-[16px] p-6 bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-semibold text-text mb-1">Scan couldn't complete</p>
                  <p className="text-[13.5px] text-sub">{error}</p>
                </div>
              </div>
            </Reveal>
          )}

          {state === "done" && result && (
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-center">
                <div className="flex flex-col items-center">
                  <GaugeChart score={result.risk.score} />
                  <Badge tone={riskTone(result.risk.label)}>
                    {result.risk.label === "High Risk" ? <ShieldAlert size={12} /> : result.risk.label === "Low Risk" ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                    {result.risk.label}
                  </Badge>
                  <p className="text-[11.5px] text-sub mt-2">Confidence: {result.risk.confidence}%</p>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold mb-4 text-text">Why this score</h3>
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-2">
                    {result.risk.reasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${r.tone === "danger" ? "bg-red-50" : r.tone === "warning" ? "bg-amber-50" : "bg-blue-50"}`}>
                          {r.tone === "danger" ? <X size={11} className="text-danger" /> : r.tone === "warning" ? <Minus size={11} className="text-warning" /> : <Sparkles size={10} className="text-accent" />}
                        </div>
                        <span className="text-[13.5px] text-text">{r.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button onClick={() => navigate(`/scan/${result.id}`)} className="text-[13.5px] font-semibold text-accent">
                      View full report →
                    </button>
                    <button onClick={() => setState("idle")} className="text-[13.5px] font-semibold text-sub">
                      Scan another
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- Comparison / Pricing / Testimonials / FAQ (unchanged content) ---------------- */
const COMPARE_ROWS = [
  ["Explains why a site is risky", true, false, false, false],
  ["Checks WHOIS + SSL + content together", true, false, "partial", false],
  ["Language / pressure-tactic detection", true, false, false, false],
  ["Real-time API access", true, "partial", true, false],
  ["No manual research required", true, true, true, false],
];
function CompareCell({ v }) {
  if (v === true) return <Check size={17} className="text-success mx-auto" />;
  if (v === "partial") return <Minus size={17} className="text-warning mx-auto" />;
  return <X size={17} className="text-sub mx-auto opacity-40" />;
}
function Comparison() {
  return (
    <section className="mx-auto max-w-5xl px-6 lg:px-8 py-24">
      <Reveal className="text-center max-w-2xl mx-auto mb-14">
        <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-text">Why not just use what's free?</h2>
        <p className="mt-4 text-[16px] text-sub">Existing tools tell you if a link is blacklisted. We tell you if a site is trying to scam you — and why.</p>
      </Reveal>
      <Reveal delay={100}>
        <div className="overflow-x-auto rounded-[20px] border border-border">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <thead>
              <tr className="bg-bg2">
                <th className="text-left font-semibold px-5 py-4 text-text">Capability</th>
                <th className="px-3 py-4 font-semibold text-accent">ScamShield AI</th>
                <th className="px-3 py-4 font-medium text-sub">Safe Browsing</th>
                <th className="px-3 py-4 font-medium text-sub">VirusTotal</th>
                <th className="px-3 py-4 font-medium text-sub">Manual check</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row[0]} className={`border-t border-border ${i % 2 ? "bg-bg2" : "bg-white"}`}>
                  <td className="px-5 py-4 text-text">{row[0]}</td>
                  <td className="px-3 py-4"><CompareCell v={row[1]} /></td>
                  <td className="px-3 py-4"><CompareCell v={row[2]} /></td>
                  <td className="px-3 py-4"><CompareCell v={row[3]} /></td>
                  <td className="px-3 py-4"><CompareCell v={row[4]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}

const PLANS = [
  { name: "Free", price: "$0", period: "forever", desc: "For occasional checks before you click.", features: ["10 scans / month", "Core risk score", "Basic explanation", "Community support"], cta: "Start free", popular: false },
  { name: "Pro", price: "$19", period: "/ month", desc: "For shoppers, resellers, and small teams.", features: ["Unlimited scans", "Full signal breakdown", "Scan history", "AI content analysis", "Priority support"], cta: "Start Pro trial", popular: true },
  { name: "Enterprise", price: "Custom", period: "", desc: "For platforms screening links at scale.", features: ["API access", "Bulk & batch scanning", "Custom risk weighting", "SLA & dedicated support"], cta: "Contact sales", popular: false },
];
function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-bg2">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-text">Simple, transparent pricing</h2>
          <p className="mt-4 text-[16px] text-sub">Start free. Upgrade when you need more scans.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div className={`relative h-full rounded-[20px] p-8 bg-white transition-transform duration-300 hover:-translate-y-1.5 ${p.popular ? "border-2 border-accent" : "border border-border"}`} style={p.popular ? { boxShadow: "0 24px 50px -20px rgba(37,99,235,0.3)" } : {}}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge tone="accent">Most popular</Badge></div>}
                <h3 className="text-[16px] font-semibold text-text">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[34px] font-bold text-text">{p.price}</span>
                  {p.period && <span className="text-[13px] text-sub">{p.period}</span>}
                </div>
                <p className="mt-2 text-[13.5px] text-sub">{p.desc}</p>
                <div className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Check size={15} className={p.popular ? "text-accent" : "text-success"} />
                      <span className="text-[13.5px] text-text">{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`mt-8 w-full rounded-[12px] py-3 text-[14px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] ${p.popular ? "text-white bg-accent" : "bg-bg2 text-text border border-border"}`} style={p.popular ? { boxShadow: "0 8px 20px -8px rgba(37,99,235,0.5)" } : {}}>
                  {p.cta}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "How accurate is the risk score?", a: "It's a transparent, multi-signal heuristic engine — every point is explained, and confidence drops when checks fail — rather than a black-box percentage. Enabling the optional AI content pass improves the read on manipulative or AI-generated copy." },
  { q: "Do you store the sites I scan?", a: "Scan results are kept in your history so you can revisit them. You can delete any scan, or your whole history, at any time." },
  { q: "Can I use this for bulk link screening?", a: "Yes — the Pro and Enterprise plans include API access for batch scanning." },
  { q: "What happens if a scan is wrong?", a: "You can flag any result for review, which is used to recalibrate signal weights." },
];
function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section className="py-24 bg-bg2">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <Reveal className="text-center mb-12"><h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-text">Frequently asked</h2></Reveal>
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <Reveal key={f.q} delay={i * 60}>
                <div className="rounded-[16px] overflow-hidden bg-white border border-border">
                  <button className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left" onClick={() => setOpenIdx(open ? -1 : i)}>
                    <span className="text-[14.5px] font-semibold text-text">{f.q}</span>
                    <ChevronDown size={18} className="text-sub" style={{ transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  <div style={{ maxHeight: open ? "200px" : "0px", opacity: open ? 1 : 0, transition: "max-height 0.35s ease, opacity 0.25s ease", overflow: "hidden" }}>
                    <p className="px-6 pb-5 text-[13.5px] leading-relaxed text-sub">{f.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [url, setUrl] = useState("");
  const demoRef = useRef(null);
  const scrollToDemo = () => demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Hero url={url} setUrl={setUrl} onScan={scrollToDemo} />
      <Features />
      <HowItWorks />
      <div ref={demoRef}>
        <LiveScan url={url} setUrl={setUrl} />
      </div>
      <Comparison />
      <Pricing />
      <FAQ />
    </>
  );
}
