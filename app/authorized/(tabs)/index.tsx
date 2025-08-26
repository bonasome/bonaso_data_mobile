import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
//import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { migrate, models } from '@/database/ORM/migrate';
//import resetDatabase from '@/database/resetDB';
import fetchWithAuth from "@/services/fetchWithAuth";
import { getSecureItem } from "@/services/secureStorage";
import syncMeta from '@/services/syncMeta';
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import { router, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";


function Me() {
    const { isServerReachable} = useConnection();
    const [me, setMe] = useState(null);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                console.log('fetching tasks...');
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
            {me  ? <View>
                    <StyledText type="defaultSemiBold">You are signed in as {me.display_name} with {me.organization.name}</StyledText> 
                </View> : <TouchableOpacity onPress={() => router.push('/authorized/(tabs)/about/offlineInfo')} style={{ backgroundColor: theme.colors.warningBg, padding: 8 }}>
                    <StyledText style={{color: theme.colors.warningText, textAlign: 'center'}} type="defaultSemiBold">
                        You are offline! Some features may not be available. Tap here for more information.
                    </StyledText>
                </TouchableOpacity>}
        </View>
    )
}

export default function Index() {
    const router = useRouter();
    const { isServerReachable } = useConnection();
    const [username, setUsername] = useState('');

    useEffect(() => {
        const setDB = async () => {
            //await resetDatabase();
            await migrate(models)
        }
        setDB();
    }, []);

    useEffect(() => {
        if(!isServerReachable) return;
        const update = async () => {
            syncTasks();
            syncMeta();
        }
        update();
    }, []);

    return (
        <StyledScroll>
            <Me />
            <View style={styles.card}>
                <StyledText type="subtitle">Quick Actions</StyledText>
                <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/authorized/(tabs)/about'})}>
                    <StyledText type="defaultSemiBold" style={styles.buttonText}>First Time? Start here!</StyledText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/authorized/(tabs)/record'})}>
                    <StyledText type="defaultSemiBold" style={styles.buttonText}>Start recording data!</StyledText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/authorized/(tabs)/tasks'})}>
                    <StyledText type="defaultSemiBold" style={styles.buttonText}>View my tasks</StyledText>
                </TouchableOpacity>
            </View>
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

