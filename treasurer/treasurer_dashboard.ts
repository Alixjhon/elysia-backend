import { Elysia } from "elysia";
import client from "../db"; // PostgreSQL connection

export const treasurerDashboard = new Elysia({ prefix: "/treasurer" })

  // =======================================================
  // 1. TOTAL COLLECTIONS (SUM(amount))
  // =======================================================
  .get("/total-collections", async () => {
    try {
      const result = await client.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_collections
        FROM finance_records
      `);

      return { totalCollections: result.rows[0].total_collections };
    } catch (err: unknown) {
      console.error("❌ Error fetching total collections:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch total collections" };
    }
  })

  // =======================================================
  // 2. FUND DISTRIBUTION (Pie chart by 'type')
  // =======================================================
  .get("/fund-distribution", async () => {
    try {
      const result = await client.query(`
        SELECT 
          type AS label,
          SUM(amount) AS total
        FROM finance_records
        GROUP BY type
      `);

      return { distribution: result.rows };
    } catch (err: unknown) {
      console.error("❌ Error fetching fund distribution:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch fund distribution" };
    }
  })


  // =======================================================
  // 3. RECENT TRANSACTIONS (last 10)
  // =======================================================
  .get("/recent-transactions", async () => {
    try {
      const result = await client.query(`
        SELECT 
          fr.record_id,
          fr.type,
          fr.amount,
          fr.description,
          fr.recorded_at,
          u.full_name AS user
        FROM finance_records fr
        LEFT JOIN users u ON fr.recorded_by = u.user_id
        ORDER BY fr.recorded_at DESC
        LIMIT 10
      `);

      return { transactions: result.rows };
    } catch (err: unknown) {
      console.error("❌ Error fetching recent transactions:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch recent transactions" };
    }
  });
