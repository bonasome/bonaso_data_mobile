import { Stack } from "expo-router";

export default function AboutLayout() {
    /*
    Manages layout for the index tab.
    */
  return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "App Information" }} />
        </Stack>
    );
}