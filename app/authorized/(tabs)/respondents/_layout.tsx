import { Stack } from "expo-router";

export default function RespondentsLayout() {
  return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "Respondents" }} />
            <Stack.Screen name="[id]" options={{ title: "Respondent Details" }} />
            <Stack.Screen name="update" options={{ title: "Updating Respondent" }} />
            <Stack.Screen name="interactionEdit" options={{ title: "Edit Interaction" }} />
        </Stack>
    );
}