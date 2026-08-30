import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { processPurchase } from "../services/billingService";
import { purchaseStoreItem } from "../services/economyService";

export const billingRouter = Router();

const purchaseSchema = z.object({
  platform: z.enum(["apple", "google"]),
  productSku: z.string(),
  rawReceipt: z.string(),
  purchaseToken: z.string().optional(),
  packageName: z.string().optional(),
});

// Real-money purchase (Notes packs) — hits the app store, verified server-side.
billingRouter.post("/purchase", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await processPurchase({ playerId: req.playerId!, ...parsed.data });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Spend already-owned Notes on a cosmetic/convenience item.
billingRouter.post("/store/:sku/buy", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await purchaseStoreItem(req.playerId!, req.params.sku);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
