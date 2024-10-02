import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const task = sqliteTable("task", {
  id: text("id").primaryKey(),
  content: text("text").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false),
});

// New artists table
export const artists = sqliteTable("artists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  location: text("location").notNull(),
  pageid: integer("pageid").notNull(),
  spotifyId: text("spotify_id"),
});

export const genres = sqliteTable("genres", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

// New junction table for the many-to-many relationship
export const artistGenre = sqliteTable("artist_genre", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  artistId: integer("artist_id")
    .notNull()
    .references(() => artists.id),
  genreId: integer("genre_id")
    .notNull()
    .references(() => genres.id),
  categoryGenreId: integer("category_genre_id").references(() => genres.id),
});

// New page table
export const page = sqliteTable("page", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  type: text("type").notNull(),
  artistId: integer("artist_id").references(() => artists.id),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  email: text("email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
});
