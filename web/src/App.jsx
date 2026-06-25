import { useState } from "react";
import { useLiveData } from "./useLiveData.js";
import Executive from "./views/Executive.jsx";
import Operational from "./views/Operational.jsx";
import Risk from "./views/Risk.jsx";
import Compliance from "./views/Compliance.jsx";

const TABS = [
  { id: "executive", label: "Executive", Component: Executive },
  { id: "operational", label: "Operational", Component: Operational },
  { id: "risk", label: "Risk", Component: Risk },
  { id: "compliance", label: "Compliance", Component: Compliance },
];

export default function App() {
  const [active, setActive] = useState("executive");
  const data = useLiveData(3000);
  const { Component } = TABS.find((t) => t.id === active);
  const updated = new Date(data.updatedAt).toLocaleTimeString();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              Wavelytics
            </h1>
            <p className="text-xs text-slate-500">
              Operations &amp; Compliance Intelligence
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            LIVE · updated {updated}
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-800 bg-slate-900/20">
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                active === t.id
                  ? "border-sky-400 text-sky-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Component data={data} />
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-600">
        © 2026 Wavelytics · a WaveConnect company
      </footer>
    </div>
  );
}
