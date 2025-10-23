import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
    const [expanded, setExpanded] = useState(false);
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
    async function handleDelete(id) {
        await Interaction.delete(id);
        alert('Interaction Deleted!')
    }

    //helper to build a list of responses. Will combine multiselects stored separtely
    const cleanedResponses = useMemo(() => {
        const seen = new Set();
        const consolidated = [];

        ir.responses.forEach((r) => {
            // Check if this indicator was already handled
            let existing = consolidated.find(i => i.indicator.id === r.indicator.id);

            if (r.indicator.type === 'multi' && !r.response_none) {
                if (existing) {
                    // Combine response options
                    existing.response_option = [
                        ...(Array.isArray(existing.response_option) ? existing.response_option : [existing.response_option]),
                        r.response_option
                    ];
                } else {
                    // First occurrence — initialize as array
                    consolidated.push({
                        ...r,
                        response_option: [r.response_option]
                    });
                    seen.add(r.indicator.id);
                }
            } 
            else if(r.indicator.type == 'multint'){
                if(existing){
                    //append option/value as a single string
                    existing.response_value.push(`${r.response_option.name} - ${[null, ''].includes(r.response_value) ? '0' : r.response_value}`)
                }
                else {
                    // First occurrence — initialize as array
                    consolidated.push({
                        ...r,
                        response_value: [`${r.response_option.name} - ${[null, ''].includes(r.response_value) ? '0' : r.response_value}`]
                    });
                    seen.add(r.indicator.id);
                }
            }
            else {
                if (existing) {
                    //this shouldn't happen
                    console.warn('POSSIBLY SUSPECT RESPONSE DATA!');
                    return;
                }
                consolidated.push({ ...r });
                seen.add(r.indicator.id);
            }
        });

        return consolidated;
    }, [ir]);

    return(
        <View key={ir.id} style={fromServer ? styles.interactionCard : styles.unuploadedCard}>
            {/* Alter style if the interaction is not uploaded so the user knows */}
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <StyledText style={{ marginBottom: 10 }} type="defaultSemiBold">{ir.task?.display_name}</StyledText>
                <StyledText style={{ marginBottom: 10 }}>{prettyDates(ir.interaction_date)} at {ir.interaction_location}</StyledText>
            </TouchableOpacity>
            {expanded && <View>
                {cleanedResponses.sort((a, b) => (fromServer ? a.indicator.order - b.indicator.order : a.indicator.indicator_order - b.indicator.indicator_order)).map(r => {
                    const rDate = r.response_date != ir.interaction_date ? `(${prettyDates(r.response_date)})` : '';
                    const rLoc = r.response_location != ir.interaction_location ? `(${r.response_location})` : '';
                    const app = rDate + ' ' + rLoc;
                    const order = fromServer ? r?.indicator?.order + 1 : r?.indicator?.indicator_order + 1
                    if(r.response_none){
                        return(
                            <View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 10, margin: 10}}>
                                <StyledText type="defaultSemiBold">{order}. {r.indicator.name}</StyledText>
                                <View style={styles.ul}>
                                <View style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                    <StyledText>"None Selected" {app}</StyledText>
                                </View>
                                </View>
                            </View>
                        )
                    }
                    else if(r.indicator.type == 'multi'){
                        return(<View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 10, margin: 10}}>
                            <StyledText type="defaultSemiBold">{order}. {r.indicator.name}</StyledText>
                            <View style={styles.ul}>
                                {r.response_option.map((o) => (<View style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                    <StyledText>{o.name} {app}</StyledText>
                                </View>))}
                            </View>
                        </View>)
                    }
                    else if(r.indicator.type == 'multint'){
                        return(<View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 10, margin: 10}}>
                            <StyledText type="defaultSemiBold">{order}. {r.indicator.name}</StyledText>
                             <View style={styles.ul}>
                                {r.response_value.map((v) => (<View style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                    <StyledText>{v} {app}</StyledText>
                                </View>))}
                            </View>
                        </View>)
                    }
                    else{
                        let val = '';
                        if(r.indicator.type == 'single') val = r.response_option?.name;
                        else if(r.indicator.type == 'boolean') val = r.response_boolean ? 'Yes' : 'No';
                        else val = r.response_value;
                        return(<View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 10, margin: 10}}>
                            <StyledText type="defaultSemiBold">{order}. {r.indicator.name}</StyledText>
                            <View style={styles.ul}>
                            <View style={styles.li}>
                                <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                <StyledText>"{val}" {app}</StyledText>
                            </View>
                            </View>

                        </View>)
                    }
                })}
                {ir.comments && <View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 10, margin: 10}}>
                     <StyledText type="defaultSemiBold">Comments:</StyledText>
                     <StyledText>{ir.comments}</StyledText>
                </View>}
            </View>}
            
            <View style={{ display: 'flex', flexDirection: 'row'}}>
                <IconInteract onPress={() => goToEditIr(ir.id)} icon={<MaterialIcons name="edit" size={24} color="white" />} style={{marginStart: 'auto'}}/>
                {/* Consider deleting this delete function when moving out of dev */}
                {!fromServer && <IconInteract onPress={() => handleDelete(ir.id)} icon={<MaterialIcons name="delete" size={24} color="white" />} style={{marginStart: 'auto'}}/>}
            </View>
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