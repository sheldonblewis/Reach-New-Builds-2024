import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: "./db.sqlite",
  },
} satisfies Config;
