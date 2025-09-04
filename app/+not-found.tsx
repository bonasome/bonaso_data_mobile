import StyledButton from "@/components/inputs/StyledButton";
import StyledText from "@/components/styledText";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import StyledScroll from "../components/styledScroll";

export default function NotFoundScreen() {
    /*
    Basic not found screen in case the user navigates to a bad page. Contains a link back to the home screen.
    */
   const router = useRouter();

    return (
        <View>
            <Stack.Screen options={{ title: 'Oops! Not Found' }} />
            <StyledScroll >
                <StyledText type="subtitle">You're lost!</StyledText>
                <MaterialCommunityIcons name="emoticon-confused" size={40} color="white" />
                <StyledText>This screen doesn't exist. Sorry about that.</StyledText>
                <StyledButton onPress={() => router.push({ pathname: `/authorized/(tabs)` })} label={'TAKE ME HOME!'} />
            </StyledScroll>
        </View>
    );
}