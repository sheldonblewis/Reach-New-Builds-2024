import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DrizzleDB = DrizzleD1Database<typeof schema>;
