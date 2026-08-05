import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Menu, X, Github, Twitter, Linkedin } from "lucide-react";

export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setShown(true), delay);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {children}
    </div>
  );
}

const TONE_CLASSES = {
  accent: "bg-blue-50 text-accent border-blue-100",
  teal: "bg-teal-50 text-accent2 border-teal-100",
  success: "bg-green-50 text-success border-green-100",
  warning: "bg-amber-50 text-warning border-amber-100",
  danger: "bg-red-50 text-danger border-red-100",
};

export function Badge({ children, tone = "accent" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { label: "Features", href: "/#features" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
  ];
  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.8)" : "transparent",
        backdropFilter: scrolled ? "saturate(180%) blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #E5E7EB" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-accent2">
              <Shield size={18} color="#fff" strokeWidth={2.4} />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text">
              ScamShield <span className="text-accent">AI</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-[14px] font-medium text-sub hover:text-text transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-[14px] font-semibold text-text">
              Dashboard
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-[12px] px-4 py-2.5 text-[14px] font-semibold text-white bg-accent transition-transform hover:scale-[1.03] active:scale-[0.98]"
              style={{ boxShadow: "0 6px 16px -6px rgba(37,99,235,0.5)" }}
            >
              Get Started
            </button>
          </div>

          <button className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden px-6 pb-6 flex flex-col gap-4 border-t border-border">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-[15px] font-medium pt-4 text-text" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link to="/dashboard" className="text-[15px] font-medium text-text" onClick={() => setOpen(false)}>
            Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const cols = [
    { title: "Product", links: ["Features", "Pricing", "API", "Browser Extension"] },
    { title: "Resources", links: ["Documentation", "GitHub", "Status", "Changelog"] },
    { title: "Company", links: ["About", "Contact", "Privacy", "Terms"] },
  ];
  return (
    <footer style={{ background: "#0B1220", color: "#94A3B8" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-accent to-accent2">
                <Shield size={16} color="#fff" />
              </div>
              <span className="text-[15px] font-bold text-white">ScamShield AI</span>
            </div>
            <p className="text-[13px] leading-relaxed max-w-[240px]">
              Know before you click. AI-assisted scam site detection for everyone.
            </p>
            <div className="flex gap-3 mt-5">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#1E293B" }}>
                  <Icon size={14} color="#CBD5E1" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-8 flex items-center justify-between" style={{ borderTop: "1px solid #1E293B" }}>
          <p className="text-[12.5px]">© 2026 ScamShield AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export function GaugeChart({ score, size = 220 }) {
  const radius = 70;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped > 65 ? "#EF4444" : clamped > 35 ? "#F59E0B" : "#22C55E";
  return (
    <svg viewBox="0 0 180 100" style={{ width: "100%", maxWidth: size }}>
      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#E5E7EB" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M 20 90 A 70 70 0 0 1 160 90"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1), stroke 0.4s" }}
      />
      <text x="90" y="80" textAnchor="middle" fontSize="30" fontWeight="700" fill="#111827">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

export function riskTone(label) {
  if (label === "High Risk") return "danger";
  if (label === "Moderate Risk") return "warning";
  return "success";
}
