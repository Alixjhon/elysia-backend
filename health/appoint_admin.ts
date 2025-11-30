import { Elysia } from "elysia";
import client from "../db";

export const appointmentAdminRoutes = (app: Elysia) =>
  app.group("/admin/appointments", (app) =>

    // 1️⃣ Get all pending appointments
    app.get("/pending", async ({ set }) => {
      try {
        const res = await client.query(
          `SELECT a.appointment_id, a.date, a.time, a.notes, a.status,
                  u.full_name AS resident_name,
                  t.name AS service_type
           FROM appointments a
           JOIN users u ON a.user_id = u.user_id
           JOIN appointment_types t ON a.appointment_type_id = t.appointment_type_id
           WHERE a.status = 'pending' AND a.approved_by IS NULL
           ORDER BY a.date ASC, a.time ASC`
        );
        return { success: true, data: res.rows };
      } catch (err) {
        set.status = 500;
        return { success: false, error: (err as Error).message };
      }
    })

    // 2️⃣ Approve appointment
    .patch("/approve/:appointment_id", async ({ params, body, set }) => {
      try {
        const { staff_id } = body as { staff_id: number };
        if (!staff_id) {
          set.status = 400;
          return { success: false, error: "staff_id is required" };
        }

        const res = await client.query(
          `UPDATE appointments
           SET status = 'approved', approved_by = $1
           WHERE appointment_id = $2 AND status = 'pending'
           RETURNING appointment_id, status, approved_by`,
          [staff_id, params.appointment_id]
        );

        if (res.rowCount === 0) {
          set.status = 404;
          return { success: false, error: "Appointment not found or not pending" };
        }

        // Log action
        await client.query(
          `INSERT INTO system_logs (user_id, action, module, details, timestamp)
           VALUES ($1, 'Approved appointment', 'Appointment', $2, NOW())`,
          [staff_id, `Approved appointment_id=${params.appointment_id}`]
        );

        return { success: true, message: "Appointment approved", data: res.rows[0] };
      } catch (err) {
        set.status = 500;
        return { success: false, error: (err as Error).message };
      }
    })

    // 3️⃣ Reject appointment
    .patch("/reject/:appointment_id", async ({ params, body, set }) => {
  try {
    const { staff_id, reason } = body as { staff_id: number; reason: string };

    if (!staff_id || !reason) {
      set.status = 400;
      return { success: false, error: "staff_id and reason are required" };
    }

    const res = await client.query(
      `UPDATE appointments
       SET status = 'rejected',
           approved_by = $1,
           reason = $2
       WHERE appointment_id = $3 AND status = 'pending'
       RETURNING appointment_id, status, approved_by, reason`,
      [staff_id, reason, params.appointment_id]
    );

    if (res.rowCount === 0) {
      set.status = 404;
      return { success: false, error: "Appointment not found or not pending" };
    }

    // Log action
    await client.query(
      `INSERT INTO system_logs (user_id, action, module, details, timestamp)
       VALUES ($1, 'Rejected appointment', 'Appointment', $2, NOW())`,
      [staff_id, `Rejected appointment_id=${params.appointment_id}, Reason=${reason}`]
    );

    return { success: true, message: "Appointment rejected", data: res.rows[0] };
  } catch (err) {
    set.status = 500;
    return { success: false, error: (err as Error).message };
  }
})
  );
