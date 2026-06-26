import { useEffect, useState } from "react";
import { supabase, authEnabled } from "./lib/supabase.js";

// Tracks the Supabase session and exposes the access token used to call the
// API. When auth is not configured it resolves immediately to a signed-out,
// demo-only state so the rest of the app doesn't have to special-case it.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!authEnabled);
  // Password-recovery mode: the reset email link lands on /app/?recovery=1 and
  // Supabase also fires a PASSWORD_RECOVERY event. We track both so App can show
  // the "set a new password" screen instead of the dashboard. Seed synchronously
  // from the URL to avoid a flash of the dashboard before the event arrives.
  const [recovery, setRecovery] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("recovery") === "1"
  );

  useEffect(() => {
    if (!authEnabled) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    authEnabled,
    ready,
    session,
    user: session?.user ?? null,
    token: session?.access_token ?? null,
    recovery,
    clearRecovery: () => setRecovery(false),
    signOut: () => supabase?.auth.signOut(),
  };
}
