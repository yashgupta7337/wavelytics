// Wavelytics API server.
import express from "express";
import cors from "cors";
import { initStore, getSnapshot, isUsingDb } from "./store.js";

const app = express();

// CORS: in production set CORS_ORIGIN to the deployed web origin
// (comma-separated for multiple, e.g. a Vercel preview + prod URL).
// Unset => allow all origins, which is fine for local dev and the public demo.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", source: isUsingDb() ? "postgres" : "simulated" });
});

app.get("/api/snapshot", (req, res) => {
  res.json(getSnapshot());
});

const PORT = process.env.PORT || 4000;

await initStore();
app.listen(PORT, () => {
  console.log(`[wavelytics] API listening on http://localhost:${PORT}`);
});
