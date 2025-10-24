import StyledScroll from '@/components/styledScroll';
import StyledText from '@/components/styledText';
import theme from '@/themes/themes';
import { StyleSheet, View } from 'react-native';

export default function AboutScreen() {
    /*
    Static information component that displays basic information about the app and how to use it.
    */
    return (
        <StyledScroll>
            <StyledText type="title">About</StyledText>
            <View style={styles.card}>
                <StyledText type="subtitle" style={{marginBottom: 15}}>What is this app?</StyledText>
                <StyledText>
                    The BONASO Data Portal app is a tool that you can use to collect data on the go,
                    no matter where you go. The app is a trimmed down version of the website, streamlined to 
                    be efficient for collecting data in the field. With this app, you can:
                </StyledText>

                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>View your tasks.</StyledText>
                </View>
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>Collect data about respondents.</StyledText>
                </View>
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>Record interactions with respondents that will contribute to your organization's targets.</StyledText>
                </View>
            </View>
            
            <View style={styles.card}>
                <StyledText type="subtitle" style={{marginBottom: 15}}>Some terms...</StyledText>
                <StyledText>
                    Here are a few definitions for some terms you may see often while using the app.
                </StyledText>
    
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText><StyledText type="defaultSemiBold">Respondent: </StyledText>
                        Any person that you collect data from. Whenever you record interactions with people in the field,
                        we require that you collect certain information about the people you are interacting with.
                    </StyledText>
                </View>
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText><StyledText type="defaultSemiBold">Interaction: </StyledText>
                        Any assessment you complete with a respondent, or an "interaction" you have with them,
                        is considered an "interaction". You can have multiple interactions with the same respondent,
                        even at the same time, if applicable.
                    </StyledText>
                </View>
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText><StyledText type="defaultSemiBold">Task: </StyledText>
                        A task is an assessment that your organization has been assigned to complete with respondents.
                    </StyledText>
                </View>
            </View>
            <View style={styles.card}>
                <StyledText type="subtitle" style={{marginBottom: 15}}>Can I use this offline?</StyledText>
                <StyledText>
                    Yes! You can absolutely use this app offline. Your data will be uploaded once you gain connection again. 
                    This should happen automatically, but you can also press the sync button at the top of the screen.
                    A few things to note about offline use:
                </StyledText>

                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>While offline, you will not have access to respondents in the database.</StyledText>
                </View>
                <View style={styles.li}>
                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                    <StyledText>While offline, you will not be able to see other interactions a respondent has had. Please keep this in mind when logging
                        acitivites that may require prerequisite interactions, as these may be blocked.
                    </StyledText>
                </View>
            </View>
            <View style={{ padding: 20 }}></View>
        </StyledScroll>
    );
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
    button:{
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 15,
        margin: 10,
    },
    buttonText: {
        textAlign: 'center',
    },
});