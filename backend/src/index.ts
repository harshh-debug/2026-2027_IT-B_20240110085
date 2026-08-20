import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "obe-backend", version: "0.1.0" });
});

app.listen(PORT, () => {
  console.log(`OBE backend listening on http://localhost:${PORT}`);
});