import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	makeRedirectUri,
	useAuthRequest,
	ResponseType,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

// Endpoint
const discovery = {
	authorizationEndpoint: "https://accounts.spotify.com/authorize",
	tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export function useSpotifyAuth() {
	const [token, setToken] = useState<string | null>(null);

	const [request, response, promptAsync] = useAuthRequest(
		{
			responseType: ResponseType.Token,
			clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID as string,
			clientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET as string,
			scopes: [
				"user-read-private",
				"user-read-email",
				"user-read-playback-state",
				"user-modify-playback-state",
			],
			usePKCE: false,
			redirectUri: makeRedirectUri({
				scheme: "expo-supabase-starter",
			}),
		},
		discovery,
	);

	console.log(
		makeRedirectUri({
			scheme: "expo-supabase-starter",
		}),
	);

	useEffect(() => {
		// Load token from storage when component mounts
		loadToken();
	}, []);

	useEffect(() => {
		console.log(response);
		if (response?.type === "success") {
			const { access_token } = response.params;
			// For demo purposes, we're just setting the code as the token
			setTokenAndStore(access_token);
		}
	}, [response]);

	const loadToken = async () => {
		try {
			const storedToken = await AsyncStorage.getItem("@spotify_token");
			if (storedToken !== null) {
				setToken(storedToken);
			}
		} catch (e) {
			console.error("Failed to load token", e);
		}
	};

	const setTokenAndStore = async (newToken: string) => {
		try {
			await AsyncStorage.setItem("@spotify_token", newToken);
			setToken(newToken);
		} catch (e) {
			console.error("Failed to save token", e);
		}
	};

	const logout = async () => {
		await AsyncStorage.removeItem("@spotify_token");
		setToken(null);
	};

	return {
		token,
		promptAsync,
		logout,
	};
}
