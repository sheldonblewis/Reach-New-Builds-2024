import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { theme } from "@/lib/constants";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ProtectedLayout() {
	const { colorScheme } = useColorScheme();

	return (
		<Tabs
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarActiveTintColor:
					colorScheme === "dark"
						? theme.dark.foreground
						: theme.light.foreground,
				tabBarStyle: {
					backgroundColor:
						colorScheme === "dark"
							? theme.dark.background
							: theme.light.background,
				},
				tabBarShowLabel: true,
				tabBarIcon: ({ focused, color, size }) => {
					let iconName;

					if (route.name === "index") {
						iconName = focused ? "list" : "list-outline";
					} else if (route.name === "settings") {
						iconName = focused ? "settings" : "settings-outline";
					} else if (route.name === "map") {
						iconName = focused ? "map" : "map-outline";
					} else if (route.name === "music") {
						iconName = focused ? "musical-notes" : "musical-notes-outline";
					} else if (route.name === "camera") {
						iconName = focused ? "camera" : "camera-outline";
					} else if (route.name === "ar") {
						iconName = focused ? "cube" : "cube-outline";
					}

					return <Ionicons name={iconName as any} size={size} color={color} />;
				},
			})}
		>
			<Tabs.Screen
				name="music"
				options={{ title: "Music", tabBarLabel: "Music" }}
			/>
			<Tabs.Screen
				name="index"
				options={{ title: "Feed", tabBarLabel: "Feed" }}
			/>
			<Tabs.Screen name="ar" options={{ title: "AR", tabBarLabel: "AR" }} />
			<Tabs.Screen
				name="map"
				options={{ title: "Reach", tabBarLabel: "Reach" }}
			/>
			<Tabs.Screen
				name="camera"
				options={{ title: "Camera", tabBarLabel: "Camera" }}
			/>
			<Tabs.Screen
				name="settings"
				options={{ title: "Settings", tabBarLabel: "Settings" }}
			/>
		</Tabs>
	);
}
