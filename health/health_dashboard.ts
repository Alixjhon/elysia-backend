import { Elysia } from "elysia";
import client from "../db";

export const healthDashboardRoutes = (app: Elysia) =>
  app.group("/health", (app) =>
    app
      // 1. Total Registered Patients
      .get("/patients", async ({ set }) => {
        try {
          const res = await client.query("SELECT COUNT(*) AS total_patients FROM users");
          return { success: true, data: res.rows[0] };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 2. Active Cases
      .get("/active_cases", async ({ set }) => {
        try {
          const res = await client.query(
            `SELECT COUNT(*) AS active_cases 
             FROM health_records 
             WHERE record_type = 'checkup' AND status = 'active'`
          );
          return { success: true, data: res.rows[0] };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 3. Recovered Cases
      .get("/recovered", async ({ set }) => {
        try {
          const res = await client.query(
            `SELECT COUNT(*) AS recovered_cases 
             FROM health_records 
             WHERE status = 'recovered'`
          );
          return { success: true, data: res.rows[0] };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 4. Maternal & Child Health
      .get("/maternal_child", async ({ set }) => {
        try {
          const res = await client.query(
            `SELECT COUNT(*) AS maternal_child_cases 
             FROM health_records 
             WHERE category IN ('maternal', 'child')`
          );
          return { success: true, data: res.rows[0] };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 5. Disease Statistics (PieChart)
      .get("/disease_stats", async ({ set }) => {
        try {
          const res = await client.query(
            `SELECT disease_name, COUNT(*) 
             FROM health_records 
             GROUP BY disease_name`
          );
          return { success: true, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 6. Vaccination Coverage (BarChart)
      .get("/vaccination_coverage", async ({ set }) => {
        try {
          const res = await client.query(
            `SELECT details AS vaccine_name, COUNT(*) AS total 
             FROM health_records 
             WHERE record_type = 'vaccination'
             GROUP BY details`
          );
          return { success: true, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 7. Mortality & Birth Rates (LineChart)
      .get("/mortality_birth", async ({ set }) => {
        try {
          const res = await client.query(
            `SELECT EXTRACT(YEAR FROM recorded_at) AS year,
                    SUM(CASE WHEN details ILIKE '%death%' THEN 1 ELSE 0 END) AS deaths,
                    SUM(CASE WHEN details ILIKE '%birth%' THEN 1 ELSE 0 END) AS births
             FROM health_records
             GROUP BY year
             ORDER BY year ASC`
          );
          return { success: true, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })
  );
