import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing!");
  process.exit(1);
}

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  keepAlive: true,              // Prevent unexpected termination
});

// DO NOT call client.connect() when using Pool
console.log("🟢 PostgreSQL pool initialized (Neon)");

export default client;
