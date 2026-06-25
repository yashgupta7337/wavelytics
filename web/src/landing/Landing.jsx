import { useEffect, useState } from "react";
import GradientText from "../components/GradientText.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import WaveMark from "../components/WaveMark.jsx";
import Reveal from "./Reveal.jsx";

// Wavelytics marketing landing page — the public front door at "/".
// Mounted via its own Vite entry (index.html) so it never touches the dashboard
// React tree. Styling mirrors the dashboard: slate-900/950 surfaces, sky-400
// primary accent, emerald-400/500 for "live"/positive signals.

// The live dashboard console (separate Vite entry, served at "/app/").
// The dashboard reads ?auth= to open the sign-in / create-account screen.
const APP_URL = "/app/";
const SIGNIN_URL = "/app/?auth=signin";
const SIGNUP_URL = "/app/?auth=signup";

const CONTACT_EMAIL = "info@waveconnect.net.in";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=Wavelytics%20enquiry`;
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}&su=Wavelytics%20enquiry`;
const OFFICE_ADDRESS = "B-1, First Floor, Paschim Vihar, New Delhi - 110063, Delhi, India";

// Open Gmail by default (web compose, which also deep-links the Gmail app on
// mobile); fall back to the OS default mail client if the popup is blocked.
function openEmail(e) {
  if (e) e.preventDefault();
  const win = window.open(GMAIL_COMPOSE, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = CONTACT_MAILTO;
}

const NAV_LINKS = [
  ["#views", "Platform"],
  ["#segments", "Who it's for"],
  ["#how-it-works", "How it works"],
  ["#trust", "Security"],
  ["#about", "About us"],
  ["#contact", "Contact us"],
];


function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

function PrimaryCta({ href = CONTACT_MAILTO, children, className = "", onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 ${className}`}
    >
      {children}
    </a>
  );
}

function SecondaryCta({ href = "#how-it-works", children, className = "", onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface/60 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-sky-500 hover:text-sky-300 ${className}`}
    >
      {children}
    </a>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface/60 p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({ children, sev = "low" }) {
  const map = {
    high: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    med: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${map[sev]}`}
    >
      {children}
    </span>
  );
}

/* ---- Inline SVG icons (no external assets) ---- */

function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const icons = {
  exec: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3" />,
  ops: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3m10-10h-3M5 12H2m15.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2" />
    </>
  ),
  risk: (
    <>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v4m0 3h.01" />
    </>
  ),
  compliance: (
    <>
      <path d="M9 12.5 11 14.5 15.5 10" />
      <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3z" />
    </>
  ),
  connect: <path d="M9 12h6m-9 0H4m16 0h-2M7 8l-3 4 3 4m10-8 3 4-3 4" />,
  live: (
    <>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.3a2 2 0 0 1 3.4 0l7.5 12.6a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  shield: (
    <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3z" />
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6m-6 4h6" />
    </>
  ),
};

/* ---- Sections ---- */

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <a href="#top" className="flex items-center gap-2">
          <WaveMark className="h-6 w-6 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-ink">Wavelytics</span>
            <span className="text-[10px] text-muted">a product by WaveConnect</span>
          </span>
        </a>
        <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} className="transition hover:text-ink" href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <SecondaryCta href={SIGNIN_URL} className="px-4 py-2">
              Sign in
            </SecondaryCta>
            <PrimaryCta href={SIGNUP_URL}>Get started</PrimaryCta>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:text-ink md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg px-4 py-2 md:hidden">
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-muted transition hover:text-ink"
            >
              {label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-line pt-3">
            <SecondaryCta href={SIGNIN_URL} className="flex-1 px-4 py-2">
              Sign in
            </SecondaryCta>
            <PrimaryCta href={SIGNUP_URL} className="flex-1">
              Get started
            </PrimaryCta>
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(56,189,248,0.18) 0%, rgba(11,17,32,0) 70%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs text-muted">
            <LiveDot />
            Live operational, risk &amp; compliance intelligence
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            One pane of glass for{" "}
            <GradientText>operational health</GradientText>,{" "}
            <GradientText>risk</GradientText> &amp;{" "}
            <GradientText>compliance</GradientText>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Wavelytics is the operations &amp; compliance intelligence platform
            that helps regulated, ops-heavy teams see service performance, risk,
            and audit readiness live — and turn fragmented spreadsheets into
            RAG-rated, audit-ready answers.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryCta href={SIGNUP_URL}>Get started</PrimaryCta>
            <SecondaryCta href={APP_URL}>Launch the live demo →</SecondaryCta>
          </div>
          <p className="mt-4 text-xs text-faint">
            CSV upload or n8n push · per-tenant separation · audit-ready exports
          </p>
        </div>

        {/* Faux dashboard preview strip */}
        <div className="mx-auto mt-14 max-w-4xl">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-2" />
              </div>
              <span className="flex items-center gap-2 text-xs text-muted">
                <LiveDot /> LIVE · updated just now
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Reporting Accuracy", value: "99.2", unit: "%", tone: "text-emerald-400" },
                { label: "Workflow Completion", value: "96.4", unit: "%", tone: "text-emerald-400" },
                { label: "Compliance Readiness", value: "92", unit: "%", tone: "text-emerald-400" },
                { label: "Open Exceptions", value: "14", unit: "", tone: "text-amber-400" },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-lg border border-line bg-surface/60 p-3 text-left"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    {k.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${k.tone}`}>
                    {k.value}
                    {k.unit && (
                      <span className="ml-0.5 text-sm font-medium text-muted">
                        {k.unit}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
            {/* simple sparkline */}
            <div className="mt-3 rounded-lg border border-line bg-surface/40 p-3">
              <svg viewBox="0 0 600 80" className="h-20 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 60 L60 52 L120 56 L180 40 L240 44 L300 30 L360 34 L420 22 L480 26 L540 14 L600 18 L600 80 L0 80 Z"
                  fill="url(#lg)"
                />
                <path
                  d="M0 60 L60 52 L120 56 L180 40 L240 44 L300 30 L360 34 L420 22 L480 26 L540 14 L600 18"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

const VIEWS = [
  {
    key: "exec",
    name: "Executive",
    sev: "good",
    desc: "Overall operational health at a glance: throughput, completion, and reporting accuracy for leadership.",
    metrics: ["Reporting accuracy %", "Workflow completion %", "Compliance readiness %"],
  },
  {
    key: "ops",
    name: "Operational",
    sev: "low",
    desc: "Run the floor in real time: processing speed, turnaround time, backlog, exceptions, and error rate.",
    metrics: ["Processing speed (hrs)", "Turnaround time & backlog", "Exceptions & error rate"],
  },
  {
    key: "risk",
    name: "Risk",
    sev: "med",
    desc: "Quantified risk by category — Operational, Data, Compliance, Reporting — rated high / med / low.",
    metrics: ["Risk by category", "Collateral value & overdue valuations", "Monitoring coverage %"],
  },
  {
    key: "compliance",
    name: "Compliance",
    sev: "good",
    desc: "Stay inspection-ready: audit readiness, expiring documents, and regulatory reporting status.",
    metrics: ["Audit readiness %", "Expiring documents", "Regulatory reporting"],
  },
];

function Views() {
  return (
    <section id="views" className="border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge sev="low">Single pane of glass</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            Four views. <GradientText>One source of truth.</GradientText>
          </h2>
          <p className="mt-3 text-muted">
            Wavelytics unifies the four domains it grew out of — Data &amp;
            Analytics, Automated Screening, Collateral Monitoring, and
            Compliance/Regulatory Data Management — into role-built dashboards.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VIEWS.map((v) => (
            <Card key={v.key} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-2/40 text-sky-400">
                  <Icon path={icons[v.key]} />
                </span>
                <Badge sev={v.sev}>{v.name}</Badge>
              </div>
              <h3 className="text-base font-semibold text-ink">{v.name}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{v.desc}</p>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-xs text-muted">
                {v.metrics.map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const SEGMENTS = [
  { name: "NBFCs & lenders", note: "Collateral monitoring, overdue valuations, regulatory reporting" },
  { name: "Fintech", note: "Automated screening, exceptions, reporting accuracy at scale" },
  { name: "BPOs", note: "Per-client SLAs, turnaround time, backlog, workflow completion" },
  { name: "Insurance", note: "Operational health, audit readiness, document expiry" },
  { name: "Healthcare ops", note: "Compliance readiness, monitoring coverage, audit trails" },
];

function Segments() {
  return (
    <section id="segments" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge sev="med">Built for regulated, ops-heavy teams</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            Made for teams where <GradientText>mistakes are expensive</GradientText>
          </h2>
          <p className="mt-3 text-muted">
            If your operation is audited, regulated, and measured on SLAs,
            Wavelytics speaks your language out of the box.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SEGMENTS.map((s) => (
            <Card key={s.name}>
              <h3 className="text-sm font-semibold text-ink">{s.name}</h3>
              <p className="mt-2 text-xs text-muted">{s.note}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: "connect",
    title: "Connect your data",
    desc: "Upload your own CSV exports or push live data via n8n. Each pilot sees only their own numbers, with strict per-tenant separation.",
  },
  {
    icon: "live",
    title: "See health live",
    desc: "Operational, risk, and compliance health update as data flows in — across Executive, Operational, Risk, and Compliance views.",
  },
  {
    icon: "alert",
    title: "Act & prove it",
    desc: "Get RAG (red/amber/green) alerts on exceptions and risk, then generate audit-ready exports for regulators and clients.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge sev="low">How it works</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            <GradientText>Live in days, not quarters</GradientText>
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="relative">
              <span className="absolute right-4 top-4 text-4xl font-bold text-line">
                {i + 1}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-2/40 text-sky-400">
                <Icon path={icons[s.icon]} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  { icon: "doc", title: "Audit trail", desc: "Every metric is traceable to source data for inspection and audit readiness." },
  { icon: "lock", title: "Per-tenant separation", desc: "Each tenant's data is isolated. Logins are handled via Supabase Auth." },
  { icon: "shield", title: "Regulatory reporting", desc: "Audit-ready exports and regulatory reporting built for your compliance calendar." },
];

function Trust() {
  return (
    <section id="trust" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/60 text-emerald-400">
                <Icon path={icons[t.icon]} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{t.title}</h3>
                <p className="mt-1 text-sm text-muted">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TEAM = [
  {
    name: "Varun Gupta",
    role: "Founder & Managing Director",
    initials: "VG",
    accent: "from-sky-500 to-indigo-500",
    bio: (
      <>
        Building{" "}
        <a
          href="https://waveconnect.net.in"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-sky-400 underline-offset-2 hover:underline"
        >
          WaveConnect
        </a>{" "}
        from the ground up — a telecom business delivering services and expertise
        pan-India alongside premium OEMs, with a track record of excellence and
        quality. Wavelytics is the next layer: the intelligence platform the group
        needed and couldn't find. B.Tech in Electrical and Electronics Engineering
        from BITS Pilani.
      </>
    ),
  },
  {
    name: "Yash Gupta",
    role: "Engineering",
    initials: "YG",
    accent: "from-cyan-500 to-sky-500",
    bio: (
      <>
        Owned production data platforms solo for 2 years — cuts query time and
        cloud bills. Now brings that infrastructure thinking directly to Wavelytics,
        building the data backbone the platform runs on. B.Tech CSE, Shiv Nadar
        University.
      </>
    ),
  },
  {
    name: "Dhruv Gupta",
    role: "Product & Sales",
    initials: "DG",
    accent: "from-indigo-500 to-violet-500",
    bio: (
      <>
        Connects customer problems to roadmap and pipeline to pilots. The bridge
        between what Wavelytics needs to be and who needs it most. B.Tech CSE, Shiv
        Nadar University.
      </>
    ),
  },
];

const VALUES = [
  {
    t: "Engineering-led",
    d: "Built by engineers who ship dependable systems — not yet-another dashboard tool.",
  },
  {
    t: "Built for trust",
    d: "Per-tenant isolation, audit trails, and security taken seriously from day one.",
  },
  {
    t: "IT Products & Solutions",
    d: "Wavelytics leads WaveConnect's expansion into data, AI, and cloud software.",
  },
];

function About() {
  return (
    <section id="about" className="border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge sev="low">IT Products &amp; Solutions</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            Engineering-grade software, from a{" "}
            <GradientText>deep-tech company</GradientText>
          </h2>
          <p className="mt-3 text-muted">
            Wavelytics is built by{" "}
            <span className="font-semibold text-ink">WaveConnect</span> — an
            engineering-led technology company with a track record of delivering
            mission-critical, high-reliability systems. Wavelytics is our flagship IT
            product: that same engineering rigor, brought to data, AI, and cloud software
            for regulated, ops-heavy teams.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m) => (
            <Card key={m.name + m.role} className="flex flex-col items-start">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${m.accent} text-lg font-bold text-white shadow`}
              >
                {m.initials}
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{m.name}</h3>
              <p className="text-xs font-medium text-sky-400">{m.role}</p>
              <p className="mt-2 text-sm text-muted">{m.bio}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.t}>
              <h3 className="text-sm font-semibold text-ink">{v.t}</h3>
              <p className="mt-2 text-xs text-muted">{v.d}</p>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-faint">
          Part of{" "}
          <a
            href="https://waveconnect.net.in"
            target="_blank"
            rel="noreferrer"
            className="text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            WaveConnect Communications Pvt. Ltd.
          </a>{" "}
          · New Delhi, India
        </p>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <Card className="flex flex-col items-center gap-5 bg-gradient-to-b from-surface/80 to-surface/40 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            See your own operations, risk &amp; compliance — <GradientText>live.</GradientText>
          </h2>
          <p className="max-w-xl text-muted">
            Bring a CSV export to a 30-minute call and watch your real numbers
            light up across all four views.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryCta href={SIGNUP_URL}>Get started</PrimaryCta>
            <SecondaryCta href={APP_URL}>Launch the live demo →</SecondaryCta>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge sev="low">Contact us</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
            Let&apos;s <GradientText>talk</GradientText>
          </h2>
          <p className="mt-3 text-muted">
            A pilot, a question, or a guided walkthrough — we&apos;d love to hear from you.
          </p>
        </div>
        <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold text-ink">Email</h3>
            <a
              href={CONTACT_MAILTO}
              onClick={openEmail}
              className="mt-1 block break-words text-sm text-sky-400 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-ink">Corporate office</h3>
            <p className="mt-1 text-sm text-muted">{OFFICE_ADDRESS}</p>
          </Card>
        </div>
        <div className="mt-6 text-center">
          <PrimaryCta href={CONTACT_MAILTO} onClick={openEmail}>Email us</PrimaryCta>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-8 text-center text-xs text-faint">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 font-medium text-muted transition hover:border-sky-500 hover:text-sky-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M12 19V5m-7 7 7-7 7 7" />
          </svg>
          Back to top
        </button>
        <div className="flex items-center gap-2">
          <WaveMark className="h-4 w-4" />
          <span className="font-semibold text-muted">Wavelytics</span>
          <span>· a product by WaveConnect</span>
        </div>
        <p>© 2026 Wavelytics · part of WaveConnect Communications Pvt. Ltd.</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  // On (re)load, start at the top and strip any lingering #hash from the URL so
  // a refresh doesn't restore mid-page scroll or leave "#about" hanging.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-ink">
      <Nav />
      <main>
        <Hero />
        <Reveal>
          <Views />
        </Reveal>
        <Reveal>
          <Segments />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Trust />
        </Reveal>
        <Reveal>
          <About />
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
        <Reveal>
          <Contact />
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
