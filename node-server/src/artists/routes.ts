import { Hono } from "hono";
import { Context } from "../types";
import { fetchMusicalGroupsFromToronto } from "./fetchers/wikipedia";
import { ArtistModule } from "./modules";
import { getDB, users, artists } from "../db";
import { getPageContent } from "./fetchers/artist-page";
import { NotFoundError } from "../errors";
import { fetchWikipediaContent } from "./fetchers/artist-multi-page";
import { eq, isNull, sql } from "drizzle-orm";

const app = new Hono<Context>();

// Get Toronto artists from the database
app.get("/toronto", async (c) => {
  try {
    const artistModule = ArtistModule(getDB(c));
    const artists = await artistModule.getArtistsWithGenres();
    return c.json(artists, 200);
  } catch (error) {
    console.error("Error fetching Toronto artists:", error);
    return c.json({ message: "Failed to fetch Toronto artists" }, 500);
  }
});

// Update Toronto artists in the database
app.post("/toronto/update", async (c) => {
  try {
    const artistModule = ArtistModule(getDB(c));
    const wikipediaArtists = await fetchMusicalGroupsFromToronto();

    const updatedArtists = [];
    for (const artist of wikipediaArtists) {
      const updatedArtist = await artistModule.createArtist(
        artist.title,
        "Toronto",
        artist.pageid
      );
      updatedArtists.push(updatedArtist);
    }

    return c.json(updatedArtists, 200);
  } catch (error) {
    console.error("Error updating Toronto artists:", error);
    return c.json({ message: "Failed to update Toronto artists" }, 500);
  }
});

// Get artist page content from Wikipedia
app.get("/toronto/:artistID/source/wikipedia", async (c) => {
  try {
    const artistID = Number(c.req.param("artistID"));
    if (isNaN(artistID) || !Number.isInteger(artistID) || artistID <= 0) {
      return c.json(
        { message: "Invalid artist ID. Must be a positive integer." },
        400
      );
    }

    const artistModule = ArtistModule(getDB(c));
    const artist = await artistModule.getArtistById(artistID);

    if (!artist) {
      return c.json({ message: "Artist not found" }, 404);
    }

    const content = await getPageContent(artist.pageid);
    return c.json({ content }, 200);
  } catch (error) {
    console.error("Error fetching artist page content:", error);
    if (error instanceof NotFoundError) {
      return c.json({ message: "Artist not found" }, 404);
    }
    if (error instanceof Error && error.message.startsWith("API error:")) {
      return c.json({ message: error.message }, 400);
    }
    return c.json({ message: "Failed to fetch artist page content" }, 500);
  }
});

// Update artist pages in the database
app.post("/toronto/update-pages", async (c) => {
  try {
    const artistModule = ArtistModule(getDB(c));
    const hardcodedArtistIds = [1, 2, 3];

    const artists = await Promise.all(
      hardcodedArtistIds.map((id) => artistModule.getArtistById(id))
    );

    const validArtists = artists.filter((artist) => artist !== null);
    const pageIds = validArtists.map((artist) => artist!.pageid);

    await fetchWikipediaContent(pageIds, async (content) => {
      const artist = validArtists.find((a) => a!.pageid === content.pageId);
      if (artist) {
        await artistModule.createPage(content.content, "wikipedia", artist.id);
      }
    });

    return c.json({ message: "Artist pages updated successfully" }, 200);
  } catch (error) {
    console.error("Error updating artist pages:", error);
    return c.json({ message: "Failed to update artist pages" }, 500);
  }
});

// Update artists with Spotify info
app.post("/update-spotify-info", async (c) => {
  const userId = c.req.header("X-User-ID");
  if (!userId) return c.json({ message: "User ID not provided" }, 400);

  try {
    const { limit } = await c.req.json();
    const db = getDB(c);

    // Get user from the database
    const user = await db
      .select()
      .from(users)
      .where(sql`${users.id} = ${userId}`)
      .get();
    if (!user) return c.json({ message: "User not found" }, 404);

    // Get artists without Spotify ID
    const artistsToUpdate = await db
      .select()
      .from(artists)
      .where(isNull(artists.spotifyId))
      .limit(limit)
      .all();

    let updatedCount = 0;

    for (const artist of artistsToUpdate) {
      // Search for artist on Spotify
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          artist.title
        )}&type=artist&limit=1`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      );

      if (!searchResponse.ok) {
        console.error(`Failed to search for artist ${artist.title}`);
        continue;
      }

      const searchData = (await searchResponse.json()) as {
        artists: {
          items: {
            id: string;
            genres: string[];
          }[];
        };
      };
      const spotifyArtist = searchData.artists.items[0];

      if (spotifyArtist) {
        // Update artist with Spotify ID and genres
        await db
          .update(artists)
          .set({
            spotifyId: spotifyArtist.id,
          })
          .where(eq(artists.id, artist.id))
          .execute();

        const am = ArtistModule(getDB(c));
        const genres = spotifyArtist.genres;
        console.log(spotifyArtist);
        for (const genre of genres) {
          console.log(`Adding genre ${genre} to artist ${artist.id}`);
          await am.addGenreToArtist(artist.id, genre);
        }

        updatedCount++;
      }
    }

    return c.json(
      {
        updatedCount,
        message: `Updated ${updatedCount} artists with Spotify information`,
      },
      200
    );
  } catch (error) {
    console.error("Error updating artists with Spotify information:", error);
    return c.json(
      { message: "Failed to update artists with Spotify information" },
      500
    );
  }
});

export default app;
