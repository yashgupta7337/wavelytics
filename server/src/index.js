// Wavelytics API server.
import express from "express";
import cors from "cors";
import { initStore, getSnapshot, isUsingDb } from "./store.js";

const app = express();
app.use(cors());
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
