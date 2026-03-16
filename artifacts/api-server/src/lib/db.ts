import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db/schema";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_URL_FILE = join(__dirname, "../../db.url");

function getDbUrl(): string {
  if (existsSync(DB_URL_FILE)) {
    const url = readFileSync(DB_URL_FILE, "utf-8").trim();
    if (url) {
      console.log("Using database URL from db.url file");
      return url;
    }
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Please provision a PostgreSQL database.");
  }
  return process.env.DATABASE_URL;
}

const pool = new Pool({
  connectionString: getDbUrl(),
  max: 10,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected pg pool client error (will reconnect):", err.message);
});

pool.on("connect", () => {
  console.log("New DB connection established");
});

export const db = drizzle(pool, { schema });

export { schema };
