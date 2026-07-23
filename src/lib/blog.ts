import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

export interface BlogPost {
  id: number;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async (): Promise<BlogPost[]> => {
  try {
    const rows = await sql()`
      SELECT id, title, content, status, created_at, updated_at
      FROM marketing_tasks
      WHERE channel = 'blog' AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      status: row.status,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  } catch (err) {
    console.error("getBlogPosts error:", err);
    return [];
  }
});

export const getBlogPost = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .handler(async ({ data: id }): Promise<BlogPost | null> => {
    try {
      const rows = await sql()`
        SELECT id, title, content, status, created_at, updated_at
        FROM marketing_tasks
        WHERE id = ${id} AND channel = 'blog' AND status = 'approved'
        LIMIT 1
      `;
      if (rows.length === 0) return null;
      const row = rows[0] as any;
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        status: row.status,
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
      };
    } catch (err) {
      console.error("getBlogPost error:", err);
      return null;
    }
  });
