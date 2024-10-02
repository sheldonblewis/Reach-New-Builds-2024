import { DrizzleDB } from "./db/types";

// not used anymore - for hosting on cloudflare
export type Context = {
  Bindings: {
    DB: DrizzleDB;
  };
  Variables: {
    db: DrizzleDB;
    BASE_URL: string;
    SPOTIFY_CLIENT_ID: string;
    SPOTIFY_CLIENT_SECRET: string;
  };
};
