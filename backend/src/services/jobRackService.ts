import { pool } from "../db/pool";

export async function getRackForPlayer(playerId: string) {
  const playerRes = await pool.query("SELECT rank, level FROM players WHERE id = $1", [playerId]);
  if (playerRes.rowCount === 0) throw new Error("Player not found");
  const { rank, level } = playerRes.rows[0];

  // Story jobs: the next uncompleted level at or below the player's current rank.
  const storyJobs = await pool.query(
    `SELECT * FROM jobs
     WHERE rank_required <= $1 AND is_bonus_pool = false AND level > $2
     ORDER BY level ASC LIMIT 3`,
    [rank, level]
  );

  // Bonus pool: repeatable cash-in-hand jobs available at the player's rank.
  const bonusJobs = await pool.query(
    `SELECT * FROM jobs WHERE rank_required <= $1 AND is_bonus_pool = true ORDER BY random() LIMIT 3`,
    [rank]
  );

  return {
    playerRank: rank,
    playerLevel: level,
    storyJobs: storyJobs.rows,
    bonusJobs: bonusJobs.rows,
  };
}
