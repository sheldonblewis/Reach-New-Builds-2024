import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  SafeAreaView, 
  FlatList, 
  Dimensions,
  Platform,
  Alert,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardEvent
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2 } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";


// Add this near the top of your file, after the imports
const API_BASE_URL = "https://d21e-206-223-169-46.ngrok-free.app";

export default function Camera() {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [artInfo, setArtInfo] = useState<{
		installation_name: string;
		artist: string;
		info: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [location, setLocation] = useState<string | null>(null);
	const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([
		{ role: 'assistant', content: 'Hello! How can I help you with the artwork?' },
	]);
	const [userInput, setUserInput] = useState('');

	// Add this state to store the generation_id
	const [generationId, setGenerationId] = useState<string | null>(null);

	const flatListRef = useRef<FlatList>(null);
	const screenWidth = Dimensions.get('window').width;
	const screenHeight = Dimensions.get('window').height;
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();

	// Add this ref for the ScrollView
	const scrollViewRef = useRef<ScrollView>(null);

	const [keyboardOffset, setKeyboardOffset] = useState(0);

	useEffect(() => {
		const keyboardWillShowListener = Keyboard.addListener(
			'keyboardWillShow',
			(e: KeyboardEvent) => setKeyboardOffset(260)
		);
		const keyboardWillHideListener = Keyboard.addListener(
			'keyboardWillHide',
			() => setKeyboardOffset(0)
		);

		return () => {
			keyboardWillShowListener.remove();
			keyboardWillHideListener.remove();
		};
	}, []);

	// Add this effect to switch to the art info page when it's generated
	useEffect(() => {
		if (artInfo) {
			flatListRef.current?.scrollToIndex({ index: 1, animated: true });
		}
	}, [artInfo]);

	const getConversationId = (url: string) => {
		const parts = url.split('user_uploads/');
		return parts.length > 1 ? parts[1] : url;
	};

	const uploadImage = async (uri: string) => {
		setIsLoading(true);
		try {
			// Read the file as base64
			const base64 = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			const fileName = uri.split("/").pop();
			const fileExt = fileName?.split(".").pop();

			// Get the current user's ID
			const {
				data: { user },
			} = await supabase.auth.getUser();
			const userId = user?.id;

			if (!userId) {
				throw new Error("User not authenticated");
			}

			const filePath = `${userId}/${Date.now()}.${fileExt}`;

			// Upload the file
			const { data, error } = await supabase.storage
				.from("user_uploads")
				.upload(filePath, decode(base64), {
					contentType: `image/${fileExt}`,
				});

			if (error) {
				console.error("Supabase storage error:", error);
				throw error;
			}

			// Get the public URL
			const { data: publicUrlData } = supabase.storage
				.from("user_uploads")
				.getPublicUrl(data.path);

			setImageUrl(publicUrlData.publicUrl);
		} catch (error) {
			console.error("Error uploading image:", error);
			// You might want to set an error state here to display to the user
			// setUploadError(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	function decode(base64: string) {
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		});

		if (!result.canceled) {
			await uploadImage(result.assets[0].uri);
		}
	};

	const takePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		
		if (status !== 'granted') {
			Alert.alert(
				"Permission needed", 
				"Camera permission is required to take photos.",
				[{ text: "OK" }]
			);
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		});

		if (!result.canceled) {
			await uploadImage(result.assets[0].uri);
		}
	};

	const fetchApiMessage = async () => {
		setIsLoading(true);
		try {
			if (!imageUrl) {
				Alert.alert("Error", "Please upload or take a photo first.");
				return;
			}

			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission to access location was denied');
				return;
			}

			let locationData;
			try {
				locationData = await Location.getLastKnownPositionAsync({});
			} catch (error) {
				console.log("Error getting last known position, trying getCurrentPositionAsync");
				const isAndroid = Platform.OS === 'android';
				locationData = await Location.getCurrentPositionAsync({ 
					accuracy: isAndroid ? Location.Accuracy.Low : Location.Accuracy.Lowest 
				});
			}

			if (locationData) {
				const { latitude, longitude } = locationData.coords;
				const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
				const data = await response.json();
				setLocation(data.city);
			} else {
				setLocation("Location not available");
			}
			console.log(imageUrl);
			const conversationId = imageUrl ? getConversationId(imageUrl) : '';
			console.log("Fetching from URL:", `${API_BASE_URL}/art_info?image_url=${encodeURIComponent(imageUrl ?? '')}&city=${encodeURIComponent(location ?? 'Toronto')}&conversation_id=${encodeURIComponent(conversationId)}`);
			
			const response = await fetch(
				`${API_BASE_URL}/art_info?image_url=${encodeURIComponent(imageUrl ?? '')}&city=${encodeURIComponent(location ?? 'Toronto')}&conversation_id=${encodeURIComponent(conversationId)}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("API Error Response:", errorText);
				throw new Error(`API responded with status ${response.status}: ${errorText}`);
			}

			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				const text = await response.text();
				console.error("Unexpected response type:", contentType);
				console.error("Response body:", text);
				throw new Error(`Expected JSON, but received ${contentType}`);
			}

			const data = await response.json();
			setArtInfo(data);
			setGenerationId(data.generation_id); // Store the generation_id
		} catch (error) {
			console.error("Error fetching location or API message:", error);
			setLocation("Error getting location");
			Alert.alert("Error", `Failed to fetch art information: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsLoading(false);
		}
	};

	const askQuestion = async () => {
		if (!userInput.trim() || !generationId) return;

		const newMessage = { role: 'user', content: userInput };
		setChatMessages(prevMessages => [...prevMessages, newMessage]);
		setUserInput('');
		setIsLoading(true);

		try {
			const response = await fetch(
				`${API_BASE_URL}/ask_question?question=${encodeURIComponent(userInput)}&generation_id=${encodeURIComponent(generationId)}`,
				{
					method: 'POST',
					headers: {
						'accept': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			
			setChatMessages(prevMessages => [
				...prevMessages,
				{ role: 'assistant', content: data.answer }
			]);
		} catch (error) {
			console.error("Error asking question:", error);
			Alert.alert("Error", "Failed to get an answer. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const renderItem = ({ item, index }: { item: number; index: number }) => {
		if (index === 0) {
			return (
				<View style={{ width: screenWidth, paddingHorizontal: 8 }}>
					{/* Main upload page content */}
					<View className="w-full aspect-square mb-5 border-2  ${colorScheme === 'dark' ? 'border-white' : 'border-black'} rounded-lg overflow-hidden relative">
						{imageUrl ? (
							<Image
								source={{ uri: imageUrl }}
								className="w-full h-full"
							/>
						) : (
							<View className={`w-full h-full justify-center items-center ${colorScheme === 'dark' ? 'bg-dark-gray' : 'bg-white'}`}>
								<Text className={colorScheme === 'dark' ? 'text-white' : 'text-black'}>No image selected</Text>
							</View>
						)}
						{isLoading && (
							<View className="absolute inset-0 flex items-center justify-center bg-transparent">
								<ActivityIndicator size="large" color="#ffffff" />
							</View>
						)}
					</View>
					<View className="flex-row justify-between w-full mb-5">
						<Button onPress={pickImage} disabled={isLoading} className="bg-white flex-1 mr-2">
							<Text className="text-black">Pick from library</Text>
						</Button>
						<Button onPress={takePhoto} disabled={isLoading} className="bg-white flex-1 ml-2">
							<Text className="text-black">Take a photo</Text>
						</Button>
					</View>
					<Button onPress={fetchApiMessage} disabled={isLoading} className="bg-white mb-5 w-full">
						{isLoading ? (
							<ActivityIndicator size="small" color="#000000" />
						) : (
							<Text className="text-black">Get Art Info</Text>
						)}
					</Button>
					{location && (
						<Text className="mt-4 text-center text-light-gray">{location}</Text>
					)}
				</View>
			);
		} else if (index === 1) {
			return (
				<View style={{ width: screenWidth, height: screenHeight - 70 }}>
					{/* Art info page content */}
					{artInfo ? (
						<ScrollView 
							className="bg-background"
							contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
							showsVerticalScrollIndicator={false}
						>
							<View className="p-4">
								<H1 className="text-foreground text-left mb-2 font-bold">{artInfo.installation_name}</H1>
								<H2 className="text-foreground text-left mb-4 font-medium">by {artInfo.artist}</H2>
							</View>
							<View className="p-4 bg-muted">
								<Text className="text-foreground text-lg leading-relaxed">{artInfo.info}</Text>
							</View>
						</ScrollView>
					) : (
						<View className="flex-1 justify-center items-center">
							<Text className="text-foreground text-xl font-bold">No art info available</Text>
						</View>
					)}
				</View>
			);
		} else {
			return (
				<KeyboardAvoidingView 
					style={{ 
						width: screenWidth, 
						height: screenHeight - 70 - insets.bottom - 90 - keyboardOffset,
						flex: 1,
					}} 
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
				>
					<ScrollView
						ref={scrollViewRef}
						contentContainerStyle={{ 
							flexGrow: 1, 
							justifyContent: 'flex-end',
							paddingVertical: 20,
							paddingHorizontal: 10,
						}}
						showsVerticalScrollIndicator={true}
						onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
					>
						{chatMessages.map((message, idx) => (
							<View
								key={idx}
								style={{
									alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
									backgroundColor: message.role === 'user' ? '#1DA1F2' : '#E1E8ED',
									borderRadius: 18,
									marginBottom: 10,
									maxWidth: '80%',
									padding: 12,
								}}
							>
								<Text style={{ 
									color: message.role === 'user' ? 'white' : 'black',
									fontSize: 16,
								}}>
									{message.content}
								</Text>
							</View>
						))}
					</ScrollView>
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						padding: 10,
						borderTopWidth: 1,
						borderTopColor: '#E1E8ED',
						backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
					}}>
						<TextInput
							style={{
								flex: 1,
								backgroundColor: colorScheme === 'dark' ? '#333' : '#F1F3F4',
								borderRadius: 20,
								paddingHorizontal: 15,
								paddingVertical: 10,
								marginRight: 10,
								color: colorScheme === 'dark' ? '#fff' : '#000',
							}}
							value={userInput}
							onChangeText={setUserInput}
							placeholder="Start a new message"
							placeholderTextColor={colorScheme === 'dark' ? '#999' : '#657786'}
						/>
						<Button 
							onPress={askQuestion} 
							style={{
								backgroundColor: '#1DA1F2',
								borderRadius: 20,
								padding: 10,
								width: 40,
								height: 40,
								justifyContent: 'center',
								alignItems: 'center',
							}}
							disabled={!userInput.trim()}
						>
							<Text style={{ color: 'white', fontSize: 18 }}>➤</Text>
						</Button>
					</View>
				</KeyboardAvoidingView>
			);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="flex-1">
				<View className="absolute top-0 left-0 right-0 z-10 bg-background">
					<H1 className="text-center py-4 text-foreground">Reach?</H1>
				</View>
				<FlatList
					ref={flatListRef}
					data={[0, 1, 2]} // 0 for main page, 1 for art info page, 2 for chat page
					renderItem={renderItem}
					keyExtractor={(item) => item.toString()}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					scrollEnabled={artInfo !== null} // Disable scrolling if no art info
					contentContainerStyle={{ paddingTop: 70 }}
				/>
			</View>
		</SafeAreaView>
	);
}