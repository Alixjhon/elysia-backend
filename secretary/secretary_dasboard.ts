import { Elysia, t } from "elysia";
import client from "../db"; // PostgreSQL client connection

export const secretaryRoutes = new Elysia({ prefix: "/secretary" })

  // ✅ Fetch overview metrics (total requests, pending, approved)
  .get("/overview", async () => {
    try {
      const totalResult = await client.query(`SELECT COUNT(*) AS total FROM document_requests`);
      const pendingResult = await client.query(`SELECT COUNT(*) AS pending FROM document_requests WHERE status = 'pending'`);
      const approvedResult = await client.query(`SELECT COUNT(*) AS approved FROM document_requests WHERE status = 'approved'`);

      return {
        total_requests: parseInt(totalResult.rows[0].total),
        pending_requests: parseInt(pendingResult.rows[0].pending),
        approved_requests: parseInt(approvedResult.rows[0].approved),
      };
    } catch (err) {
      console.error("❌ Error fetching overview metrics:", err);
      return { error: "Failed to fetch overview metrics" };
    }
  })

  // ✅ Fetch recent document requests (for RecyclerView)
  .get("/recent-requests", async () => {
    try {
      const result = await client.query(`
        SELECT request_id, user_id, doc_type_id, purpose, full_name, status, requested_at
        FROM document_requests
        ORDER BY requested_at DESC
        LIMIT 10
      `);
      return result.rows;
    } catch (err) {
      console.error("❌ Error fetching recent document requests:", err);
      return { error: "Failed to fetch recent document requests" };
    }
  })

  // ✅ Fetch residents statistics (for PieChart)
  .get("/residents-stats", async () => {
    try {
      const total = await client.query(`SELECT COUNT(*) AS total FROM users WHERE role_id = 2`);
      const male = await client.query(`SELECT COUNT(*) AS male FROM users WHERE role_id = 2 AND sex = 'Male'`);
      const female = await client.query(`SELECT COUNT(*) AS female FROM users WHERE role_id = 2 AND sex = 'Female'`);


      return {
        total: parseInt(total.rows[0].total),
        male: parseInt(male.rows[0].male),
        female: parseInt(female.rows[0].female),
      };
    } catch (err) {
      console.error("❌ Error fetching residents stats:", err);
      return { error: "Failed to fetch residents stats" };
    }
  })

  // ✅ Approve a document request (Secretary forwards to Barangay Captain)
  .post(
    "/approve-request",
    async ({ body }) => {
      try {
        const result = await client.query(
          `UPDATE document_requests SET status = 'approved', approved_at = NOW() WHERE request_id = $1 RETURNING request_id, status`,
          [body.request_id]
        );
        return { success: true, data: result.rows[0], message: "Document request approved" };
      } catch (err) {
        console.error("❌ Error approving document request:", err);
        return { error: "Failed to approve document request" };
      }
    },
    {
      body: t.Object({
        request_id: t.Number(),
      }),
    }
  )

  // ✅ Reject a document request
  .post(
    "/reject-request",
    async ({ body }) => {
      try {
        const result = await client.query(
          `UPDATE document_requests SET status = 'rejected', rejected_at = NOW(), remarks = $2 WHERE request_id = $1 RETURNING request_id, status`,
          [body.request_id, body.remarks || null]
        );
        return { success: true, data: result.rows[0], message: "Document request rejected" };
      } catch (err) {
        console.error("❌ Error rejecting document request:", err);
        return { error: "Failed to reject document request" };
      }
    },
    {
      body: t.Object({
        request_id: t.Number(),
        remarks: t.Optional(t.String()),
      }),
    }
  );
