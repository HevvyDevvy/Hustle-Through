import express from "express";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes";
import { progressionRouter } from "./routes/progression.routes";
import { jobsRouter } from "./routes/jobs.routes";
import { billingRouter } from "./routes/billing.routes";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/progression", progressionRouter);
app.use("/jobs", jobsRouter);
app.use("/billing", billingRouter);

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`Hustle Through API listening on :${port}`);
});
