import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST ?? "localhost",
      port: Number.parseInt(process.env.PGPORT ?? "5432", 10),
      user: process.env.PGUSER ?? "postgres",
      password: process.env.PGPASSWORD ?? "postgres",
      database: process.env.PGDATABASE ?? "payments",
      max: 10,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
