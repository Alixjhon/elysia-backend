import { Elysia } from "elysia";
import "dotenv/config";
import client from "./db";
import { loginRoutes } from "./login";
import { registerRoutes } from "./register";
import { healthDashboardRoutes } from "./health/health_dashboard";
import { appointmentRoutes } from "./health/appoint";
import { appointmentAdminRoutes } from "./health/appoint_admin";
import { inventoryRoutes } from "./health/supplies_admin";
import { healthRecordsRoutes } from "./health/health_records";
import { requestDocumentRoutes } from "./Resident/request_documents";
import { secretaryRoutes } from "./secretary/secretary_dasboard";
import { documentRequestRoutes } from "./secretary/document_request";
import { treasurerDashboard } from "./treasurer/treasurer_dashboard";
import { destributionRoutes } from "./treasurer/destribution";

// Render provides PORT — fallback to 3000 locally
const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .use(loginRoutes)
  .use(registerRoutes)
  .use(healthDashboardRoutes)
  .use(appointmentRoutes)
  .use(appointmentAdminRoutes)
  .use(inventoryRoutes)
  .use(healthRecordsRoutes)
  .use(requestDocumentRoutes)
  .use(secretaryRoutes)
  .use(documentRequestRoutes)
  .use(treasurerDashboard)
  .use(destributionRoutes)

  // Root endpoint
  .get("/", () => "Hello from Elysia!")

  // Fetch all users
  .get("/users", async () => {
    try {
      const res = await client.query(`
        SELECT 
          u.user_id,
          u.role_id,
          r.role_name,
          u.full_name,
          u.email,
          u.contact_number,
          u.address,
          u.status,
          u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
      `);
      return res.rows;
    } catch (err) {
      console.error(err);
      return { error: "Failed to fetch users" };
    }
  })

  // Delete user
  .delete("/users/:userId", async ({ params }) => {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return { error: "Invalid user ID" };
    }

    try {
      const res = await client.query("DELETE FROM users WHERE user_id = $1", [userId]);
      return {
        success: true,
        message: `Deleted ${res.rowCount} user(s) with user_id = ${userId}`,
      };
    } catch (err) {
      console.error(err);
      return { error: "Failed to delete user(s)" };
    }
  });

// ✅ START SERVER (this must be *after* the chain)
app.listen(port);

console.log(`🦊 Elysia server is running on port ${port}`);
