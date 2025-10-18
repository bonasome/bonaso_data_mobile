import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import prettyDates from '../../services/prettyDates';
import IndexWrapper from "../IndexWrapper";
import IconInteract from "../inputs/IconInteract";
import LoadingSpinner from "../LoadingSpinner";
import StyledText from '../styledText';


function InteractionCard({ ir, fromServer=false }){
    /*
    Card that displays information about an interaction. 
    - ir (object): the information to display
    - fromServer(boolean, optional): did this data come form the server
    */

    const router = useRouter();
    const { isServerReachable } = useConnection();

    //router push to go to interaction edit screen. Pass the server id if available and the local id if not
    function goToEditIr(id){
        router.push(fromServer ? { 
            pathname: '/authorized/(tabs)/respondents/forms/interactionForm', 
            params: { serverIrId: id, taskId: ir.task.id } 
        } : { 
            pathname: '/authorized/(tabs)/respondents/forms/interactionForm', 
            params: { localIrId: id, localRespondentId: ir.respondent_uuid, taskId: ir.task.id } 
        } );
    }

    return(
        <View key={ir.id} style={fromServer ? styles.interactionCard : styles.unuploadedCard}>
            {/* Alter style if the interaction is not uploaded so the user knows */}
            <StyledText style={{ marginBottom: 10 }} type="defaultSemiBold">{ir.task?.display_name}</StyledText>
            <StyledText style={{ marginBottom: 10 }}>{prettyDates(ir.interaction_date)} at {ir.interaction_location}</StyledText>
            <IconInteract onPress={() => goToEditIr(ir.id)} icon={<MaterialIcons name="edit" size={24} color="white" />} style={{marginStart: 'auto'}}/>
        </View>
    )
}

export default function Interactions({ localId, serverId=null, updateTrigger=null }) {
    /*
    Component that displays a list of a respondent's interactions. 
    - localId (string/uuid): the local uuid for this respondent
    - serverId (integer, optional): if connected to the internet, the server ID of this respondent for getting/writing to the server
    - updateTrigger (date, optional): trigger that will recall the getInteractions function when interactions are added
    */
    const { offlineMode } = useAuth();
    const { isServerReachable } = useConnection();

    const [interactions, setInteractions] = useState([]);
    const [localInteractions, setLocalInteractions] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);


    //fetch array of interactions        
    useEffect(() => {
        //if user is connected to the internet and a serverId exists, try to fetch interactions form the server
        if(isServerReachable && serverId && !offlineMode){
            const getInteractions = async() => {
                try {
                    console.log('fetching interactions...');
                    const response = await fetchWithAuth(`/api/record/interactions/?page=${page}&search=${search}&respondent=${serverId}`);
                    const data = await response.json();
                    setInteractions(data.results);
                    setEntries(data.count);
                } 
                catch (err) {
                    console.error('Failed to fetch respondent: ', err);
                }
                finally{ 
                    setLoading(false);
                }
            }
            getInteractions();
        }
        //fetch local interactions as well (for user offline or edge case where upload failed)
        const getLocal = async () => {
            const localIr = await Interaction.filter({ respondent_uuid: localId });
            let serialized = await Promise.all(localIr.map(ir => ir.serialize()));
            setEntries(serialized.length)
            if(search != '') setLocalInteractions(serialized.filter(ir => (ir?.task.display_name.toLowerCase().includes(search.toLowerCase()))));
            else setLocalInteractions(serialized);
        }
        getLocal();
    }, [localId, serverId, updateTrigger, page, search]);


    if(loading) return <LoadingSpinner label="previous interactions" />

    return (
        <View style={styles.section}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
                <StyledText type="subtitle">Previous Interactions</StyledText>
                {expanded ? <FontAwesome name="arrow-circle-o-up" size={24} color="white" style={{marginLeft: 'auto'}}/> : <FontAwesome name="arrow-circle-o-down" size={24} color="white" style={{marginLeft: 'auto'}}/>}
            </TouchableOpacity>

            {expanded && <IndexWrapper page={page} onPageChange={setPage} onSearchChange={setSearch} entries={entries} fromServer={serverId ? true : false}>
                {localInteractions.length > 0 && <View>
                    {localInteractions.map((ir) => (<InteractionCard key={ir.id} ir={ir} fromServer={false} />))}
                </View>}
                
                <View>{interactions.length > 0 && 
                    interactions.map((ir) => (<InteractionCard  key={ir.id} ir={ir} fromServer={true} />))}
                </View>
                {interactions.length == 0 && localInteractions.length == 0 && <StyledText>This respondent does not have any interactions on record.</StyledText>}
            </IndexWrapper>}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
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
    lastStep: {
        padding: 15,
        backgroundColor: theme.colors.bonasoMain,
        marginBottom: 50,
    },
    interactionCard:{
        marginTop: 10,
        padding: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.bonasoMain,
    },
    unuploadedCard:{
        marginTop: 10,
        padding: 10,
        marginBottom: 10,
        borderColor: theme.colors.warningBg,
        borderWidth: 2,
        backgroundColor: theme.colors.warning,
    },
});