import { Elysia, t } from "elysia";
import client from "../db"; // PostgreSQL client connection

export const documentRequestRoutes = new Elysia({ prefix: "/document-requests" })

  // ================================
  // FETCH PENDING REQUESTS
  // ================================
  .get("/pending", async () => {
    try {
      const result = await client.query(`
        SELECT *
        FROM document_requests
        WHERE status = 'pending'
        ORDER BY requested_at DESC
      `);
      return result.rows;
    } catch (err: unknown) {
      console.error("❌ Error fetching pending document requests:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch pending document requests" };
    }
  })

  // ================================
  // FETCH APPROVED REQUESTS
  // ================================
  .get("/approved", async () => {
    try {
      const result = await client.query(`
        SELECT *
        FROM document_requests
        WHERE status = 'approved'
        ORDER BY requested_at DESC
      `);
      return result.rows;
    } catch (err: unknown) {
      console.error("❌ Error fetching approved document requests:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch approved document requests" };
    }
  })

  // ================================
  // FETCH REJECTED REQUESTS
  // ================================
  .get("/rejected", async () => {
    try {
      const result = await client.query(`
        SELECT *
        FROM document_requests
        WHERE status = 'rejected'
        ORDER BY requested_at DESC
      `);
      return result.rows;
    } catch (err: unknown) {
      console.error("❌ Error fetching rejected document requests:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch rejected document requests" };
    }
  })

  // ================================
  // UPDATE STATUS (Approve / Reject)
  // ================================
  .post(
    "/update-status",
    async ({ body }) => {
      try {
        const { request_id, status, approved_by } = body;

        if (!["approved", "rejected"].includes(status)) {
          return { success: false, message: "Invalid status value" };
        }

        const approvedByNumber = typeof approved_by === "number" ? approved_by : null;

        const result = await client.query(
          `
          UPDATE document_requests
          SET status = $1,
              approved_by = $2
          WHERE request_id = $3
          RETURNING request_id, user_id
          `,
          [status, approvedByNumber, request_id]
        );

        if (result.rowCount === 0) {
          return { success: false, message: "Request not found" };
        }

        return {
          success: true,
          message: "Status updated successfully",
          request_id
        };
      } catch (err: unknown) {
        console.error("❌ Error updating status:", err);
        const message = err instanceof Error ? err.message : String(err);
        return { error: message || "Failed to update status" };
      }
    },
    {
      body: t.Object({
        request_id: t.Number(),
        status: t.String(),
        approved_by: t.Optional(t.Number()) // Must be number
      })
    }
  )

  // ================================
  // GET REQUESTS BY STATUS (Generic)
  // ================================
  .get("/list/:status", async ({ params }) => {
    try {
      const result = await client.query(
        `
        SELECT *
        FROM document_requests
        WHERE status = $1
        ORDER BY requested_at DESC
        `,
        [params.status]
      );
      return result.rows;
    } catch (err: unknown) {
      console.error("❌ Error fetching requests:", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: message || "Failed to fetch requests" };
    }
  });
