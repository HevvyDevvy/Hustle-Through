import { pool } from "../db/pool";

/**
 * PROGRESSION SERVICE
 *
 * This is the ONLY code path in the entire backend allowed to write to
 * players.rank or players.level. The Billing/Economy services have no
 * function that calls into this module. If a future feature wants to let
 * purchases affect rank, it would require an engineer to deliberately wire
 * BillingService -> ProgressionService, which is an obvious, reviewable change
 * — not something that can happen by accident via a shared currency field.
 */

interface CompleteJobResult {
  cashAwarded: number;
  rankAfter: number;
  levelAfter: number;
  rankedUp: boolean;
}

export async function completeJob(playerId: string, jobId: string): Promise<CompleteJobResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const jobRes = await client.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
    if (jobRes.rowCount === 0) {
      throw new Error("Job not found");
    }
    const job = jobRes.rows[0];

    const playerRes = await client.query(
      "SELECT rank, level, cash_balance FROM players WHERE id = $1 FOR UPDATE",
      [playerId]
    );
    if (playerRes.rowCount === 0) {
      throw new Error("Player not found");
    }
    const player = playerRes.rows[0];

    if (job.rank_required > player.rank) {
      throw new Error("Player has not reached the rank required for this job");
    }

    // Bonus-pool jobs pay out but never advance level; story-gated jobs advance level.
    const newLevel = job.is_bonus_pool ? player.level : Math.max(player.level, job.level);

    // Rank advances only via rank_definitions.unlock_level, driven by the new level.
    const rankRes = await client.query(
      `SELECT rank FROM rank_definitions WHERE unlock_level <= $1 ORDER BY unlock_level DESC LIMIT 1`,
      [newLevel]
    );
    const newRank = rankRes.rows[0]?.rank ?? player.rank;
    const rankedUp = newRank > player.rank;

    const newCashBalance = player.cash_balance + job.cash_reward;

    await client.query(
      `UPDATE players SET cash_balance = $1, rank = $2, level = $3, updated_at = now() WHERE id = $4`,
      [newCashBalance, newRank, newLevel, playerId]
    );

    await client.query(
      `INSERT INTO progression_events (player_id, job_id, cash_awarded, rank_after, level_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [playerId, jobId, job.cash_reward, newRank, newLevel]
    );

    // Apply any story flags this job sets
    const flags = job.story_flags_set ?? {};
    for (const [key, value] of Object.entries(flags)) {
      await client.query(
        `INSERT INTO player_story_flags (player_id, flag_key, flag_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (player_id, flag_key) DO UPDATE SET flag_value = EXCLUDED.flag_value`,
        [playerId, key, JSON.stringify(value)]
      );
    }

    await client.query("COMMIT");

    return {
      cashAwarded: job.cash_reward,
      rankAfter: newRank,
      levelAfter: newLevel,
      rankedUp,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
