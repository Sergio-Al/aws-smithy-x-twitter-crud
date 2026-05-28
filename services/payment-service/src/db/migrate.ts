import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { closePool, getPool } from "./client";

async function run(): Promise<void> {
  const sql = readFileSync(
    join(__dirname, "migrations", "001_init.sql"),
    "utf-8"
  );
  const pool = getPool();
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log("[migrate] applied 001_init.sql");
  await closePool();
}

void run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[migrate] failed:", err);
  process.exit(1);
});
