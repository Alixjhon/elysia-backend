import { Elysia } from "elysia";
import client from "../db";

export const inventoryRoutes = (app: Elysia) =>
  app.group("/inventory", (app) =>
    app

      // 1️⃣ Get all inventory items
      .get("/", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            ORDER BY i.item_name ASC
          `);
          return { success: true, count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 2️⃣ Get all Medicine items
      .get("/medicine", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            WHERE LOWER(i.category) = 'medicine'
            ORDER BY i.item_name ASC
          `);
          return { success: true, category: "Medicine", count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 3️⃣ Get all Medical Supply items
      .get("/medical_supply", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            WHERE LOWER(i.category) = 'medical supply'
            ORDER BY i.item_name ASC
          `);
          return { success: true, category: "Medical Supply", count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 4️⃣ Get all Equipment items
      .get("/equipment", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            WHERE LOWER(i.category) = 'equipment'
            ORDER BY i.item_name ASC
          `);
          return { success: true, category: "Equipment", count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 5️⃣ Get all PPE items
      .get("/ppe", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            WHERE LOWER(i.category) = 'ppe'
            ORDER BY i.item_name ASC
          `);
          return { success: true, category: "PPE", count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 6️⃣ Get all Office Supply items
      .get("/office_supply", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            WHERE LOWER(i.category) = 'office supply'
            ORDER BY i.item_name ASC
          `);
          return { success: true, category: "Office Supply", count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 7️⃣ Get all Cleaning Material items
      .get("/cleaning_material", async ({ set }) => {
        try {
          const res = await client.query(`
            SELECT 
              i.*,
              s.supplier_name,
              s.contact_person,
              s.contact_number,
              s.address AS supplier_address,
              s.email AS supplier_email
            FROM inventory_items i
            LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
            WHERE LOWER(i.category) = 'cleaning material'
            ORDER BY i.item_name ASC
          `);
          return { success: true, category: "Cleaning Material", count: res.rows.length, data: res.rows };
        } catch (err) {
          set.status = 500;
          return { success: false, error: (err as Error).message };
        }
      })

      // 8️⃣ Record Inventory Transaction with auto-delete if quantity hits 0
      .post("/record", async ({ body, set }) => {
        const typedBody = body as {
          item_id: number;
          quantity: number;
          remarks?: string;
          handled_by: number;
          transaction_type: "Received" | "Used" | "Disposed" | "Returned" | "Adjusted";
        };

        const { item_id, quantity, remarks, handled_by, transaction_type } = typedBody;

        if (!item_id || !quantity || !handled_by || !transaction_type) {
          set.status = 400;
          return { success: false, error: "Missing required fields." };
        }

        if (quantity <= 0) {
          set.status = 400;
          return { success: false, error: "Quantity must be greater than zero." };
        }

        try {
          await client.query("BEGIN");

          const res = await client.query(
            "SELECT quantity FROM inventory_items WHERE item_id = $1 FOR UPDATE",
            [item_id]
          );

          if (res.rowCount === 0) {
            await client.query("ROLLBACK");
            set.status = 404;
            return { success: false, error: "Item not found." };
          }

          const currentQty = res.rows[0].quantity;
          let newQty = currentQty;

          if (transaction_type === "Received" || transaction_type === "Returned") {
            newQty = currentQty + quantity;
          } else {
            newQty = currentQty - quantity;
            if (newQty < 0) {
              await client.query("ROLLBACK");
              set.status = 400;
              return {
                success: false,
                error: "Cannot subtract quantity below 0.",
              };
            }
          }

          if (newQty === 0) {
            // Delete the item if quantity reaches zero
            await client.query("DELETE FROM inventory_items WHERE item_id = $1", [item_id]);
          } else {
            // Otherwise, update quantity
            await client.query(
              "UPDATE inventory_items SET quantity = $1 WHERE item_id = $2",
              [newQty, item_id]
            );
          }

          await client.query(
            `INSERT INTO inventory_transactions 
              (item_id, transaction_type, quantity, remarks, handled_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [item_id, transaction_type, quantity, remarks || null, handled_by]
          );

          await client.query("COMMIT");

          return {
            success: true,
            message: newQty === 0 ? "Item quantity reached zero and was deleted." : "Transaction recorded successfully.",
            transaction_type,
            new_quantity: newQty,
          };
        } catch (err: any) {
          await client.query("ROLLBACK");
          set.status = 500;
          console.error("❌ Transaction Error:", err);
          return {
            success: false,
            error: err.message || "Transaction failed.",
          };
        }
      })
  );
