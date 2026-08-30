import { pool } from "../src/db/pool";
import { jobSeeds } from "../src/config/jobData";

async function seed() {
  for (const job of jobSeeds) {
    await pool.query(
      `INSERT INTO jobs (id, level, rank_required, title, location, task_description, cash_reward, is_story_gate, is_bonus_pool, story_flags_set)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         level = EXCLUDED.level,
         rank_required = EXCLUDED.rank_required,
         title = EXCLUDED.title,
         location = EXCLUDED.location,
         task_description = EXCLUDED.task_description,
         cash_reward = EXCLUDED.cash_reward,
         is_story_gate = EXCLUDED.is_story_gate,
         is_bonus_pool = EXCLUDED.is_bonus_pool,
         story_flags_set = EXCLUDED.story_flags_set`,
      [
        job.id,
        job.level,
        job.rankRequired,
        job.title,
        job.location,
        job.taskDescription,
        job.cashReward,
        job.isStoryGate,
        job.isBonusPool,
        JSON.stringify(job.storyFlagsSet ?? {}),
      ]
    );
    console.log(`Seeded: ${job.id}`);
  }
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
