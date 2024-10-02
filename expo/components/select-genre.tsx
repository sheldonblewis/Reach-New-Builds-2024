import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { useGenreCategories } from "@/hooks/use-genre-categories";

export const SelectGenre = ({
	genre,
	setGenre,
}: {
	genre: string;
	setGenre: (genre: string) => void;
}) => {
	const { data: categories, loading, error } = useGenreCategories();
	const insets = useSafeAreaInsets();
	const contentInsets = {
		top: insets.top,
		bottom: insets.bottom,
		left: 12,
		right: 12,
	};

	if (loading) {
		return <Text>Loading categories...</Text>;
	}

	if (error) {
		return <Text>Error: {error.message}</Text>;
	}

	return (
		<Select
			defaultValue={{ value: "Electronic", label: "Electronic" }}
			value={{ value: genre, label: genre }}
			onValueChange={(value) => setGenre(value?.label ?? "")}
		>
			<SelectTrigger className="w-[250px]">
				<SelectValue
					className="text-foreground text-sm native:text-lg"
					placeholder="Select a fruit"
				/>
			</SelectTrigger>
			<SelectContent insets={contentInsets} className="w-[250px]">
				<SelectGroup>
					<SelectLabel>Genre</SelectLabel>
					{categories?.map((category) => (
						<SelectItem
							key={category.id}
							label={category.name}
							value={category.name}
						>
							{category.name}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};
