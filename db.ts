import "dotenv/config"; // Must be first
import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  },
});

await client.connect();
console.log("✅ Connected to PostgreSQL successfully!");

export default client;
