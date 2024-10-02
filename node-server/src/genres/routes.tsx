import { artistGenre, artists, genres, getDB } from "../db";
import { Hono } from "hono";
import { Context } from "../types";
import { eq, like, sql } from "drizzle-orm";

const app = new Hono<Context>();

app.get("/", async (c) => {
  try {
    const allGenres = await getDB(c).select().from(genres);
    return c.json(allGenres);
  } catch (error) {
    console.error("Error fetching genres:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

const CATEGORIES = [
  "Rock",
  "Metal",
  "Electronic",
  "Hip Hop and Rap",
  "Instrumental",
  "Pop",
  "Folk and Singer-Songwriter",
  "Punk",
  "Jazz and Blues",
  "Classical",
  "Country",
  "R&B and Soul",
  "World Music",
  "Experimental",
  "Christian and Gospel",
  "Traditional",
];

app.post("/update-genre-categories", async (c) => {
  try {
    const { limit } = await c.req.json();
    const db = getDB(c);

    // Get artist_genre entries without a category_genre_id
    const entriesToUpdate = await db
      .select({
        id: artistGenre.id,
        genreId: artistGenre.genreId,
      })
      .from(artistGenre)
      .where(sql`${artistGenre.categoryGenreId} IS NULL`)
      .limit(limit)
      .all();

    let updatedCount = 0;

    for (const entry of entriesToUpdate) {
      // Get the genre name for this entry
      const genre = await db
        .select()
        .from(genres)
        .where(eq(genres.id, entry.genreId))
        .get();

      if (!genre) {
        console.log("Genre not found for entry:", entry);
        continue;
      }

      const existingCategoryGenre = await db
        .select({
          categoryGenreId: artistGenre.categoryGenreId,
          genreId: artistGenre.genreId,
        })
        .from(artistGenre)
        .where(eq(artistGenre.id, entry.id))
        .get();

      if (existingCategoryGenre?.categoryGenreId) {
        console.log("Existing category genre ID:", existingCategoryGenre);
        continue;
      }

      // Use Ollama to categorize the genre
      console.log("Categorizing genre:", genre.name);
      const categoryGenre = await categorizeThroughOllama(genre.name);
      console.log("Categorized genre:", categoryGenre);

      if (categoryGenre) {
        // weve generated the category genre, now we need to either find it in the db or create it
        let newCategoryGenre = await db
          .select({ id: genres.id })
          .from(genres)
          .where(like(genres.name, categoryGenre))
          .get();

        if (!newCategoryGenre) {
          newCategoryGenre = await db
            .insert(genres)
            .values({
              name: categoryGenre,
            })
            .returning()
            .get();
          console.log("New category genre created:", newCategoryGenre);
        }

        // Update the entry with the category genre ID
        await db
          .update(artistGenre)
          .set({ categoryGenreId: newCategoryGenre.id })
          .where(sql`${artistGenre.id} = ${entry.id}`)
          .execute();
        updatedCount++;
      }
    }

    return c.json(
      {
        updatedCount,
        message: `Updated ${updatedCount} artist_genre entries with category genre IDs`,
      },
      200
    );
  } catch (error) {
    console.error("Error updating genre categories:", error);
    return c.json({ message: "Failed to update genre categories" }, 500);
  }
});

async function categorizeThroughOllama(
  genreName: string
): Promise<string | null> {
  const prompt = `
      You are a music genre expert. Your task is to categorize the given genre into one of the following categories:
      ${CATEGORIES.join(", ")}
  
      If the genre doesn't fit well into any category, choose the closest match or return "Uncategorized".
      
      Genre to categorize: "${genreName}"
  
      Respond with only the category name, nothing else.
    `;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.1",
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { response: string };
    const category = data.response.trim();

    return CATEGORIES.includes(category) ? category : null;
  } catch (error) {
    console.error("Error calling Ollama:", error);
    return null;
  }
}

// get category genres
app.get("/categories", async (c) => {
  const db = getDB(c);
  const categoryGenres = await db
    .select({
      id: genres.id,
      name: genres.name,
    })
    .from(genres)
    .innerJoin(artistGenre, eq(genres.id, artistGenre.categoryGenreId))
    .groupBy(genres.id)
    .orderBy(genres.name);

  // Further deduplication based on name
  const uniqueGenres = Array.from(
    new Map(categoryGenres.map((genre) => [genre.name, genre])).values()
  );
  return c.json(uniqueGenres);
});

// get artists by category genre
app.post("/categories", async (c) => {
  const { category } = await c.req.json();
  const db = getDB(c);
  const artistsList = await db
    .select({
      id: artists.id,
      title: artists.title,
      location: artists.location,
      pageid: artists.pageid,
      spotifyId: artists.spotifyId,
      genreId: genres.id,
      genreName: genres.name,
      categoryGenreId: artistGenre.categoryGenreId,
      categoryGenreName:
        sql<string>`(SELECT name FROM genres WHERE id = ${artistGenre.categoryGenreId})`.as(
          "category_genre_name"
        ),
    })
    .from(artists)
    .innerJoin(artistGenre, eq(artists.id, artistGenre.artistId))
    .innerJoin(genres, eq(genres.id, artistGenre.genreId))
    .where(
      eq(
        artistGenre.categoryGenreId,
        sql`(SELECT id FROM genres WHERE name = ${category})`
      )
    )
    .orderBy(artists.title);

  const groupedArtists = artistsList.reduce<Record<number, any>>(
    (acc, artist) => {
      if (!acc[artist.id]) {
        acc[artist.id] = {
          id: artist.id,
          title: artist.title,
          location: artist.location,
          pageid: artist.pageid,
          spotifyId: artist.spotifyId,
          genres: [],
        };
      }
      acc[artist.id].genres.push({
        id: artist.genreId,
        name: artist.genreName,
        categoryGenreId: artist.categoryGenreId,
        categoryGenreName: artist.categoryGenreName,
      });
      return acc;
    },
    {}
  );

  const uniqueArtists = Object.values(groupedArtists);

  return c.json(uniqueArtists);
});

export default app;
