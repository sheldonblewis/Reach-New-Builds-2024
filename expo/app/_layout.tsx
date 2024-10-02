import "../global.css";
import { PortalHost } from "@rn-primitives/portal";
import { Slot } from "expo-router";

import { SupabaseProvider } from "@/context/supabase-provider";

export default function AppLayout() {
	return (
		<SupabaseProvider>
			<Slot />
			<PortalHost />
		</SupabaseProvider>
	);
}
