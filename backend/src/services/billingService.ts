import { pool } from "../db/pool";
import { verifyAppleReceipt, verifyGoogleReceipt } from "./receiptValidation";
import { creditNotes } from "./economyService";

interface PurchaseRequest {
  playerId: string;
  platform: "apple" | "google";
  productSku: string;
  rawReceipt: string;
  // Google only:
  purchaseToken?: string;
  packageName?: string;
}

// SKU -> Notes granted. Real-money Notes packs, NOT rank/level skips.
const NOTES_PACKS: Record<string, number> = {
  "notes_pack_small": 100,
  "notes_pack_medium": 550,
  "notes_pack_large": 1200,
};

export async function processPurchase(req: PurchaseRequest) {
  // 1. Log the attempt immediately, status pending — before any verification.
  const txRes = await pool.query(
    `INSERT INTO transactions (player_id, platform, product_sku, raw_receipt, verification_status)
     VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
    [req.playerId, req.platform, req.productSku, req.rawReceipt]
  );
  const transactionId = txRes.rows[0].id;

  // 2. Verify server-side against the platform. Never trust the client's claim.
  let valid = false;
  try {
    if (req.platform === "apple") {
      const result = await verifyAppleReceipt(req.rawReceipt);
      valid = result.valid;
    } else {
      const result = await verifyGoogleReceipt(
        req.packageName ?? process.env.GOOGLE_PLAY_PACKAGE_NAME!,
        req.productSku,
        req.purchaseToken!
      );
      valid = result.valid;
    }
  } catch (err) {
    console.error("Receipt verification error", err);
    valid = false;
  }

  if (!valid) {
    await pool.query(
      "UPDATE transactions SET verification_status = 'rejected' WHERE id = $1",
      [transactionId]
    );
    throw new Error("Receipt verification failed");
  }

  // 3. Only on verified success: credit Notes (hard currency), never rank/level.
  const notesToCredit = NOTES_PACKS[req.productSku] ?? 0;
  if (notesToCredit > 0) {
    await creditNotes(req.playerId, notesToCredit);
  }

  await pool.query(
    `UPDATE transactions
     SET verification_status = 'verified', notes_credited = $1, verified_at = now()
     WHERE id = $2`,
    [notesToCredit, transactionId]
  );

  return { transactionId, notesCredited: notesToCredit };
}
