import { Stack } from "expo-router";

export default function RespondentsLayout() {
    /*
    Manages layout for respondents tab. Forms are redirected to on an ad hoc basis.
    */
  return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "Respondents" }} />
            <Stack.Screen name="[id]" options={{ title: "Respondent Details" }} />
        </Stack>
    );
}