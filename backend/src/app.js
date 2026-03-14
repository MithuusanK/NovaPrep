import express from "express";
import cors from "cors";
import interviewRoutes from "./routes/interviewRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "NovaPrep API" });
});

app.use("/api", interviewRoutes);
app.use(errorHandler);

export default app;
