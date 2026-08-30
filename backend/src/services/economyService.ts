import { pool } from "../db/pool";

/**
 * Notes (hard currency) may ONLY buy items from store_items — cosmetics,
 * convenience, or time_saver categories. There is no function here that
 * spends Notes on rank or level; that lives exclusively in progressionService.
 */

export async function creditNotes(playerId: string, amount: number) {
  await pool.query(
    "UPDATE players SET notes_balance = notes_balance + $1, updated_at = now() WHERE id = $2",
    [amount, playerId]
  );
}

export async function purchaseStoreItem(playerId: string, sku: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itemRes = await client.query(
      "SELECT * FROM store_items WHERE sku = $1 AND active = true",
      [sku]
    );
    if (itemRes.rowCount === 0) throw new Error("Store item not found or inactive");
    const item = itemRes.rows[0];

    if (item.price_notes == null) {
      throw new Error("This item is not purchasable with Notes (real-money only)");
    }

    const playerRes = await client.query(
      "SELECT notes_balance FROM players WHERE id = $1 FOR UPDATE",
      [playerId]
    );
    if (playerRes.rowCount === 0) throw new Error("Player not found");
    const { notes_balance } = playerRes.rows[0];

    if (notes_balance < item.price_notes) {
      throw new Error("Insufficient Notes balance");
    }

    await client.query(
      "UPDATE players SET notes_balance = notes_balance - $1, updated_at = now() WHERE id = $2",
      [item.price_notes, playerId]
    );
    await client.query(
      `INSERT INTO player_inventory (player_id, sku) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [playerId, sku]
    );

    await client.query("COMMIT");
    return { sku, notesSpent: item.price_notes };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
