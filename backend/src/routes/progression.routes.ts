import { Router } from "express";
import { pool } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const progressionRouter = Router();

progressionRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const result = await pool.query(
    `SELECT p.id, p.display_name, p.rank, p.level, p.cash_balance, p.notes_balance, r.title AS rank_title, r.tier
     FROM players p JOIN rank_definitions r ON r.rank = p.rank
     WHERE p.id = $1`,
    [req.playerId]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Player not found" });
  res.json(result.rows[0]);
});

progressionRouter.get("/me/story-flags", requireAuth, async (req: AuthedRequest, res) => {
  const result = await pool.query(
    "SELECT flag_key, flag_value FROM player_story_flags WHERE player_id = $1",
    [req.playerId]
  );
  res.json(Object.fromEntries(result.rows.map((r: any) => [r.flag_key, r.flag_value])));
});
