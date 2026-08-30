import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../db/pool";
import { signToken } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(32),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, displayName } = parsed.data;

  const existing = await pool.query("SELECT id FROM players WHERE email = $1", [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO players (email, password_hash, display_name)
     VALUES ($1, $2, $3) RETURNING id, rank, level, cash_balance, notes_balance`,
    [email, passwordHash, displayName]
  );

  const player = result.rows[0];
  const token = signToken(player.id);
  res.status(201).json({ token, player });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const result = await pool.query(
    "SELECT id, password_hash, rank, level, cash_balance, notes_balance FROM players WHERE email = $1",
    [email]
  );
  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const player = result.rows[0];
  const valid = await bcrypt.compare(password, player.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken(player.id);
  delete player.password_hash;
  res.json({ token, player });
});
