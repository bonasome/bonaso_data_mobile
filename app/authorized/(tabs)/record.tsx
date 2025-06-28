import AddInteraction from '@/components/record/AddInteraction';
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import { querySelector } from '@/database/queryWriter';
import { getInteractionsForRespondent, searchLocalRespondents } from '@/database/searchLocalRespondents';
import checkLastSynced from '@/database/sync/checkLastSynced';
import mapTasks from '@/database/sync/mapTasks';
import syncTasks from '@/database/sync/syncTasks';
import compTime from '@/services/compTime';
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

function Interactions({ interactions }) {
  return (
        <View style={styles.lastStep}>
            <StyledText type="subtitle">Previous Interactions</StyledText>
            {interactions.length > 0 ? (
                interactions.map((ir) => (
                <View key={ir.id} style={styles.interactionCard}>
                    <StyledText type="subtitle">{ir.task_detail.indicator.name}</StyledText>
                    <StyledText type="default">{ir.interaction_date}</StyledText>
                </View>
                ))
            ) : (
                <StyledText>This respondent does not have any interactions on record.</StyledText>
            )}
        </View>
    );
}


export default function Record() {
    const router = useRouter();
    const { isServerReachable } = useConnection();
    const [tasks, setTasks] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [search, setSearch] = useState('')
    const [respondents, setRespondents] = useState([]);
    const [activeRespondent, setActiveRespondent] = useState(null);
    const [fromLocal, setFromLocal] = useState(false);
    const [interactions, setInteractions] = useState([]);
    const { created } = useLocalSearchParams();

    useEffect(() => {
        console.log(created)
        if (created) {
            (async () => {
                if(!isServerReachable){
                    const found = await querySelector(`SELECT * FROM respondents WHERE id=?`, [created]);
                    if(found.length === 0) return
                    console.log(found[0])
                    setActiveRespondent(found[0]);
                }
                else{   
                    try {
                        const response = await fetchWithAuth(`/api/record/respondents/${created}/`);
                        const data = await response.json();
                        if (response.ok) {
                            setActiveRespondent(data);
                        } 
                        else {
                            console.error('API error', response.status);
                        }
                    } 
                    catch (err) {
                        console.error('Auth error, user should login again', err);
                    }
                }
            })();
        }
    }, [created]);
    
    useEffect(() => {
        if (!isServerReachable) return;
        const maybeSync = async () => {
            const lastSynced = await checkLastSynced('tasks');
            const shouldSkip = compTime(lastSynced, 15);
            if (shouldSkip) return;

            try {
                const response = await fetchWithAuth('/api/manage/tasks/');
                if (response.ok) {
                    const data = await response.json();
                    await syncTasks(data.results);
                    const myTasks = await mapTasks(); // reload after syncing
                    setTasks(myTasks);
                } else {
                    console.error('API error', response.status);
                }
            } 
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        };
        maybeSync();
    }, [isServerReachable, search]);

    useEffect(() => {
        const loadTasks = async() => {
            const myTasks = await mapTasks();
            setTasks(myTasks);
        }
        loadTasks();
    }, [])

    useEffect(() => {
        if(isServerReachable){
            const searchRespondents = async() => {
                if(search === '') return;
                try {
                    const response = await fetchWithAuth(`/api/record/respondents/?search=${search}`);
                    const data = await response.json();
                    if (response.ok) {
                        setRespondents(data.results);
                    } else {
                        console.error('API error', response.status);
                    }
                } 
                catch (err) {
                    console.error('Auth error, user should login again', err);
                }
            }
            searchRespondents();
        }
        else{
            const searchLocal= async () => {
                const localResp = await searchLocalRespondents(search);
                setRespondents(localResp);
                setFromLocal(true);
            }
            searchLocal();
        }
        
    }, [search])

    useEffect(() => {
        if(isServerReachable){
            const getInteractions = async() => {
                if(!activeRespondent) return;
                try {
                    console.log('fetching respondent details...');
                    const response = await fetchWithAuth(`/api/record/interactions/?respondent=${activeRespondent.id}`);
                    const data = await response.json();
                    setInteractions(data.results)
                } 
                catch (err) {
                    console.error('Failed to fetch respondent: ', err);
                }
            }
            getInteractions();
        }
        else{
            const getLocal = async () => {
                const localIr = await getInteractionsForRespondent(activeRespondent.id);
                setInteractions(localIr);
            }
            getLocal();
        }
    }, [activeRespondent])

    function goToCreate(){
        router.push({
            pathname: 'authorized/create/createRespondent',
        })
    }

    return (
        <View style={{ flex: 1 }}>
            <StyledScroll>
            <View style={styles.step}>
            <View >
                <StyledText type='subtitle'>Step 1: Select a Respondent</StyledText>
                <TextInput
                    placeholder="start typing to search..."
                    placeholderTextColor={theme.colors.lightGrey}
                    onPress={() => setIsSearching(!isSearching)}
                    onChangeText={(text) => setSearch(text)}
                    value={search}
                    style={styles.textInput}
                />
                <View>
                {respondents.length > 0 && isSearching && search !== '' && (
                    <ScrollView style={styles.searchBox}>
                    {respondents.map((r) => (
                        <TouchableOpacity
                        key={r.id}
                        style={styles.bar}
                        onPress={() => {
                            setActiveRespondent(r);
                            setIsSearching(false);
                        }}
                        >
                        {r.is_anonymous ? (
                            <StyledText style={styles.searchEntry} type="darkSemiBold">
                            Anonymous Respondent {r.uuid}
                            </StyledText>
                        ) : (
                            <StyledText style={styles.searchEntry} type="darkSemiBold">
                            {r.first_name} {r.last_name}
                            </StyledText>
                        )}
                        </TouchableOpacity>
                    ))}
                    </ScrollView>
                )}
                </View>
            </View>

            {activeRespondent && !isSearching && (
                <View>
                <StyledText type='subtitle'>
                    You're viewing{' '}
                    {activeRespondent.is_anonymous
                    ? `Anonymous Respondent ${activeRespondent.uuid}`
                    : `${activeRespondent.first_name} ${activeRespondent.last_name}`}
                </StyledText>
                <StyledText>
                    {activeRespondent.village}, {activeRespondent.district}
                </StyledText>
                <TouchableOpacity style={styles.button} onPress={() => setActiveRespondent(null)}>
                    <StyledText style={styles.buttonText} type="defaultSemiBold">
                        Clear Respondent
                    </StyledText>
                </TouchableOpacity>
                </View>
            )}
            {!activeRespondent && 
                <TouchableOpacity style={styles.button} onPress={() => goToCreate()}>
                    <StyledText style={styles.buttonText} type="defaultSemiBold">
                    CREATE NEW RESPONDENT
                    </StyledText>
                </TouchableOpacity>
            }
            
            </View>
            {activeRespondent && <AddInteraction respondent={activeRespondent} tasks={tasks} fromLocal={fromLocal} />}
            {activeRespondent && (interactions.length > 0 ? <Interactions interactions={interactions} /> : 
                <StyledText>No Previous Interactions</StyledText>)}
            </StyledScroll>
        </View>
    );
}

const styles = StyleSheet.create({
    step: {
        padding: 15,
        backgroundColor: theme.colors.bonasoMain,
        marginBottom: 20,
    },
    button:{
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 15,
        margin: 10,
    },
    buttonText: {
        textAlign: 'center',
    },
    textInput: {
        backgroundColor: '#fff',
        marginTop: 10,
        height: 50,
        marginBottom: 20,
        padding: 12,
    },
    searchBox:{
        position: 'absolute',
        top: -20, // adjust as needed
        left: 16,
        right: 16,
        maxHeight: 300,
        backgroundColor: 'white',
        borderWidth: 1,
        zIndex: 10,
    },
    searchEntry: {
        padding: 7,
    },
    date:{
        flexDirection: 'row',
    },
    card:{
        padding: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.bonasoLightAccent,
    },
    selectedCard:{
        padding: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.bonasoDarkAccent,
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
    bar:{
        color: theme.colors.bonasoUberDarkAccent
    },
    lastStep: {
        padding: 15,
        backgroundColor: theme.colors.bonasoMain,
        marginBottom: 50,
    },
    interactionCard:{
        marginTop: 10,
        padding: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.bonasoDarkAccent,
    },
});