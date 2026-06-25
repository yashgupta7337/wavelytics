// Supabase Auth integration.
//
// The web app signs users in with Supabase Auth and sends the resulting access
// token as a Bearer token. Supabase signs these JWTs (HS256) with the project's
// JWT secret, so we verify them here with SUPABASE_JWT_SECRET — no extra round
// trip to Supabase per request.
//
// If SUPABASE_JWT_SECRET is not set (e.g. the zero-config local/demo run), auth
// is disabled: protected routes return a clear 401 and the public snapshot
// serves the simulated demo feed. This keeps the project runnable with no setup.
import jwt from "jsonwebtoken";

const SECRET = process.env.SUPABASE_JWT_SECRET || "";

export function authConfigured() {
  return Boolean(SECRET);
}

function verify(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const claims = jwt.verify(token, SECRET);
    return { id: claims.sub, email: claims.email || claims.user_metadata?.email };
  } catch {
    return null;
  }
}

// Attaches req.user if a valid token is present; otherwise leaves it undefined.
// Never blocks — used by endpoints that serve demo data to anonymous callers.
export function optionalAuth(req, _res, next) {
  if (SECRET) req.user = verify(req) ?? undefined;
  next();
}

// Requires a valid token. Returns 401 otherwise (including when auth is not
// configured, with a hint so the cause is obvious).
export function requireAuth(req, res, next) {
  if (!SECRET) {
    return res.status(401).json({
      error: "auth_not_configured",
      message:
        "Set SUPABASE_JWT_SECRET on the API to enable logins and per-tenant uploads.",
    });
  }
  const user = verify(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}
