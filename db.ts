import { Client } from "pg";
import "dotenv/config";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();
console.log("✅ Connected to Postgres successfully!");

export default client;
