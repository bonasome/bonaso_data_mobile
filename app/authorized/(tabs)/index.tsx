import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { migrate, models } from '@/database/ORM/migrate';
import { Interaction } from "@/database/ORM/tables/interactions";
import { Respondent } from "@/database/ORM/tables/respondents";
//import resetDatabase from '@/database/resetDB';
import fetchWithAuth from "@/services/fetchWithAuth";
import { getSecureItem } from "@/services/secureStorage";
import syncMeta from '@/services/syncMeta';
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function Me() {
    /*
    Small helper component that displays information about the user (or an alert if they are offline).
    */
    const { isServerReachable} = useConnection();
    const { offlineMode} = useAuth()
    const [me, setMe] = useState(null); //stores user info

    useEffect(() => {
        const fetchMe = async () => {
            if(!isServerReachable || offlineMode ) return;
            try {
                console.log('fetching user info...');
                const userId = await getSecureItem('user_id');
                const response = await fetchWithAuth(`/api/profiles/users/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setMe(data)
                } 
                else {
                    console.error('API error', response.status);
                }
            } 
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        }
        if(isServerReachable){
            fetchMe();
        }
    }, []);

    return(
        <View style={{ margin: 5}}>
            {me  && <View>
                <StyledText type="defaultSemiBold">You are signed in as {me.display_name} with {me.organization.name}</StyledText> 
            </View>}
        </View>
    )
}

export default function Index() {
    /*
    Index, or home, component that displays after the user first logs in. Will contain all the landing information,
    but also importantly perform a few functions that are vital to the apps function (like running 
    migrations or displaying key alerts to the user on login.)
    */
    const router = useRouter();
    const { offlineMode } = useAuth(); //for checking if there are access tokens available
    const { isServerReachable } = useConnection(); //for checking if the user is connected to the server

    const route = useRoute();
    
    //display alert if they are offline
    useEffect(() => {
        const offlineWarning = async() => {
            //if offline and redirected from the offline login screen
            if(offlineMode && route.params?.showInfo){
                const storedCredentials = await getSecureItem('user_credentials');
                if(storedCredentials){
                    try{
                        //figure out how many days the user has left with their offline credentials
                        const cred = JSON.parse(storedCredentials)
                        const day = 24 * 60 * 60 * 1000;
                        const now = new Date();
                        const createdOn = new Date(cred.created_on);
                        const diff = Math.round((now - createdOn) / day);
                        alert(`You are in offline mode. Please note that your offline credentials will expire in ${30-diff} days, at which time you must connect to the internet and login again.`)
                        
                    }
                    catch(err){
                        console.error(err)
                    }
                }
            }
        }
        offlineWarning();
    }, []);

    //run a migration on load
    useEffect(() => {
        const setDB = async () => {
            //await resetDatabase();
            await migrate(models)
        }
        setDB();
    }, []);

    //if connected and have tokens, try syncing device
    useEffect(() => {
        if(!isServerReachable || offlineMode) return;
        const update = async () => {
            //sync records if more tha  12 hours old
            syncTasks();
            syncMeta();
            //look for any unsynced respondents/interactions
            await Respondent.upload();
            await Interaction.upload();
        }
        update();
    }, []);

    return (
        <StyledScroll>
            {(isServerReachable && !offlineMode) ? <Me /> : <TouchableOpacity onPress={() => router.push('/authorized/(tabs)/about/offlineInfo')} style={{ backgroundColor: theme.colors.warningBg, padding: 8 }}>
                <StyledText style={{color: theme.colors.warningText, textAlign: 'center'}} type="defaultSemiBold">
                    You are offline! Some features may not be available. Tap here for more information.
                </StyledText>
            </TouchableOpacity>}

            <View style={styles.card}>
                <StyledText type="subtitle">Quick Actions</StyledText>
                <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/authorized/(tabs)/about'})}>
                    <StyledText type="defaultSemiBold" style={styles.buttonText}>First Time? Start here!</StyledText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/authorized/(tabs)/respondents'})}>
                    <StyledText type="defaultSemiBold" style={styles.buttonText}>Start recording data!</StyledText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/authorized/(tabs)/tasks'})}>
                    <StyledText type="defaultSemiBold" style={styles.buttonText}>View my tasks</StyledText>
                </TouchableOpacity>
            </View>
            
        </StyledScroll>
    );
}

//styles
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

