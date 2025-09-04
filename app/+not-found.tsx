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
        <>
            <Stack.Screen options={{ title: 'Oops! Not Found' }} />
            <StyledScroll>
                <View style={{ alignItems: 'center', marginTop: 150 }}>
                <StyledText type="title">You're lost!</StyledText>
                <MaterialCommunityIcons name="emoticon-confused" size={100} color="white" style={{ marginTop: 50 }} />
                <StyledText type='subtitle' style={{ marginTop: 40, textAlign: 'center' }}>This screen doesn't exist. Sorry about that.</StyledText>
                <StyledButton onPress={() => router.push(`/authorized/(tabs)`)} label={'TAKE ME HOME!'} style={{marginTop: 40 }}/>
                </View>
            </StyledScroll>
        </>
    );
}