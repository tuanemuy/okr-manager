import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const path = process.env.SQLITE_FILEPATH;

if (!path) {
  throw new Error("SQLITE_FILEPATH must be set in the environment variables.");
}

export default defineConfig({
  out: "./src/core/adapters/drizzleSqlite/migrations",
  schema: "./src/core/adapters/drizzleSqlite/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${path}`,
  },
});
