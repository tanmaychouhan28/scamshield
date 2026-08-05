import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Lock, LockOpen, Globe, Calendar,
  Server, ArrowLeft, Check, X, Minus, Sparkles, ExternalLink,
} from "lucide-react";
import { Reveal, Badge, GaugeChart, riskTone } from "../components/Shared.jsx";
import { api, ApiError } from "../lib/api.js";

function Field({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-[13px] text-sub">{label}</span>
      <span className="text-[13px] font-medium text-text text-right break-all">{value ?? "—"}</span>
    </div>
  );
}

function Panel({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[20px] p-6 bg-white border border-border">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon size={17} className="text-accent" />
        <h3 className="text-[14.5px] font-semibold text-text">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ScanResult() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getScan(id)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Failed to load scan."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-24 text-center text-sub">Loading report…</div>;
  if (error) return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <AlertTriangle size={28} className="text-danger mx-auto mb-4" />
      <p className="text-text font-semibold mb-2">Couldn't load this report</p>
      <p className="text-sub text-[14px]">{error}</p>
      <Link to="/dashboard" className="inline-block mt-6 text-accent font-semibold text-[14px]">← Back to dashboard</Link>
    </div>
  );
  if (!data) return null;

  const { risk, ssl, whois, dns, url_structure, content, ai_content_analysis, page } = data;

  return (
    <div className="mx-auto max-w-5xl px-6 lg:px-8 py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-sub hover:text-text mb-6">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <Reveal>
        <div className="rounded-[24px] p-8 bg-white border border-border mb-8" style={{ boxShadow: "0 20px 50px -20px rgba(17,24,39,0.12)" }}>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-center">
            <div className="flex flex-col items-center">
              <GaugeChart score={risk.score} />
              <Badge tone={riskTone(risk.label)}>
                {risk.label === "High Risk" ? <ShieldAlert size={12} /> : risk.label === "Low Risk" ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                {risk.label}
              </Badge>
              <p className="text-[11.5px] text-sub mt-2">Confidence: {risk.confidence}%</p>
              {risk.llm_used && <p className="text-[11px] text-accent mt-1">Includes AI content analysis</p>}
            </div>
            <div>
              <p className="text-[13px] text-sub mb-1">Scanned URL</p>
              <p className="text-[16px] font-semibold text-text break-all mb-4">{data.url}</p>
              <h3 className="text-[14px] font-semibold text-text mb-3">Full reasoning</h3>
              <div className="space-y-2">
                {risk.reasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${r.tone === "danger" ? "bg-red-50" : r.tone === "warning" ? "bg-amber-50" : "bg-blue-50"}`}>
                        {r.tone === "danger" ? <X size={11} className="text-danger" /> : r.tone === "warning" ? <Minus size={11} className="text-warning" /> : <Sparkles size={10} className="text-accent" />}
                      </div>
                      <span className="text-[13.5px] text-text">{r.label}</span>
                    </div>
                    {r.points > 0 && <span className="text-[12px] text-sub tabular-nums shrink-0">+{r.points}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Reveal delay={60}>
          <Panel icon={ssl?.valid ? Lock : LockOpen} title="SSL Information">
            <Field label="Has SSL" value={ssl?.has_ssl ? "Yes" : "No"} />
            <Field label="Valid / trusted" value={ssl?.valid ? "Yes" : "No"} />
            <Field label="Issuer" value={ssl?.issuer} />
            <Field label="Protocol" value={ssl?.protocol} />
            <Field label="Self-signed" value={ssl?.self_signed ? "Yes" : "No"} />
            <Field label="Expires" value={ssl?.not_after && new Date(ssl.not_after).toLocaleDateString()} />
            <Field label="Days until expiry" value={ssl?.days_until_expiry} />
            {ssl?.error && <p className="text-[12px] text-warning mt-2">{ssl.error}</p>}
          </Panel>
        </Reveal>

        <Reveal delay={100}>
          <Panel icon={Calendar} title="WHOIS Details">
            <Field label="Registrar" value={whois?.registrar} />
            <Field label="Created" value={whois?.creation_date && new Date(whois.creation_date).toLocaleDateString()} />
            <Field label="Domain age (days)" value={whois?.domain_age_days} />
            <Field label="Expires" value={whois?.expiration_date && new Date(whois.expiration_date).toLocaleDateString()} />
            <Field label="Privacy protected" value={whois?.privacy_protected ? "Yes" : "No"} />
            {whois?.error && <p className="text-[12px] text-warning mt-2">{whois.error}</p>}
          </Panel>
        </Reveal>

        <Reveal delay={140}>
          <Panel icon={Server} title="DNS & Hosting">
            <Field label="A records" value={dns?.a_records?.join(", ")} />
            <Field label="MX records" value={dns?.mx_records?.join(", ")} />
            <Field label="Has SPF record" value={dns?.has_spf ? "Yes" : "No"} />
          </Panel>
        </Reveal>

        <Reveal delay={180}>
          <Panel icon={Globe} title="URL Structure">
            <Field label="Host" value={url_structure?.host} />
            <Field label="Registrable domain" value={url_structure?.registrable_domain} />
            <Field label="TLD" value={url_structure?.tld} />
            <Field label="Uses HTTPS" value={url_structure?.uses_https ? "Yes" : "No"} />
            <Field label="Subdomain depth" value={url_structure?.subdomain_count} />
            <Field label="Brand impersonation hit" value={url_structure?.brand_impersonation_hit || "None"} />
          </Panel>
        </Reveal>

        <Reveal delay={220} className="md:col-span-2">
          <Panel icon={ExternalLink} title="Page Content">
            <Field label="Page title" value={page?.title} />
            <Field label="Final URL (after redirects)" value={page?.final_url} />
            <Field label="HTTP status" value={page?.status_code} />
            <Field label="Has visible email" value={content?.has_visible_email ? "Yes" : "No"} />
            <Field label="Has visible phone" value={content?.has_visible_phone ? "Yes" : "No"} />
            <Field label="Has privacy policy link" value={content?.has_privacy_link ? "Yes" : "No"} />
            <Field label="Urgency phrases found" value={content?.urgency_phrases_found?.join(", ") || "None"} />
            {page?.error && <p className="text-[12px] text-warning mt-2">{page.error}</p>}
          </Panel>
        </Reveal>

        {ai_content_analysis && !ai_content_analysis.error && (
          <Reveal delay={260} className="md:col-span-2">
            <Panel icon={Sparkles} title="AI Content Analysis">
              <Field label="Urgency score" value={`${ai_content_analysis.urgency_score}/100`} />
              <Field label="AI-generated likelihood" value={`${ai_content_analysis.ai_generated_likelihood}/100`} />
              <Field label="Grammar quality" value={`${ai_content_analysis.grammar_quality_score}/100`} />
              {ai_content_analysis.summary && (
                <p className="text-[13px] text-sub mt-3 italic">"{ai_content_analysis.summary}"</p>
              )}
            </Panel>
          </Reveal>
        )}
      </div>
    </div>
  );
}
