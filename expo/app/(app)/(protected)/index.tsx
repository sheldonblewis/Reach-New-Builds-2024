import React from "react";
import { ScrollView, View } from "react-native";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { H1, H2 } from "@/components/ui/typography";

// Mock data for nearby events
const nearbyEvents = [
	{
		id: "1",
		title: "Local Music Festival",
		date: "2023-08-15",
		location: "City Park",
		description: "Annual music celebration featuring local artists",
	},
	{
		id: "2",
		title: "Food Truck Rally",
		date: "2023-08-18",
		location: "Downtown Square",
		description: "Variety of cuisines from the city's best food trucks",
	},
	{
		id: "3",
		title: "Art Exhibition Opening",
		date: "2023-08-20",
		location: "Community Gallery",
		description: "Showcasing works from emerging local artists",
	},
];

// Mock data for landmarks
const landmarks = [
	{
		id: "1",
		name: "Historic Town Hall",
		description: "19th century architecture",
		footer: "Open for guided tours",
	},
	{
		id: "2",
		name: "Riverside Park",
		description: "Beautiful nature trails",
		footer: "Open dawn to dusk",
	},
	{
		id: "3",
		name: "Old Clock Tower",
		description: "City's iconic landmark",
		footer: "Viewable from downtown area",
	},
];

export default function Feed() {
	return (
		<ScrollView className="flex-1 bg-background p-4 pt-20">
			<H1 className="text-center mb-4">Discover</H1>

			<H2 className="mb-2">Nearby Events</H2>
			{nearbyEvents.map((event) => (
				<Card key={event.id} className="w-full mb-4">
					<CardHeader>
						<CardTitle>{event.title}</CardTitle>
						<CardDescription>
							{event.date} at {event.location}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Text>{event.description}</Text>
					</CardContent>
					<CardFooter>
						<Text>Tap for more details</Text>
					</CardFooter>
				</Card>
			))}

			<H2 className="mb-2 mt-6">Local Landmarks</H2>
			{landmarks.map((landmark) => (
				<Card key={landmark.id} className="w-full mb-4">
					<CardHeader>
						<CardTitle>{landmark.name}</CardTitle>
						<CardDescription>{landmark.description}</CardDescription>
					</CardHeader>
					<CardContent>
						<Text>A must-visit destination in our city</Text>
					</CardContent>
					<CardFooter>
						<Text>{landmark.footer}</Text>
					</CardFooter>
				</Card>
			))}
			<View className="h-20" />
		</ScrollView>
	);
}
