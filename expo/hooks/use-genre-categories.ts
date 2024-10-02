import { useState, useEffect } from "react";

import { NODE_API_URL } from "@/config/node";

type GenreCategory = {
	id: string;
	name: string;
};

type UseGenreCategoriesResult = {
	data: GenreCategory[] | null;
	loading: boolean;
	error: Error | null;
};

export const useGenreCategories = (): UseGenreCategoriesResult => {
	const [data, setData] = useState<GenreCategory[] | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch(`${NODE_API_URL}/genres/categories`);
				if (!response.ok) {
					throw new Error(
						"Failed to fetch genre categories + " + (await response.text()),
					);
				}
				const result = await response.json();
				setData(result);
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error("An unknown error occurred"),
				);
			} finally {
				setLoading(false);
			}
		};

		fetchCategories();
	}, []);

	return { data, loading, error };
};
