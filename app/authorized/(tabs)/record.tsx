import StyledButton from '@/components/inputs/StyledButton';
import AddInteraction from '@/components/record/AddInteraction';
import Interactions from '@/components/record/Interactions';
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import { Respondent, RespondentLink } from '@/database/ORM/tables/respondents';
import { Task } from '@/database/ORM/tables/tasks';
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function Record() {
    const router = useRouter();
    const { isServerReachable } = useConnection();
    const [tasks, setTasks] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [search, setSearch] = useState('');
    const [respondents, setRespondents] = useState([]);
    const [activeRespondent, setActiveRespondent] = useState(null);
    const [respondentUUID, setRespondentUUID] = useState(null);
    const [displayName, setDisplayName] = useState('')
    const { redirected } = useLocalSearchParams();

    //if the user just created a respondent, automatically redirect them with that respondent preloaded
    useEffect(() => {
        if (redirected) {
            (async () => {
                //if no connection, try to find the instance from the local dv
                if(!isServerReachable){
                    const found = await Respondent.find(redirected, 'local_id');
                    setActiveRespondent(found);
                    setRespondentUUID(found.local_id);
                    setDisplayName(found.is_anonymous ? `Anonymous Respondent ${found.local_id}` : `${found.first_name} ${found.last_name}`)
                }
                //if there is connection, try to get the respondent from the server (since it should be there)
                else{   
                    try {
                        const response = await fetchWithAuth(`/api/record/respondents/${redirected}/`);
                        const data = await response.json();
                        if (response.ok) {
                            selectRespondent(data);
                            setDisplayName(data.display_name)
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
    }, [redirected]);

    //load tasks
    useEffect(() => {
        const loadTasks = async () => {
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize()));
            setTasks(serialized);
        };
        loadTasks();
    }, [])

    //load valid respondents from the server or locally
    useEffect(() => {
        //if the user is online, search from the server
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
        //otherwise, you can only search locally
        else{
            const searchLocal= async () => {
                const localResp = await Respondent.search(search);
                setRespondents(localResp);
            }
            searchLocal();
        }
    }, [search])
    
    //helper function to determine what to do when a respondent is selected from the search
    const selectRespondent = async (r) => {
        //if the server is reachable, the user is interacting directly with the server
        //therefore, the respondent they select is from the server
        if(isServerReachable){
            try {
                const existing = await RespondentLink.find(r.id, 'server_id');
                if(existing){
                    setRespondentUUID(existing.uuid)
                }
                if (!existing) {
                    const newUUID = randomUUID();
                    await RespondentLink.save({ server_id: r.id, uuid: newUUID });
                    setRespondentUUID(newUUID);
                }
                else{

                }
                setActiveRespondent(r);
            } 
            catch (error) {
                console.error('Error selecting respondent:', error);
                alert('Could not access respondent data. Please try again later.')
            }
        }
        //otherwise, the user is offline, and are relying on local database queries
        else{
            const existing = await RespondentLink.find(r.local_id, 'uuid');
            if(existing){
                const respondent = await Respondent.find(r.local_id, 'local_id');
                setRespondentUUID(respondent.local_id);
                setActiveRespondent(respondent)
                setDisplayName(respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : 
                    `${respondent.first_name} ${respondent.last_name}`)
            }
            else{
                console.error(`Respondent ${r.local_id} not found in local DB.`);
                alert('Something went wrong. Please try again later.')
            }
        }
    };
    //redirect to create page
    function goToCreate(){
        router.push({
            pathname: 'authorized/create/CreateRespondent',
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
                        {respondents.length > 0 && isSearching && (!isServerReachable || (search !== '' && isServerReachable)) && (
                            <ScrollView style={styles.searchBox}>
                            {respondents.map((r) => (
                                <TouchableOpacity
                                    key={r.id}
                                    style={styles.bar}
                                    onPress={() => {
                                        selectRespondent(r);
                                        setIsSearching(false);
                                }}>
                                    <StyledText style={styles.searchEntry} type="darkSemiBold">{
                                    isServerReachable ? r.display_name : 
                                        (r.is_anonymous ? `Anonymous Respondent ${r.local_id}` : `${r.first_name} ${r.last_name}`)
                                    }</StyledText>
                                </TouchableOpacity>
                            ))}
                            </ScrollView>
                        )}
                        {respondents.length == 0 && isSearching && <View style={styles.searchBox}>
                            <StyledText type="darkSemiBold" style={styles.searchEntry}>No respondents match this search.</StyledText>
                        </View>}

                        </View>
                    </View>

                    {activeRespondent && !isSearching && (
                        <View>
                        <StyledText type='subtitle'>You're viewing {displayName}</StyledText>
                        <StyledText>{activeRespondent.village}, {activeRespondent.district}</StyledText>
                        <StyledButton onPress={() => setActiveRespondent(null)} label='Clear' />
                        <StyledButton onPress={() => router.push(isServerReachable ? { 
                                pathname: '/authorized/create/CreateRespondent', 
                                params: { server_id: activeRespondent.id } 
                            } : { 
                                pathname: '/authorized/create/CreateRespondent', 
                                params: { local_id: activeRespondent.local_id } 
                            })} label='Edit Respondent'
                        />
                        </View>
                    )}

                    {!activeRespondent && <StyledButton onPress={() => goToCreate()} label='Create New Respondent' />}

                </View>

                {activeRespondent && <AddInteraction respondent={activeRespondent} tasks={tasks} uuid={respondentUUID} />}
                {activeRespondent && <Interactions activeRespondent={activeRespondent} />}
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