import { useEffect, useRef, useState } from "react";
import { seedData, nextData } from "./data/feed.js";

// Base URL of the API. Empty string => same origin (dev proxy / co-hosted).
// Set VITE_API_URL at build time to point at a deployed API.
const API = import.meta.env.VITE_API_URL ?? "";

// Subscribes to the Wavelytics metrics API and refreshes on an interval.
// When a Supabase access token is supplied, it is sent as a Bearer token so the
// API returns the caller's tenant data instead of the public demo feed.
// If the API can't be reached (e.g. a static-only preview deploy), it
// transparently falls back to the local simulated feed so the console always
// renders live-looking data.
//
// `refreshSignal` lets callers force an immediate re-fetch (e.g. after an
// upload) by changing its value.
export function useLiveData(intervalMs = 3000, token = null, refreshSignal = 0) {
  const [data, setData] = useState(seedData);
  const offline = useRef(false);

  useEffect(() => {
    let alive = true;
    offline.current = false; // token/refresh changed — try the API again

    async function tick() {
      if (!offline.current) {
        try {
          const res = await fetch(`${API}/api/snapshot`, {
            cache: "no-store",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) throw new Error(`status ${res.status}`);
          const json = await res.json();
          if (alive) setData(json);
          return;
        } catch {
          offline.current = true; // stop hammering a missing API
        }
      }
      if (alive) setData((prev) => nextData(prev));
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs, token, refreshSignal]);

  return data;
}
