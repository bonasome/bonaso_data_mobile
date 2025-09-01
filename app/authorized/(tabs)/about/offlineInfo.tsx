import StyledButton from "@/components/inputs/StyledButton";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import theme from "@/themes/themes";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function OfflineInfo(){
    /*
    Static component that displays information about features available while offline.
    */
    return(
        <StyledScroll>
            <StyledText type="subtitle">You're offline!</StyledText>
            <View style={styles.card}>
                <StyledText type="defaultSemiBold">What does this mean?</StyledText>
                <StyledText>
                    You can still use the app to record data. The next time you connect to the internet, your
                    data will sync (if you're not sure if it has synced, you can click the sync button in the header - 
                    the left of the two buttons). However, please be aware that some of the data on your device may be out
                    of date and you may not have access to certain features that rely on the network.
                </StyledText>
            </View>

            <View style={styles.card}>
                <StyledText type="defaultSemiBold">Why am I offline?</StyledText>
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>You're not connected to the internet/do not have mobile data.</StyledText>
                </View>
                
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>
                        If you're device is connected to the internet, it may that our servers are 
                        undergoing maintnance. Please be patient and try again later. If you continue to have
                        issues with the app going offline even though your device is online, please contact 
                        the BONASO team at info@bonaso.org so that we can help.
                    </StyledText>
                </View>
            </View>
            <StyledButton onPress={() => router.push('/')} label='Got it, take me home!' />
        </StyledScroll>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        flex: 1,
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    ul: {
        paddingLeft: 20, // indent like <ul>
    },
    li: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    bullet: {
        fontSize: 18,
        lineHeight: 22,
        marginRight: 6,
    },
});