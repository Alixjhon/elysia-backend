import { Elysia } from "elysia";
import client from "../db";

export const appointmentRoutes = (app: Elysia) =>
  app.group("/appointments", (app) =>
    
    // 1️⃣ Get all appointment/service types
    app.get("/types", async ({ set }) => {
      try {
        const res = await client.query(
          `SELECT appointment_type_id, name, description 
           FROM appointment_types 
           ORDER BY name`
        );
        return { success: true, data: res.rows };
      } catch (err) {
        set.status = 500;
        return { success: false, error: (err as Error).message };
      }
    })

    // 2️⃣ Get all appointments for a specific resident/user
    .get("/user/:user_id", async ({ params, set }) => {
  try {
    const res = await client.query(
      `SELECT a.appointment_id,
              a.date,
              a.time,
              a.notes,
              a.status,
              a.reason,
              t.name AS service_type
       FROM appointments a
       JOIN appointment_types t ON a.appointment_type_id = t.appointment_type_id
       WHERE a.user_id = $1
       ORDER BY a.date ASC, a.time ASC`,
      [params.user_id]
    );
    return { success: true, data: res.rows };
  } catch (err) {
    set.status = 500;
    return { success: false, error: (err as Error).message };
  }
})


    // 3️⃣ Create a new appointment
    .post("/", async ({ body, set }) => {
      try {
        const { user_id, appointment_type_id, date, time, notes } = body as {
          user_id: number;
          appointment_type_id: number;
          date: string;
          time: string;
          notes?: string;
        };

        if (!user_id || !appointment_type_id || !date || !time) {
          set.status = 400;
          return { success: false, error: "Missing required fields" };
        }

        const res = await client.query(
          `INSERT INTO appointments (user_id, appointment_type_id, date, time, notes, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING appointment_id, status`,
          [user_id, appointment_type_id, date, time, notes || null]
        );

        return { success: true, message: "Appointment scheduled", data: res.rows[0] };
      } catch (err) {
        set.status = 500;
        return { success: false, error: (err as Error).message };
      }
    })

    // 4️⃣ Update appointment status (approve, complete, cancel)
    .patch("/status/:appointment_id", async ({ params, body, set }) => {
      try {
        const { status } = body as { status: string };
        if (!status) {
          set.status = 400;
          return { success: false, error: "Status is required" };
        }

        const res = await client.query(
          `UPDATE appointments
           SET status = $1
           WHERE appointment_id = $2
           RETURNING appointment_id, status`,
          [status, params.appointment_id]
        );

        return { success: true, message: "Appointment status updated", data: res.rows[0] };
      } catch (err) {
        set.status = 500;
        return { success: false, error: (err as Error).message };
      }
    })

  );
