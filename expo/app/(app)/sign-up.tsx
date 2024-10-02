import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";

const phoneFormSchema = z.object({
	phone: z
		.string()
		.regex(
			/^\+[1-9]\d{1,14}$/,
			"Please enter a valid phone number with country code.",
		),
});

const otpFormSchema = z.object({
	otp: z.string().length(6, "OTP must be 6 digits"),
});

const PhoneForm = ({
	onSubmit,
}: {
	onSubmit: (phone: string) => Promise<void>;
}) => {
	const phoneForm = useForm<z.infer<typeof phoneFormSchema>>({
		resolver: zodResolver(phoneFormSchema),
		defaultValues: {
			phone: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof phoneFormSchema>) => {
		await onSubmit(data.phone);
	};

	return (
		<>
			<Form {...phoneForm}>
				<View className="gap-4">
					<FormField
						control={phoneForm.control}
						name="phone"
						render={({ field }) => (
							<FormInput
								label="Phone"
								placeholder="Phone (e.g. +1234567890)"
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="phone-pad"
								{...field}
							/>
						)}
					/>
				</View>
			</Form>
			<Button
				size="default"
				variant="default"
				onPress={phoneForm.handleSubmit(handleSubmit)}
				disabled={phoneForm.formState.isSubmitting}
				className="web:m-4"
			>
				{phoneForm.formState.isSubmitting ? (
					<ActivityIndicator size="small" />
				) : (
					<Text>Send OTP</Text>
				)}
			</Button>
		</>
	);
};

const OtpForm = ({
	onSubmit,
}: {
	onSubmit: (otp: string) => Promise<void>;
}) => {
	const otpForm = useForm<z.infer<typeof otpFormSchema>>({
		resolver: zodResolver(otpFormSchema),
		defaultValues: {
			otp: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof otpFormSchema>) => {
		await onSubmit(data.otp);
	};

	return (
		<>
			<Form {...otpForm}>
				<View className="gap-4">
					<FormField
						control={otpForm.control}
						name="otp"
						render={({ field }) => (
							<FormInput
								label="OTP"
								placeholder="Enter 6-digit OTP"
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="number-pad"
								maxLength={6}
								{...field}
							/>
						)}
					/>
				</View>
			</Form>
			<Button
				size="default"
				variant="default"
				onPress={otpForm.handleSubmit(handleSubmit)}
				disabled={otpForm.formState.isSubmitting}
				className="web:m-4"
			>
				{otpForm.formState.isSubmitting ? (
					<ActivityIndicator size="small" />
				) : (
					<Text>Verify OTP</Text>
				)}
			</Button>
		</>
	);
};

export default function SignUp() {
	const [otpSubmitted, setOtpSubmitted] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const { signInWithOtp, verifyOtp } = useSupabase();

	async function onPhoneSubmit(phone: string) {
		try {
			await signInWithOtp(phone);
			setPhoneNumber(phone);
			setOtpSubmitted(true);
		} catch (error: Error | any) {
			console.error("Sign in error:", error.message);
		}
	}

	async function onOtpSubmit(otp: string) {
		try {
			await verifyOtp(otp, phoneNumber);
			// Handle successful verification (e.g., navigate to a new screen)
		} catch (error: Error | any) {
			console.error("OTP verification error:", error.message);
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-background p-4">
			<View className="flex-1 gap-4 web:m-4">
				<H1 className="self-start">Sign In with Phone</H1>

				{!otpSubmitted ? (
					<PhoneForm onSubmit={onPhoneSubmit} />
				) : (
					<OtpForm onSubmit={onOtpSubmit} />
				)}
			</View>
		</SafeAreaView>
	);
}
