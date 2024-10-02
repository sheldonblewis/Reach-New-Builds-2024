import { eq, sql } from "drizzle-orm";
import { artistGenre, artists, genres, getDB, users } from "../db";
import { Hono } from "hono";
import { Context } from "../types";
import { generateCodeChallenge, generateCodeVerifier } from "./module";
import { getCookie, setCookie } from "hono/cookie";

const SPOTIFY_CLIENT_ID = "3b8ac2440a374826ab47cf78efca2b45";
const BASE_URL = "http://localhost:8787";
const FE_BASE_URL = "http://localhost:3002";

const app = new Hono<Context>();

app.get("/auth", async (c) => {
  const clientId = SPOTIFY_CLIENT_ID;
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${BASE_URL}/spotify/callback`,
    scope:
      "user-read-private user-read-email user-read-playback-state user-modify-playback-state",
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  c.header("Set-Cookie", `verifier=${verifier}; HttpOnly; Secure; Path=/`, {
    append: true,
  });
  return c.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
});

app.get("/callback", async (c) => {
  const { code } = c.req.query();
  const verifier = getCookie(c, "verifier");

  if (!code || !verifier) {
    return c.text("Invalid request", 400);
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: `${BASE_URL}/spotify/callback`,
    code_verifier: verifier,
  });

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  // console.log(await tokenResponse.json());

  const { access_token, refresh_token } = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
  };

  if (!access_token) {
    return c.text("Failed to obtain access token", 400);
  }

  const profileResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = (await profileResponse.json()) as {
    id: string;
    display_name: string;
    email: string;
  };

  // Update or insert user in the database
  const existingUser = await getDB(c)
    .select()
    .from(users)
    .where(eq(users.id, profile.id))
    .get();

  if (existingUser) {
    await getDB(c)
      .update(users)
      .set({ accessToken: access_token, refreshToken: refresh_token })
      .where(eq(users.id, profile.id))
      .execute();
  } else {
    await getDB(c)
      .insert(users)
      .values({
        id: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        accessToken: access_token,
        refreshToken: refresh_token,
      })
      .execute();
  }

  // Clear the verifier cookie
  setCookie(c, "verifier", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
  });

  // set the user id for the FE
  // setCookie(c, "userId", profile.id, {
  //   path: "/",
  //   maxAge: 3600,
  //   httpOnly: true,
  //   sameSite: "Lax",
  //   domain: "localhost",
  // });

  // Redirect to the frontend with the access token
  return c.redirect(`${FE_BASE_URL}?user_id=${profile.id}`);
  // .headers.append(
  //   "Set-Cookie",
  //   `userId=${profile.id}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax; Domain=localhost`
  // );
});

// Profile endpoint
app.get("/profile", async (c) => {
  const userId = c.req.header("X-User-ID");
  if (!userId) return c.json({ error: "User ID not provided" }, 400);

  const user = await getDB(c)
    .select()
    .from(users)
    .where(sql`${users.id} = ${userId}`)
    .get();
  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({
    display_name: user.displayName,
    email: user.email,
    id: user.id,
  });
});

// Search tracks endpoint
app.get("/search", async (c) => {
  const userId = c.req.header("X-User-ID");
  const { q } = c.req.query();
  if (!userId || !q) return c.json({ error: "Invalid request" }, 400);

  const user = await getDB(c)
    .select()
    .from(users)
    .where(sql`${users.id} = ${userId}`)
    .get();
  if (!user) return c.json({ error: "User not found" }, 404);

  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      q
    )}&type=track&limit=50`,
    {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    }
  );

  const searchData = (await searchResponse.json()) as {
    tracks: { items: any[] };
  };
  return c.json(searchData.tracks.items);
});

app.get("/search-artist", async (c) => {
  const userId = c.req.header("X-User-ID");
  const { q } = c.req.query();
  if (!userId || !q) return c.json({ error: "Invalid request" }, 400);

  const user = await getDB(c)
    .select()
    .from(users)
    .where(sql`${users.id} = ${userId}`)
    .get();
  if (!user) return c.json({ error: "User not found" }, 404);

  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      q
    )}&type=artist&limit=1`,
    {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    }
  );

  const searchData = (await searchResponse.json()) as {
    artists: { items: any[] };
  };

  if (searchData.artists.items.length === 0) {
    return c.json({ error: "No artist found" }, 404);
  }

  const artist = searchData.artists.items[0];
  return c.json({
    id: artist.id,
    genres: artist.genres,
  });
});

app.get("/search2", async (c) => {
  const userId = c.req.header("X-User-ID");
  const { q } = c.req.query();

  if (!userId || !q) return c.json({ error: "Invalid request" }, 400);

  const user = await getDB(c)
    .select()
    .from(users)
    .where(sql`${users.id} = ${userId}`)
    .get();
  if (!user) return c.json({ error: "User not found" }, 404);

  try {
    console.log("Searching for:", q);
    const artists = q.split(" OR ");
    const results = [];

    for (const artist of artists) {
      const encodedQuery = encodeURIComponent(artist.trim());
      const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist&limit=1`;
      console.log("URL:", url);
      const searchResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      if (!searchResponse.ok) {
        const errorData = (await searchResponse.json()) as {
          error: { message: string };
        };
        console.error("Spotify API error for artist:", artist, errorData);
        continue; // Skip this artist and continue with the next one
      }

      const searchData = (await searchResponse.json()) as {
        artists: { items: any[] };
      };
      if (searchData.artists.items.length > 0) {
        results.push(searchData.artists.items[0]);
      }
    }

    console.log("Search results:", results);
    return c.json({ artists: { items: results } });
  } catch (error) {
    console.error("Error in /search2:", error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Play track endpoint
app.post("/play", async (c) => {
  const userId = c.req.header("X-User-ID");
  const { uri } = await c.req.json();
  if (!userId || !uri) return c.json({ error: "Invalid request" }, 400);

  const user = await getDB(c)
    .select()
    .from(users)
    .where(sql`${users.id} = ${userId}`)
    .get();
  if (!user) return c.json({ error: "User not found" }, 404);

  const playResponse = await fetch(
    "https://api.spotify.com/v1/me/player/play",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [uri] }),
    }
  );

  if (!playResponse.ok) {
    const errorData = (await playResponse.json()) as {
      error: { message: string };
    };
    return c.json({ error: errorData.error.message });
  }

  return c.json({ success: true });
});



app.post("/next-track", async (c) => {
  const userId = c.req.header("X-User-ID");
  const { category } = await c.req.json();
  if (!userId || !category) return c.json({ error: "Invalid request" }, 400);

  const db = getDB(c);

  // Get user
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ error: "User not found" }, 404);

  try {
    // Get random artist from the category
    const randomArtist = await db
      .select({
        id: artists.id,
        spotifyId: artists.spotifyId,
      })
      .from(artists)
      .innerJoin(artistGenre, eq(artists.id, artistGenre.artistId))
      .innerJoin(genres, eq(genres.id, artistGenre.categoryGenreId))
      .where(eq(genres.name, category))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get();

    if (!randomArtist || !randomArtist.spotifyId) {
      return c.json({ error: "No artist found for the given category" }, 404);
    }

    // Get top tracks for the random artist
    const topTracksResponse = await fetch(
      `https://api.spotify.com/v1/artists/${randomArtist.spotifyId}/top-tracks?market=US`,
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );

    if (!topTracksResponse.ok) {
      const errorData = await topTracksResponse.json();
      console.error("Spotify API error:", errorData);
      return c.json({ error: "Failed to fetch top tracks" }, 500);
    }

    const topTracksData = (await topTracksResponse.json()) as {
      tracks: any[];
    };
    const tracks = topTracksData.tracks;

    if (tracks.length === 0) {
      return c.json({ error: "No tracks found for the artist" }, 404);
    }

    // Select a random track from the top tracks
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    return c.json({
      track: {
        id: randomTrack.id,
        name: randomTrack.name,
        uri: randomTrack.uri,
        artist: randomTrack.artists[0].name,
        album: randomTrack.album.name,
        image: randomTrack.album.images[0]?.url,
      },
    });
  } catch (error) {
    console.error("Error in /next-track:", error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

app.get("/next-artist", async (c) => {
  const { category } = c.req.query();
  if (!category) return c.json({ error: "Category not provided" }, 400);

  const db = getDB(c);

  try {
    // Get random artist from the category
    const randomArtist = await db
      .select({
        id: artists.id,
        name: artists.title,
        spotifyId: artists.spotifyId,
      })
      .from(artists)
      .innerJoin(artistGenre, eq(artists.id, artistGenre.artistId))
      .innerJoin(genres, eq(genres.id, artistGenre.categoryGenreId))
      .where(eq(genres.name, category))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get();

    if (!randomArtist) {
      return c.json({ error: "No artist found for the given category" }, 404);
    }

    return c.json({
      artist: {
        id: randomArtist.id,
        name: randomArtist.name,
        spotifyId: randomArtist.spotifyId,
      },
    });
  } catch (error) {
    console.error("Error in /next-artist:", error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

export default app;
