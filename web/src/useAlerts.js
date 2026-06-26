import { useEffect, useRef, useState } from "react";
import { fetchTimeout } from "./lib/fetchTimeout.js";

const API = import.meta.env.VITE_API_URL ?? "";

const EMPTY = {
  results: [],
  summary: { green: 0, amber: 0, red: 0, total: 0, overall: "healthy" },
  statusByMetric: {},
  events: [],
};

// Polls /api/alerts for the rule-evaluated RAG status, summary, and recent
// breach events. Sends the Supabase token so authed callers get their tenant's
// rules/data; degrades to an empty (neutral) state if the API is unreachable.
export function useAlerts(token = null, refreshSignal = 0, intervalMs = 8000) {
  const [alerts, setAlerts] = useState(EMPTY);
  const offline = useRef(false);

  useEffect(() => {
    let alive = true;
    offline.current = false;

    async function tick() {
      if (offline.current) return;
      try {
        const res = await fetchTimeout(`${API}/api/alerts`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (alive) setAlerts(json);
      } catch {
        // Authed: keep trying for the tenant's real rule status (don't blank).
        // Demo: settle on neutral so a cold API doesn't stall the UI.
        if (token) return;
        offline.current = true;
        if (alive) setAlerts(EMPTY);
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token, refreshSignal, intervalMs]);

  return alerts;
}

// Map a rule status to a KpiCard/Stat tone. Falls back to the view's previous
// behavior when no rule covers the metric (or the API is offline).
export function toneFor(statusMap, key, fallback = "default") {
  const s = statusMap?.[key];
  return s === "red" ? "bad" : s === "amber" ? "warn" : s === "green" ? "good" : fallback;
}
