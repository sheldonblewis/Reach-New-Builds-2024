import { View, StyleSheet, Text } from "react-native";

// @ts-expect-error
import alvvaysImg from "../../assets/artists/alvvays.png";
// @ts-expect-error
import badBadImg from "../../assets/artists/bad-bad.png";
// @ts-expect-error
import brokenSocialSceneImg from "../../assets/artists/broken-social-scene.png";
// @ts-expect-error
import drakeImg from "../../assets/artists/drake.png";
// @ts-expect-error
import metricImg from "../../assets/artists/metric.png";
// @ts-expect-error
import mstrkrftImg from "../../assets/artists/mstrkrft.png";
// @ts-expect-error
import theWeekndImg from "../../assets/artists/weekend.png";
import ArtistList from "../artist-list";
import NowPlaying from "./now-playing";

export const ElectronicArtists = () => {
	const artists = [
		{
			id: 4,
			name: "Alvvays",
			genre: "Pop Electronic",
			avatarSource: alvvaysImg,
		},
		{
			id: 5,
			name: "Drake",
			genre: "Hip Hop",
			avatarSource: drakeImg,
		},
		{
			id: 6,
			name: "Metric",
			genre: "Indie Pop",
			avatarSource: metricImg,
		},
		{
			id: 7,
			name: "The Weeknd",
			genre: "R&B",
			avatarSource: theWeekndImg,
		},
		{
			id: 8,
			name: "Broken Social Scene",
			genre: "Indie",
			avatarSource: brokenSocialSceneImg,
		},
		{
			id: 1,
			name: "BadBadNotGood",
			genre: "Jazz",
			avatarSource: badBadImg,
		},
		{
			id: 2,
			name: "MSTRKRFT",
			genre: "Electronic",
			avatarSource: mstrkrftImg,
		},
	];
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Toronto Artists</Text>
			<ArtistList artists={artists} />
			<NowPlaying
				track={{
					title: "Eyes On Me",
					artist: "BadBadNotGood",
					album: "Mid Spiral",
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 80,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		marginBottom: 10,
		paddingLeft: 10,
	},
});
