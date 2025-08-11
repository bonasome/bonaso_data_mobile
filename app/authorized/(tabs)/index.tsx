import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
//import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { storeMeta } from '@/database/ORM/metaHelper';
import { migrate, models } from '@/database/ORM/migrate';
import { Task } from '@/database/ORM/tables/tasks';
//import resetDatabase from '@/database/resetDB';
import uploadLocal from '@/database/upload/uploadLocal';
import fetchWithAuth from "@/services/fetchWithAuth";
import { getSecureItem } from "@/services/secureStorage";
import theme from "@/themes/themes";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";


function Me({ me }) {
    return(
        <View style={styles.card}>
            {me  ?
                <StyledText type="defaultSemiBold">You are signed in as {me.display_name} with {me.organization.name}</StyledText> :
                <StyledText type="defaultSemiBold">You are offline! Some features may not be available.</StyledText>
            }
        </View>
    )
}

export default function Index() {
    const [me, setMe] = useState(null);
    const router = useRouter();
    const { isServerReachable } = useConnection();
    useEffect(() => {
        const setDB = async () => {
            //await resetDatabase();
            await migrate(models)
        }
        setDB();
    }, [])

    useEffect(() => {
        if(isServerReachable){
            const syncLocal = async() => {
                await uploadLocal();
            }
            syncLocal();
        }
    }, [isServerReachable])

    useEffect(() => {
        if(!isServerReachable) return;
        const fetchTasks = async () => {
            try {
                console.log('fetching tasks...')
                const response = await fetchWithAuth('/api/manage/tasks/');
                if (response.ok) {
                    const data = await response.json();
                    for(const task of data){
                        await Task.save(task)
                    }
                } 
                else {
                    console.error('API error', response.status);
                }
            } 
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        }
        fetchTasks();
        
        const fetchMeta = async () => {
            try {
                const response = await fetchWithAuth('/api/record/respondents/meta/');
                const data = await response.json();
                await storeMeta(data);
            }
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        }
        fetchMeta();
        
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
        fetchMe();
    }, [])

    return (
        <StyledScroll>
            <StyledText type='title'> {me ? `Welcome, ${me.first_name} ${me.last_name}!` :  'Welcome!'}</StyledText>
            <Me me={me} />
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

