import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export * from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function getDatabase(path: string) {
  return drizzle({
    client: createClient({
      url: `file:${path}`,
    }),
    schema,
  });
}

interface DatabaseError {
  code: string;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ("code" in value) {
    return true;
  }

  return false;
}
