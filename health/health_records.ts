import { Elysia } from "elysia";
import client from "../db"; // PostgreSQL client instance

export const healthRecordsRoutes = (app: Elysia) =>
  app.group("/healthRecords", (app) =>
    app.get("/", async ({ set }) => {
      try {
        const res = await client.query(`
          SELECT
            h.health_id,
            h.user_id,
            u1.full_name AS user_name,
            h.record_type,
            h.details,
            h.recorded_by,
            u2.full_name AS recorded_by_name,
            h.recorded_at,
            h.status,
            h.disease_name,
            h.category
          FROM health_records h
          JOIN users u1 ON u1.user_id = h.user_id
          JOIN users u2 ON u2.user_id = h.recorded_by
          ORDER BY h.recorded_at DESC;
        `);

        return {
          success: true,
          count: res.rowCount,
          records: res.rows,
        };
      } catch (error: any) {
        console.error("Error fetching health records:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch health records",
          error: error.message,
        };
      }
    })
  );
