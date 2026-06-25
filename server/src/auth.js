// Supabase Auth integration.
//
// The web app signs users in with Supabase Auth and sends the resulting access
// token as a Bearer token. We verify it here so we don't make a round trip to
// Supabase per request.
//
// Supabase projects sign tokens one of two ways:
//   - new asymmetric "JWT signing keys" (ES256/RS256) — verified against the
//     project's public JWKS endpoint (needs SUPABASE_URL); this is the default
//     for current projects.
//   - the legacy HS256 "JWT secret" — verified with SUPABASE_JWT_SECRET.
// We support both: the token header's `alg` decides which path to use.
//
// If neither is configured, auth is disabled: protected routes return a clear
// 401 and the public snapshot serves the simulated demo feed, so the project
// still runs with zero setup.
import { createRemoteJWKSet, jwtVerify, decodeProtectedHeader } from "jose";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SECRET = process.env.SUPABASE_JWT_SECRET || "";

let jwks;
function getJwks() {
  if (!jwks && SUPABASE_URL) {
    jwks = createRemoteJWKSet(
      new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    );
  }
  return jwks;
}

export function authConfigured() {
  return Boolean(SUPABASE_URL || SECRET);
}

function bearer(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function verify(token) {
  let header;
  try {
    header = decodeProtectedHeader(token);
  } catch {
    return null;
  }

  try {
    let payload;
    if (header.alg === "HS256") {
      if (!SECRET) return null;
      ({ payload } = await jwtVerify(token, new TextEncoder().encode(SECRET), {
        algorithms: ["HS256"],
      }));
    } else {
      const ks = getJwks();
      if (!ks) return null;
      ({ payload } = await jwtVerify(token, ks, {
        algorithms: ["ES256", "RS256"],
      }));
    }
    return {
      id: payload.sub,
      email: payload.email || payload.user_metadata?.email,
    };
  } catch {
    return null;
  }
}

// Attaches req.user if a valid token is present; otherwise leaves it undefined.
// Never blocks — used by endpoints that serve demo data to anonymous callers.
export async function optionalAuth(req, _res, next) {
  if (authConfigured()) {
    const token = bearer(req);
    if (token) req.user = (await verify(token)) ?? undefined;
  }
  next();
}

// Requires a valid token. Returns 401 otherwise (including when auth is not
// configured, with a hint so the cause is obvious).
export async function requireAuth(req, res, next) {
  if (!authConfigured()) {
    return res.status(401).json({
      error: "auth_not_configured",
      message:
        "Set SUPABASE_URL (and/or SUPABASE_JWT_SECRET) on the API to enable logins and per-tenant uploads.",
    });
  }
  const token = bearer(req);
  const user = token ? await verify(token) : null;
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}
