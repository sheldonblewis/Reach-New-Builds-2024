import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { View, Button, StyleSheet } from "react-native";

import { ElectronicArtists } from "../../../components/artists/electronic-artists";
import { Text } from "../../../components/ui/text";

import { SelectGenre } from "@/components/select-genre";
import { useNextArtist } from "@/hooks/use-next-artist";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";

interface Track {
	preview_url: string;
	name: string;
}

function Music() {
	const { token, promptAsync, logout } = useSpotifyAuth();
	const [genre, setGenre] = useState<string>("Electronic");
	const { artist, loading, error, fetchNextArtist } = useNextArtist();
	const [topTrack, setTopTrack] = useState<Track | null>(null);
	const [sound, setSound] = useState<Audio.Sound | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		fetchNextArtist(genre);
	}, [genre]);

	useEffect(() => {
		if (artist) {
			fetchTopTrack(artist.spotifyId);
		}
	}, [artist]);

	useEffect(() => {
		return sound
			? () => {
					console.log("Unloading Sound");
					sound.unloadAsync();
				}
			: undefined;
	}, [sound]);

	useEffect(() => {
		// Set up audio session
		async function setupAudio() {
			try {
				await Audio.setAudioModeAsync({
					playsInSilentModeIOS: true,
					staysActiveInBackground: true,
					shouldDuckAndroid: true,
				});
				console.log("Audio session set up successfully");
			} catch (error) {
				console.error("Error setting up audio session:", error);
			}
		}
		setupAudio();
	}, []);

	const fetchTopTrack = async (artistId: string) => {
		console.log("fetchTopTrack", artistId);
		try {
			const response = await fetch(
				`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			const data = await response.json();
			console.log("next track", data);
			if (data.tracks && data.tracks.length > 0) {
				setTopTrack(data.tracks[0]);
			}
		} catch (error) {
			console.error("Error fetching top track:", error);
		}
	};

	const playPauseTrack = async () => {
		if (sound) {
			if (isPlaying) {
				console.log("Pausing track");
				await sound.pauseAsync();
			} else {
				console.log("Resuming track");
				await sound.playAsync();
			}
			setIsPlaying(!isPlaying);
		} else if (topTrack && topTrack.preview_url) {
			console.log("Loading new track:", topTrack.preview_url);
			try {
				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri: topTrack.preview_url },
					{ shouldPlay: true },
					(status) => {
						console.log("Playback status:", status);
						// if (status.didJustFinish) {
						// 	setIsPlaying(false);
						// }
					},
				);
				setSound(newSound);
				setIsPlaying(true);
				console.log("New track loaded and playing");
			} catch (error) {
				console.error("Error playing track:", error);
			}
		} else {
			console.log("No preview URL available for this track");
		}
	};

	if (!token) {
		console.log("No token");
		return (
			<View style={styles.container}>
				<Text>Login with Spotify</Text>
				<Button title="Login with Spotify" onPress={() => promptAsync()} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<SelectGenre genre={genre} setGenre={setGenre} />
			<Button title="Logout" onPress={() => logout()} />
			<Button title="Next Artist" onPress={() => fetchNextArtist(genre)} />
			{loading && <Text>Loading...</Text>}
			{error && <Text>Error: {error.message}</Text>}
			{!loading && artist && (
				<>
					<Text>Artist: {artist.name}</Text>
					{topTrack && (
						<>
							<Text>Top Track: {topTrack.name}</Text>
							<Text>
								Preview URL: {topTrack.preview_url || "Not available"}
							</Text>
							<Button
								title={isPlaying ? "Pause" : "Play Preview"}
								onPress={playPauseTrack}
								disabled={!topTrack.preview_url}
							/>
						</>
					)}
				</>
			)}
		</View>
	);
}

export default function Page() {
	return <ElectronicArtists />;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 80,
	},
});
