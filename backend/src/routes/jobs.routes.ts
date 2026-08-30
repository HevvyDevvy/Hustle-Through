import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { getRackForPlayer } from "../services/jobRackService";
import { completeJob } from "../services/progressionService";

export const jobsRouter = Router();

jobsRouter.get("/rack", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const rack = await getRackForPlayer(req.playerId!);
    res.json(rack);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

jobsRouter.post("/:jobId/complete", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await completeJob(req.playerId!, req.params.jobId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
