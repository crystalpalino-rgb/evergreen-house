// Subscriber handling for the email signup form.
// These are plain functions callable from the Bun serve.ts middleware,
// NOT from TanStack Start SSR (which has known issues with server functions).

import { sql } from "~/db";

export interface SubscribeResult {
  success: boolean;
  error?: string;
  duplicate?: boolean;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function ensureSubscribersTable() {
  await sql()`
    CREATE TABLE IF NOT EXISTS subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add name column if it doesn't exist (migration for existing tables)
  try {
    await sql()`ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
  } catch {
    // Column already exists, ignore
  }
}

export interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export async function handleGetSubscribers() {
  await ensureSubscribersTable();
  const rows = await sql()`SELECT id, email, name, created_at FROM subscribers ORDER BY created_at DESC`;
  return rows.map(r => ({ ...r, created_at: String(r.created_at) }));
}

export async function handleSubscribe(body: { email: string; name?: string }): Promise<SubscribeResult> {
  const email = (body.email || "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  const name = (body.name || "").trim() || null;

  try {
    await ensureSubscribersTable();

    // Check for duplicate
    const existing = await sql()`SELECT id FROM subscribers WHERE email = ${email}`;
    if (existing.length > 0) {
      return { success: true, duplicate: true };
    }

    await sql()`INSERT INTO subscribers (email, name) VALUES (${email}, ${name})`;
    return { success: true };
  } catch (err: any) {
    // Unique constraint violation — treat as success (already subscribed)
    if (err.code === "23505" || err.message?.includes("duplicate key")) {
      return { success: true, duplicate: true };
    }
    console.error("Failed to store subscriber:", err);
    return { success: false, error: "Something went wrong, please try again" };
  }
}
