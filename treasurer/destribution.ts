import { Elysia } from "elysia";
import client from "../db";

export const destributionRoutes = new Elysia({ prefix: "/treasurer" })

  // ======================================================
  // GET ALL PLANNED PROJECTS & UPCOMING EVENTS
  // ======================================================
  .get("/planned-items", async () => {
    try {
      // Fetch PLANNED PROJECTS
      const projects = await client.query(`
        SELECT 
          project_id,
          title,
          description,
          status,
          created_by,
          approved_by,
          created_at,
          amount
        FROM projects
        WHERE status = 'planned'
        ORDER BY created_at DESC;
      `);

      // Fetch UPCOMING EVENTS with amount > 0
      const events = await client.query(`
        SELECT
          event_id,
          title,
          description,
          event_date,
          location,
          created_by,
          amount
        FROM events
        WHERE event_date >= CURRENT_DATE
          AND amount > 0
        ORDER BY event_date ASC;
      `);

      return {
        success: true,
        planned_projects: projects.rows,
        planned_events: events.rows
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error fetching planned data:", errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  })

  // ======================================================
  // UPDATE EXPENSE / PROJECT OR EVENT
  // ======================================================
  .post("/update-expense", async ({ body }) => {
    try {
      const { id, status, amount, record_amount, description, recorded_by } = body as {
        id: number;
        status?: string;
        amount: number;
        record_amount: number;
        description: string;
        recorded_by: string;
      };

      // Determine if this is a project or event by id presence (optional)
      // Here, we assume the client will send `status` for projects only
      if (status !== undefined) {
        // Update project
        await client.query(
          `UPDATE projects SET status = $1, amount = $2 WHERE project_id = $3`,
          [status, amount, id]
        );
      } else {
        // Update event
        await client.query(
          `UPDATE events SET amount = $1 WHERE event_id = $2`,
          [amount, id]
        );
      }

      // Always record as type "expense" in finance_records
      await client.query(
        `INSERT INTO finance_records (type, description, amount, recorded_by)
         VALUES ($1, $2, $3, $4)`,
        ["expense", description, record_amount, recorded_by]
      );

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error updating expense:", errorMessage);
      return { success: false, message: errorMessage };
    }
  });
