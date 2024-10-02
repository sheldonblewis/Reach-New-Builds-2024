import { Context } from "./types";
import artistsRoutes from "./artists/routes";
import spotifyRoutes from "./spotify/routes";
import genresRoutes from "./genres/routes";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono<Context>();

app.get("/", (c) => c.redirect("/ui"));

app.use(
  cors({
    origin: '*'
  })
);

app.route("/artists", artistsRoutes);
app.route("/spotify", spotifyRoutes);
app.route("/genres", genresRoutes);

const port = 8787;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
