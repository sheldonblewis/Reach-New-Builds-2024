import { useState } from "react";

import { NODE_API_URL } from "@/config/node";

type PlayMusicResult = {
	play: (uri: string) => Promise<void>;
	loading: boolean;
	error: Error | null;
};

export const usePlayMusic = (): PlayMusicResult => {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);
	const tempUserId = `2227guclfee2zwqw4fey4nf6q`;
	const play = async (uri: string) => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${NODE_API_URL}/spotify/play`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-User-ID": tempUserId,
				},
				body: JSON.stringify({ uri }),
			});

			if (!response.ok) {
				throw new Error("Failed to play track: " + (await response.text()));
			}

			// Optionally handle successful play
		} catch (err) {
			setError(
				err instanceof Error ? err : new Error("An unknown error occurred"),
			);
		} finally {
			setLoading(false);
		}
	};

	return { play, loading, error };
};
