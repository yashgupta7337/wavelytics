import { useEffect, useState } from "react";
import { supabase, authEnabled } from "./lib/supabase.js";

// Tracks the Supabase session and exposes the access token used to call the
// API. When auth is not configured it resolves immediately to a signed-out,
// demo-only state so the rest of the app doesn't have to special-case it.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!authEnabled);

  useEffect(() => {
    if (!authEnabled) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    authEnabled,
    ready,
    session,
    user: session?.user ?? null,
    token: session?.access_token ?? null,
    signOut: () => supabase?.auth.signOut(),
  };
}
