import { useState, useEffect } from "react";

import { NODE_API_URL } from "@/config/node";

type Artist = {
	id: string;
	name: string;
	spotifyId: string;
};

type UseNextArtistResult = {
	artist: Artist | null;
	loading: boolean;
	error: Error | null;
	fetchNextArtist: (category: string) => Promise<void>;
};

export const useNextArtist = (): UseNextArtistResult => {
	const [artist, setArtist] = useState<Artist | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const fetchNextArtist = async (category: string) => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`${NODE_API_URL}/spotify/next-artist?category=${encodeURIComponent(category)}`,
			);

			if (!response.ok) {
				throw new Error(
					"Failed to fetch next artist: " + (await response.text()),
				);
			}

			const result = await response.json();
			setArtist(result.artist);
		} catch (err) {
			setError(
				err instanceof Error ? err : new Error("An unknown error occurred"),
			);
		} finally {
			setLoading(false);
		}
	};

	return { artist, loading, error, fetchNextArtist };
};
