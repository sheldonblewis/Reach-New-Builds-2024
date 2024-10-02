import { and, eq, sql } from "drizzle-orm";
import { artistGenre, artists, genres, page } from "../db/schema";
import { DrizzleDB } from "../db/types";

export const ArtistModule = (db: DrizzleDB) => {
  return {
    createArtist: async (title: string, location: string, pageid: number) => {
      return await db
        .insert(artists)
        .values({
          title,
          location,
          pageid,
        })
        .returning()
        .get();
    },
    getArtists: async () => {
      return await db.select().from(artists);
    },
    getArtistsWithGenres: async () => {
      const result = await db
        .select({
          id: artists.id,
          name: artists.title,
          genreId: genres.id,
          genreName: genres.name,
          categoryGenreId: artistGenre.categoryGenreId,
          categoryGenreName:
            sql<string>`(SELECT name FROM genres WHERE id = ${artistGenre.categoryGenreId})`.as(
              "category_genre_name"
            ),
        })
        .from(artists)
        .leftJoin(artistGenre, eq(artists.id, artistGenre.artistId))
        .leftJoin(genres, eq(artistGenre.genreId, genres.id))
        .all();

      // Group the results by artist
      const groupedResult = result.reduce<
        Record<
          number,
          {
            id: number;
            name: string;
            genres: Array<{ name: string; category: string | null }>;
          }
        >
      >((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = { id: row.id, name: row.name, genres: [] };
        }
        if (row.genreId && row.genreName) {
          acc[row.id].genres.push({
            name: row.genreName,
            category: row.categoryGenreName || null,
          });
        }
        return acc;
      }, {});

      // Convert the grouped result to an array
      return Object.values(groupedResult);
    },
    updateArtist: async (
      id: number,
      title: string,
      spotifyId: string,
      location: string,
      pageid: number
    ) => {
      return await db
        .update(artists)
        .set({ title, spotifyId, location, pageid })
        .where(eq(artists.id, id))
        .returning()
        .get();
    },
    deleteArtist: async (id: number) => {
      return await db.delete(artists).where(eq(artists.id, id)).get();
    },
    getArtistById: async (id: number) => {
      return await db.select().from(artists).where(eq(artists.id, id)).get();
    },
    createPage: async (content: string, type: string, artistId: number) => {
      return await db
        .insert(page)
        .values({
          content,
          type,
          artistId,
        })
        .returning()
        .get();
    },
    getPagesByArtistId: async (artistId: number) => {
      return await db.select().from(page).where(eq(page.artistId, artistId));
    },
    addGenreToArtist: async (artistId: number, genreName: string) => {
      // First, try to find the genre
      let genreResult = await db
        .select()
        .from(genres)
        .where(eq(genres.name, genreName))
        .get();

      // If the genre doesn't exist, create it
      if (!genreResult) {
        console.log(`Creating genre ${genreName}`);
        genreResult = await db
          .insert(genres)
          .values({ name: genreName })
          .returning()
          .get();
      }

      console.log(`Genre ${genreName} created with id ${genreResult.id}`);

      // Check if the artist-genre relationship already exists
      const existingRelation = await db
        .select()
        .from(artistGenre)
        .where(
          and(
            eq(artistGenre.artistId, artistId),
            eq(artistGenre.genreId, genreResult.id)
          )
        )
        .get();

      // If the relationship doesn't exist, create it
      if (!existingRelation) {
        console.log(
          `Creating artist-genre relationship for artist ${artistId} and genre ${genreResult.id}`
        );
        await db
          .insert(artistGenre)
          .values({
            artistId: artistId,
            genreId: genreResult.id,
          })
          .execute();
      }

      console.log(
        `Artist-genre relationship created for artist ${artistId} and genre ${genreResult.id}`
      );

      // Return the updated artist with all its genres
      return await db
        .select({
          id: artists.id,
          name: artists.title,
          genres: sql`json_group_array(json_object('id', ${genres.id}, 'name', ${genres.name}))`,
        })
        .from(artists)
        .leftJoin(artistGenre, eq(artists.id, artistGenre.artistId))
        .leftJoin(genres, eq(artistGenre.genreId, genres.id))
        .where(eq(artists.id, artistId))
        .groupBy(artists.id)
        .execute();
    },
    getAllGenres: async () => {
      return await db.select().from(genres);
    },
    createGenre: async (name: string) => {
      return await db.insert(genres).values({ name }).returning().get();
    },
  };
};
