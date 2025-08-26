import { Stack } from "expo-router";

export default function RespondentsLayout() {
  return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "App Information" }} />
        </Stack>
    );
}