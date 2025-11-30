import { Elysia, t } from "elysia";
import client from "../db"; // PostgreSQL client

export const requestDocumentRoutes = new Elysia({ prefix: "/documents" })

  // ================================
  //  GET DOCUMENT TYPES
  // ================================
  .get("/types", async () => {
    try {
      const result = await client.query(`
        SELECT doc_type_id, name, description 
        FROM document_types
        ORDER BY name ASC
      `);

      return result.rows;
    } catch (err) {
      console.error("❌ Error fetching document types:", err);
      return { error: "Failed to fetch document types" };
    }
  })
  
  // ================================
  //  SUBMIT DOCUMENT REQUEST
  // ================================
  .post(
    "/request",
    async ({ body }) => {
      try {
        // Extract all fields sent from Android App
        const {
          user_id, doc_type_id, purpose, full_name, address,
          date_of_birth, age, sex, civil_status, citizenship,
          valid_id, contact_number, email, years_of_residency,
          criminal_record_status, business_name, business_type,
          business_address, dti_sec_reg_no, business_tin,
          start_of_operation, length_of_stay, house_ownership,
          date_of_arrival, family_income, employment_status,
          reason_for_request, dependents, photo_url, signature_url,
          blood_type, emergency_contact_name, emergency_contact_relation,
          emergency_contact_number, remarks
        } = body;

        // INSERT INTO PostgreSQL
        const result = await client.query(
          `
          INSERT INTO document_requests (
            user_id, doc_type_id, purpose,
            full_name, address, date_of_birth, age, sex, civil_status,
            citizenship, valid_id, contact_number, email,
            years_of_residency, criminal_record_status,
            business_name, business_type, business_address,
            dti_sec_reg_no, business_tin, start_of_operation,
            length_of_stay, house_ownership, date_of_arrival,
            family_income, employment_status, reason_for_request,
            dependents, photo_url, signature_url, blood_type,
            emergency_contact_name, emergency_contact_relation,
            emergency_contact_number, remarks
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23,
            $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35
          )
          RETURNING request_id
        `,
          [
            user_id, doc_type_id, purpose,
            full_name, address, date_of_birth || null, age || null,
            sex || null, civil_status || null, citizenship || null,
            valid_id || null, contact_number || null, email || null,
            years_of_residency || null, criminal_record_status || null,
            business_name || null, business_type || null, business_address || null,
            dti_sec_reg_no || null, business_tin || null, start_of_operation || null,
            length_of_stay || null, house_ownership || null, date_of_arrival || null,
            family_income || null, employment_status || null, reason_for_request || null,
            dependents || null, photo_url || null, signature_url || null,
            blood_type || null, emergency_contact_name || null,
            emergency_contact_relation || null, emergency_contact_number || null,
            remarks || null
          ]
        );

        return {
          success: true,
          message: "Document request submitted successfully",
          request_id: result.rows[0].request_id
        };
      } catch (err) {
        console.error("❌ Error submitting request:", err);
        return { error: "Failed to submit document request" };
      }
    },
    {
      body: t.Object({
        user_id: t.Number(),
        doc_type_id: t.Number(),
        purpose: t.String(),
        full_name: t.String(),
        address: t.String(),

        // Optional fields
        date_of_birth: t.Optional(t.String()),
        age: t.Optional(t.Number()),
        sex: t.Optional(t.String()),
        civil_status: t.Optional(t.String()),
        citizenship: t.Optional(t.String()),
        valid_id: t.Optional(t.String()),
        contact_number: t.Optional(t.String()),
        email: t.Optional(t.String()),
        years_of_residency: t.Optional(t.Number()),
        criminal_record_status: t.Optional(t.String()),
        business_name: t.Optional(t.String()),
        business_type: t.Optional(t.String()),
        business_address: t.Optional(t.String()),
        dti_sec_reg_no: t.Optional(t.String()),
        business_tin: t.Optional(t.String()),
        start_of_operation: t.Optional(t.String()),
        length_of_stay: t.Optional(t.String()),
        house_ownership: t.Optional(t.String()),
        date_of_arrival: t.Optional(t.String()),
        family_income: t.Optional(t.Number()),
        employment_status: t.Optional(t.String()),
        reason_for_request: t.Optional(t.String()),
        dependents: t.Optional(t.Number()),
        photo_url: t.Optional(t.String()),
        signature_url: t.Optional(t.String()),
        blood_type: t.Optional(t.String()),
        emergency_contact_name: t.Optional(t.String()),
        emergency_contact_relation: t.Optional(t.String()),
        emergency_contact_number: t.Optional(t.String()),
        remarks: t.Optional(t.String())
      })
    }

  );
