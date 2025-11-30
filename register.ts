import { Elysia, t } from "elysia";
import client from "./db";

export const registerRoutes = (app: Elysia) =>
  app.post(
    "/register",
    async ({ body, set }) => {
      const { full_name, email, password, contact_number, address, role_id } = body;

      if (!full_name || !email || !password || !role_id) {
        set.status = 400;
        return { success: false, message: "Full name, email, password, and role are required" };
      }

      try {
        // Check if email already exists
        const existingUser = await client.query(
          "SELECT user_id FROM users WHERE email = $1",
          [email]
        );

        if (existingUser.rows.length > 0) {
          set.status = 409;
          return { success: false, message: "Email already registered" };
        }

        // Insert new user
        const result = await client.query(
          `INSERT INTO users (role_id, full_name, email, password, contact_number, address)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING user_id, full_name, email, role_id, status`,
          [role_id, full_name, email, password, contact_number || null, address || null]
        );

        const user = result.rows[0];

        return {
          success: true,
          message: "User registered successfully",
          user: {
            id: user.user_id,
            name: user.full_name,
            email: user.email,
            role_id: user.role_id,
            status: user.status,
          },
        };
      } catch (err) {
        console.error("Registration error:", err);
        set.status = 500;
        return { success: false, message: "Server error" };
      }
    },
    {
      body: t.Object({
        full_name: t.String(),
        email: t.String(),
        password: t.String(),
        contact_number: t.Optional(t.String()),
        address: t.Optional(t.String()),
        role_id: t.Number(),
      }),
    }
  );
