import { useEffect, useRef, useState } from "react";
import { seedData, nextData } from "./data/feed.js";

// Base URL of the API. Empty string => same origin (dev proxy / co-hosted).
// Set VITE_API_URL at build time to point at a deployed API.
const API = import.meta.env.VITE_API_URL ?? "";

// Subscribes to the Wavelytics metrics API and refreshes on an interval.
// If the API can't be reached (e.g. a static-only preview deploy), it
// transparently falls back to the local simulated feed so the console always
// renders live-looking data.
export function useLiveData(intervalMs = 3000) {
  const [data, setData] = useState(seedData);
  const offline = useRef(false);

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (!offline.current) {
        try {
          const res = await fetch(`${API}/api/snapshot`, { cache: "no-store" });
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
  }, [intervalMs]);

  return data;
}
