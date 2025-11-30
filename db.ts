import { Client } from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing!");
  process.exit(1);
}

console.log("📌 Using DATABASE_URL:", process.env.DATABASE_URL);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect()
  .then(() => console.log("✅ Connected to Postgres!"))
  .catch((err) => {
    console.error("❌ Failed to connect to Postgres:");
    console.error(err);
    process.exit(1);
  });

export default client;
