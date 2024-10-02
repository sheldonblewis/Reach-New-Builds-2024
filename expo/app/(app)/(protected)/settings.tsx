import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";

const interests = [
	"Music",
	"Art",
	"Sports",
	"Technology",
	"Food",
	"Travel",
	"Fashion",
	"Movies",
	"Books",
	"Photography",
	"Fitness",
	"Gaming",
	"Nature",
	"Science",
	"History",
] as const;

const musicGenres = [
	"Pop",
	"Rock",
	"Hip Hop",
	"Jazz",
	"Classical",
	"Electronic",
	"R&B",
	"Country",
	"Indie",
	"Metal",
	"Folk",
	"Blues",
	"Reggae",
	"Latin",
	"K-pop",
] as const;

type Interest = (typeof interests)[number];
type MusicGenre = (typeof musicGenres)[number];

export default function Settings() {
	const { signOut, user } = useSupabase();
	const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
	const [selectedGenres, setSelectedGenres] = useState<MusicGenre[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	useEffect(() => {
		if (user) {
			fetchUserProfile();
		}
	}, [user]);

	const fetchUserProfile = async () => {
		if (!user) return;

		const { data, error } = await supabase
			.from("user_profile")
			.select("interests, music_preferences")
			.eq("user_id", user.id);

		if (error) {
			console.error("Error fetching user profile:", error);
		} else if (data && data.length > 0) {
			setSelectedInterests(
				data[0].interests ? data[0].interests.split(",") : [],
			);
			setSelectedGenres(
				data[0].music_preferences ? data[0].music_preferences.split(",") : [],
			);
		} else {
			// If no data is found, initialize with empty arrays
			setSelectedInterests([]);
			setSelectedGenres([]);
		}
	};

	const updateUserProfile = async (field: string, value: string) => {
		if (!user) return;

		setIsLoading(true);

		// First, try to update the existing profile
		const { data, error } = await supabase
			.from("user_profile")
			.update({ [field]: value })
			.eq("user_id", user.id)
			.select();

		// If no rows were affected (profile doesn't exist), insert a new one
		if (error || (data && data.length === 0)) {
			const { error: insertError } = await supabase
				.from("user_profile")
				.insert({ user_id: user.id, [field]: value });

			if (insertError) {
				console.error(`Error creating ${field}:`, insertError);
				// You might want to set an error state here to display to the user
				// setUpdateError(insertError.message);
			} else {
				console.log(`Successfully created ${field}`);
			}
		} else if (error) {
			console.error(`Error updating ${field}:`, error);
			// You might want to set an error state here to display to the user
			// setUpdateError(error.message);
		} else {
			console.log(`Successfully updated ${field}`);
		}

		setIsLoading(false);
		setIsSubmitted(true);

		// Reset submitted state after 2 seconds
		setTimeout(() => {
			setIsSubmitted(false);
		}, 2000);
	};

	const toggleInterest = (interest: Interest) => {
		setSelectedInterests((prev) =>
			prev.includes(interest)
				? prev.filter((i) => i !== interest)
				: [...prev, interest],
		);
	};

	const toggleGenre = (genre: MusicGenre) => {
		setSelectedGenres((prev) =>
			prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
		);
	};

	const saveInterests = () => {
		updateUserProfile("interests", selectedInterests.join(","));
	};

	const saveGenres = () => {
		updateUserProfile("music_preferences", selectedGenres.join(","));
	};

	return (
		<ScrollView className="flex-1 p-4 pt-20 bg-background">
			<H1 className="text-center mb-6">User Profile</H1>

			<View className="mb-6">
				<H2 className="mb-2">Interests</H2>
				<View className="flex-row flex-wrap">
					{interests.map((interest) => (
						<TouchableOpacity
							key={interest}
							onPress={() => toggleInterest(interest)}
							className="m-1"
						>
							{selectedInterests.includes(interest) ? (
								<LinearGradient
									colors={["rgb(239, 171, 59)", "rgb(255, 225, 170)"]}
									style={{
										borderRadius: 9999,
										padding: 0,
										paddingHorizontal: 6,
									}}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<Text className="text-orange-900 p-2">{interest}</Text>
								</LinearGradient>
							) : (
								<View className="p-2 px-[14px] rounded-full bg-muted">
									<Text className="text-foreground">{interest}</Text>
								</View>
							)}
						</TouchableOpacity>
					))}
				</View>
				<Button
					className="mt-4"
					size="default"
					variant="default"
					onPress={saveInterests}
					disabled={isLoading || isSubmitted}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : isSubmitted ? (
						<Text>Saved!</Text>
					) : (
						<Text>Save Interests</Text>
					)}
				</Button>
			</View>

			<View className="mb-6">
				<H2 className="mb-2">Music Taste</H2>
				<View className="flex-row flex-wrap">
					{musicGenres.map((genre) => (
						<TouchableOpacity
							key={genre}
							onPress={() => toggleGenre(genre)}
							className="m-1"
						>
							{selectedGenres.includes(genre) ? (
								<LinearGradient
									colors={["rgb(239, 171, 59)", "rgb(255, 225, 170)"]}
									style={{
										borderRadius: 9999,
										padding: 0,
										paddingHorizontal: 6,
									}}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
								>
									<Text className="text-orange-900 p-2">{genre}</Text>
								</LinearGradient>
							) : (
								<View className="p-2 px-[14px] rounded-full bg-muted">
									<Text className="text-foreground">{genre}</Text>
								</View>
							)}
						</TouchableOpacity>
					))}
				</View>
				<Button
					className="mt-4"
					size="default"
					variant="default"
					onPress={saveGenres}
					disabled={isLoading || isSubmitted}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : isSubmitted ? (
						<Text>Saved!</Text>
					) : (
						<Text>Save Music Preferences</Text>
					)}
				</Button>
			</View>

			<Button
				className="w-full mt-4"
				size="default"
				variant="destructive"
				onPress={signOut}
			>
				<Text>Sign Out</Text>
			</Button>
			<View className="h-20" />
		</ScrollView>
	);
}
