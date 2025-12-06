import { Elysia } from "elysia";
import client from "../db";

export const kagawadDashboard = new Elysia({ prefix: "/kagawad" })

  // =======================================================
  // 1. LEGISLATION (Mapped to PROJECTS)
  // =======================================================
  .get("/legislation-count", async () => {
    try {
      const result = await client.query(`
        SELECT COUNT(*) AS total_legislation
        FROM projects
      `);

      return { totalLegislation: result.rows[0].total_legislation };
    } catch (err) {
      console.error("❌ Error:", err);
      return { error: "Failed to load legislation count" };
    }
  })


  // =======================================================
  // 2. COMMUNITY PROGRAM DISTRIBUTION (Mapped to EVENTS by month)
  // =======================================================
  .get("/program-distribution", async () => {
    try {
      const result = await client.query(`
        SELECT 
          TO_CHAR(event_date, 'Month') AS label,
          COUNT(*) AS total
        FROM events
        GROUP BY label
        ORDER BY MIN(event_date)
      `);

      return { distribution: result.rows };
    } catch (err) {
      console.error("❌ Error:", err);
      return { error: "Failed to load program distribution" };
    }
  })


  // =======================================================
  // 3. PUBLIC SAFETY (Mapped to health_records.category)
  // =======================================================
  .get("/public-safety", async () => {
    try {
      const result = await client.query(`
        SELECT 
          category AS label,
          COUNT(*) AS total
        FROM health_records
        GROUP BY category
      `);

      return { safetyStats: result.rows };
    } catch (err) {
      console.error("❌ Error:", err);
      return { error: "Failed to load public safety data" };
    }
  })


  // =======================================================
  // 4. BUDGET (Mapped to finance_records)
  // =======================================================
  .get("/budget", async () => {
    try {
      const result = await client.query(`
        SELECT
          SUM(CASE WHEN type = 'allocation' THEN amount ELSE 0 END) AS allocated,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS spent
        FROM finance_records
      `);

      return {
        allocated: result.rows[0].allocated || 0,
        spent: result.rows[0].spent || 0
      };
    } catch (err) {
      console.error("❌ Error:", err);
      return { error: "Failed to load budget data" };
    }
  })


  // =======================================================
  // 5. CONSTITUENT SERVICES (Mapped to appointments + documents)
  // =======================================================
  .get("/constituent-services", async () => {
    try {
      const result = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM appointments) +
          (SELECT COUNT(*) FROM document_requests) AS total_services
      `);

      return { totalServices: result.rows[0].total_services };
    } catch (err) {
      console.error("❌ Error:", err);
      return { error: "Failed to load services count" };
    }
  })


  // =======================================================
  // 6. RECENT ACTIVITIES (Mapped to system_logs for Kagawad users)
  // =======================================================
  .get("/recent-activities", async () => {
    try {
      const result = await client.query(`
        SELECT 
          sl.log_id,
          sl.action,
          sl.module,
          sl.details,
          sl.timestamp,
          u.full_name
        FROM system_logs sl
        JOIN users u ON sl.user_id = u.user_id
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'Kagawad'
        ORDER BY sl.timestamp DESC
        LIMIT 10
      `);

      return { activities: result.rows };
    } catch (err) {
      console.error("❌ Error:", err);
      return { error: "Failed to load recent activities" };
    }
  });
