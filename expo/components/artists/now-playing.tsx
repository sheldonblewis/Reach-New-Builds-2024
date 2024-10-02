import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

interface NowPlayingProps {
	track: {
		title: string;
		artist: string;
		album: string;
	};
}

const NowPlaying: React.FC<NowPlayingProps> = ({ track }) => {
	return (
		<View style={styles.container}>
			<Image
				source={require("../../assets/artists/now-playing.png")}
				style={styles.albumArt}
			/>
			<View style={styles.infoContainer}>
				<Text style={styles.trackInfo}>{track.title}</Text>
				<Text style={styles.artistInfo}>
					{track.artist} - {track.album}
				</Text>
			</View>
			<TouchableOpacity style={styles.playPauseButton}>
				<Image
					source={require("../../assets/artists/play.png")}
					style={styles.playPauseIcon}
				/>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#f0f0f0",
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
	},
	albumArt: {
		width: 50,
		height: 50,
		borderRadius: 8,
		marginRight: 16,
	},
	infoContainer: {
		flex: 1,
	},
	trackInfo: {
		fontSize: 16,
		fontWeight: "500",
	},
	artistInfo: {
		fontSize: 14,
		color: "#666",
	},
	playPauseButton: {
		padding: 8,
	},
	playPauseIcon: {
		width: 24,
		height: 24,
	},
});

export default NowPlaying;
