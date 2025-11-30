import { Elysia, t } from "elysia";
import client from "./db";

export const loginRoutes = (app: Elysia) =>
  app.post(
    "/login",
    async ({ body, set }) => {
      const email = body?.email ?? "";
      const password = body?.password ?? "";

      if (!email || !password) {
        set.status = 400;
        return { success: false, message: "Email and password are required" };
      }

      try {
        // Fetch user + role name
        const result = await client.query(
          `SELECT u.user_id, u.full_name, u.email, u.role_id, r.role_name, u.status
           FROM users u
           JOIN roles r ON u.role_id = r.role_id
           WHERE u.email = $1 AND u.password = $2`,
          [email, password]
        );

        if (result.rowCount === 0) {
          set.status = 401;
          return { success: false, message: "Invalid email or password" };
        }

        const user = result.rows[0];

        if (user.status !== "active") {
          set.status = 403;
          return { success: false, message: "Account is inactive" };
        }

        // Insert session
        await client.query(
          `INSERT INTO sessions (user_id, login_time) VALUES ($1, NOW())`,
          [user.user_id]
        );

        return {
          success: true,
          user: {
            id: user.user_id,
            name: user.full_name,
            email: user.email,
            role: user.role_name, // string role
          },
        };
      } catch (err) {
        console.error("Login error:", err);
        set.status = 500;
        return { success: false, message: "Server error" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );
