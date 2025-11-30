import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing!");
  process.exit(1);
}

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon
  },
});

client.connect()
  .then(() => console.log("✅ Connected to Postgres!"))
  .catch((err) => {
    console.error("❌ Failed to connect to Postgres:", err);
    process.exit(1);
  });

export default client;
