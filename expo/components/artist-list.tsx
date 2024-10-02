import React from "react";
import {
	View,
	Text,
	Image,
	FlatList,
	StyleSheet,
	ImageSourcePropType,
} from "react-native";

const ArtistItem = ({
	artist,
}: {
	artist: { name: string; genre: string; avatarSource: ImageSourcePropType };
}) => (
	<View style={styles.artistItem}>
		<Image source={artist.avatarSource} style={styles.avatar} />

		<View style={styles.artistInfo}>
			<Text style={styles.name}>{artist.name}</Text>
			<Text style={styles.genre}>{artist.genre}</Text>
		</View>
	</View>
);

const ArtistList = ({
	artists,
}: {
	artists: {
		id: number;
		avatarSource: ImageSourcePropType;
		name: string;
		genre: string;
	}[];
}) => (
	<FlatList
		data={artists}
		renderItem={({ item }) => <ArtistItem artist={item} />}
		keyExtractor={(item) => item.id.toString()}
	/>
);

const styles = StyleSheet.create({
	artistItem: {
		flexDirection: "row",
		padding: 10,
		alignItems: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 10,
	},
	artistInfo: {
		flex: 1,
	},
	name: {
		fontSize: 16,
		fontWeight: "bold",
	},
	genre: {
		fontSize: 14,
		color: "#666",
	},
});

export default ArtistList;
