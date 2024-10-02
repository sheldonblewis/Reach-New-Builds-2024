import * as Linking from "expo-linking";
import * as Location from "expo-location";
import {
	collection,
	getDocs,
	query,
	where,
	Timestamp,
} from "firebase/firestore";
import React, { useState, useEffect } from "react";
import {
	View,
	ScrollView,
	StyleSheet,
	Modal,
	TouchableOpacity,
} from "react-native";
import MapView, { Marker, Circle, Region, Callout } from "react-native-maps";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H2, Muted } from "@/components/ui/typography";
import { firestore } from "@/config/firebase";

//  LOG  Event data: {"date": {"nanoseconds": 0, "seconds": 1727668800}, "date_time": "11:00 am", "description": "TBA is a ten-week free event presented every two years. It will be presented from September 21 to December 1, 2024 at 11 locations throughout Toronto.", "formatted_date": "2024-09-30", "image": "https://www.nowplayingtoronto.com/wp-content/uploads/sites/www.nowplayingtoronto.com/images/2024/07/event-featured-toronto-biennial-of-art-1720122202-150x150.png", "link": "https://www.nowplayingtoronto.com/event/toronto-biennial-of-art/", "location": "at  Various Locations Toronto", "score": 0.25408333963524227, "tags": ["art", "show", "celebration"], "title": "Toronto Biennial of Art", "voters": [], "votes": 1}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const styles = StyleSheet.create({
	circle: {
		backgroundColor: "rgba(0, 0, 255, 0.1)",
	},
	mapView: {
		width: "100%",
		height: "100%",
	},
});

export default function Map() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [nearbyMarkers, setNearbyMarkers] = useState<
		{
			id: string;
			coordinate: { latitude: number; longitude: number };
			title: string;
			description: string;
			link: string;
			tags: string[];
			date: string;
			time: string;
		}[]
	>([]);
	const [region, setRegion] = useState<Region | null>(null);
	const [radius, setRadius] = useState<number>(200);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedMarker, setSelectedMarker] = useState<any>(null);

	useEffect(() => {
		(async () => {
			console.log("Fetching events from Firestore");
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				setErrorMsg("Permission to access location was denied");
				return;
			}

			let location = await Location.getLastKnownPositionAsync({});
			if (!location) {
				location = await Location.getCurrentPositionAsync({});
			}
			setLocation(location);
			setRegion({
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				latitudeDelta: 0.0922,
				longitudeDelta: 0.0421,
			});

			// Fetch events from Firestore
			const events = await fetchEventsFromFirestore();
			setNearbyMarkers(events);
		})();
	}, []);

	const getCoordinatesFromAddress = async (address: string) => {
		try {
			const response = await fetch(
				`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
					address,
				)}&key=${GOOGLE_MAPS_API_KEY}`,
			);
			const data = await response.json();

			if (data.predictions && data.predictions.length > 0) {
				const placeId = data.predictions[0].place_id;
				const detailsResponse = await fetch(
					`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`,
				);
				const detailsData = await detailsResponse.json();

				if (detailsData.result && detailsData.result.geometry) {
					return {
						latitude: detailsData.result.geometry.location.lat,
						longitude: detailsData.result.geometry.location.lng,
					};
				}
			}
			throw new Error("Unable to get coordinates for the address");
		} catch (error) {
			return null;
		}
	};

	const fetchEventsFromFirestore = async () => {
		const eventsCollection = collection(firestore, "events");

		try {
			const today = new Date();
			const twoDaysFromNow = new Date(
				today.getTime() + 2 * 24 * 60 * 60 * 1000,
			);

			const q = query(
				eventsCollection,
				where("date", ">=", Timestamp.fromDate(today)),
				where("date", "<=", Timestamp.fromDate(twoDaysFromNow)),
			);

			const eventSnapshot = await getDocs(q);

			const eventList = await Promise.all(
				eventSnapshot.docs.map(async (doc) => {
					const data = doc.data();

					let coordinates = null;

					if (data.location) {
						coordinates = await getCoordinatesFromAddress(data.location);
					}

					return {
						id: doc.id,
						coordinate: coordinates || { latitude: 0, longitude: 0 },
						title: data.title,
						description: data.description,
						link: data.link,
						tags: data.tags || [],
						date: data.formatted_date,
						time: data.date_time,
					};
				}),
			);
			return eventList.filter((event) => event.coordinate !== null);
		} catch (error) {
			console.error("Error fetching events:", error);
			throw error; // Re-throw the error to be handled by the caller
		}
	};

	const onRegionChangeComplete = (newRegion: Region) => {
		setRegion(newRegion);
		// Calculate new radius based on zoom level
		const { longitudeDelta } = newRegion;
		const newRadius = Math.round((longitudeDelta * 111000) / 25); // Approximate conversion from degrees to meters
		setRadius(newRadius);
	};

	const openModal = (marker: any) => {
		setSelectedMarker(marker);
		setModalVisible(true);
	};

	return (
		<View className="flex-1 items-center justify-center bg-background gap-y-4">
			{errorMsg ? (
				<Muted className="text-center">{errorMsg}</Muted>
			) : location && region ? (
				<>
					<MapView
						style={styles.mapView}
						initialRegion={region}
						onRegionChangeComplete={onRegionChangeComplete}
					>
						<Circle
							center={{
								latitude: location.coords.latitude,
								longitude: location.coords.longitude,
							}}
							radius={radius}
							fillColor="rgba(57, 136, 251, 0.28)"
							strokeColor="transparent"
						/>
						<Circle
							center={{
								latitude: location.coords.latitude,
								longitude: location.coords.longitude,
							}}
							radius={radius / 2}
							fillColor="rgba(57,137,252,255)"
							strokeColor="#fff"
							strokeWidth={2}
						/>

						{nearbyMarkers.map((marker) => (
							<Marker
								key={marker.id}
								coordinate={marker.coordinate}
								onPress={() => openModal(marker)}
							>
								<Callout tooltip>
									<View className="bg-background p-2 rounded-lg">
										<Text className="text-xs font-semibold">
											{marker.title}
										</Text>
									</View>
								</Callout>
							</Marker>
						))}
					</MapView>
					<Modal
						animationType="slide"
						transparent
						visible={modalVisible}
						onRequestClose={() => setModalVisible(false)}
					>
						<View className="flex-1 justify-end mb-4">
							<View className="bg-background rounded-t-3xl p-6 shadow-lg">
								<ScrollView className="max-h-96">
									{selectedMarker && (
										<>
											<H2 className="mb-2">{selectedMarker.title}</H2>
											<Text className="mb-2">
												{selectedMarker.time} • {selectedMarker.date}
											</Text>
											<Muted className="mb-4">
												{selectedMarker.description}
											</Muted>
											<View className="flex-row flex-wrap mb-4">
												{selectedMarker.tags.map(
													(tag: string, index: number) => (
														<View
															key={index}
															className="bg-muted rounded px-2 py-1 mr-2 mb-2"
														>
															<Text className="text-xs">{tag}</Text>
														</View>
													),
												)}
											</View>
											<Button
												variant="link"
												onPress={() => {
													Linking.openURL(selectedMarker.link);
												}}
											>
												<Text>View Event</Text>
											</Button>
										</>
									)}
								</ScrollView>
								<TouchableOpacity
									onPress={() => setModalVisible(false)}
									className="mt-4 self-center"
								>
									<Text className="text-blue-500">Close</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>
				</>
			) : (
				<Muted className="text-center">Loading...</Muted>
			)}
		</View>
	);
}
