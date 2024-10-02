import { Context as HonoContext } from "hono";
import { Context } from "../types";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const getDB = (context: HonoContext<Context>) => {
  const client = createClient({
    url: "file:./db.sqlite",
  });
  return drizzle(client, { schema });
};
