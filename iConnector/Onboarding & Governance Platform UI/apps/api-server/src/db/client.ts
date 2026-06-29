import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER || "ds_onboarding_user";
  const password = process.env.POSTGRES_PASSWORD || "ds_onboarding_pswd";
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";
  const database = process.env.POSTGRES_DB || "ds_onboarding";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export const pool = new Pool({
  connectionString: buildDatabaseUrl(),
  max: 10,
});

export const db = drizzle({
  client: pool,
  schema,
});

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
