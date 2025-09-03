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
import IconInteract from "../inputs/IconInteract";
import StyledButton from "../inputs/StyledButton";
import LoadingSpinner from "../LoadingSpinner";
import StyledText from '../styledText';


export default function Interactions({ localId, serverId=null, updateTrigger=null }) {
    /*
    Component that displays a list of a respondent's interactions. 
    - localId (string/uuid): the local uuid for this respondent
    - serverId (integer, optional): if connected to the internet, the server ID of this respondent for getting/writing to the server
    - updateTrigger (date, optional): trigger that will recall the getInteractions function when interactions are added
    */
    const router = useRouter();
    const { offlineMode } = useAuth();
    const { isServerReachable } = useConnection();

    const [interactions, setInteractions] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);


    //fetch array of interactions        
    useEffect(() => {
        //if user is connected to the internet and a serverId exists, try to fetch interactions form the server
        setLoading(true);

        if(isServerReachable && serverId && !offlineMode){
            const getInteractions = async() => {
                try {
                    console.log('fetching interactions...');
                    console.log(loading)
                    const response = await fetchWithAuth(`/api/record/interactions/?page=${page}&respondent=${serverId}`);
                    const data = await response.json();
                    setInteractions(data.results)
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
        //otherwise if offline, fetch locally
        const getLocal = async () => {
            const localIr = await Interaction.filter({ respondent_uuid: localId });
            let serialized = await Promise.all(localIr.map(ir => ir.serialize()));
            setInteractions(serialized);
        }
        getLocal();
    }, [localId, serverId, updateTrigger, page]);
    
    //router push to go to interaction edit screen. Pass the server id if available and the local id if not
    function goToEditIr(id){
        router.push(serverId ? { 
            pathname: '/authorized/(tabs)/respondents/forms/interactionForm', 
            params: { serverId: id } 
        } : { 
            pathname: '/authorized/(tabs)/respondents/forms/interactionForm', 
            params: { localId: id } 
        } );
    }

    if(loading) return <LoadingSpinner label="previous interactions" />

    return (
        <View style={styles.section}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
                <StyledText type="subtitle">Previous Interactions</StyledText>
                {expanded ? <FontAwesome name="arrow-circle-o-up" size={24} color="white" style={{marginLeft: 'auto'}}/> : <FontAwesome name="arrow-circle-o-down" size={24} color="white" style={{marginLeft: 'auto'}}/>}
            </TouchableOpacity>

            {expanded && <View>{interactions.length > 0 ? 
                interactions.map((ir) => (<View key={ir.id} style={styles.interactionCard}>
                    <StyledText style={{ marginBottom: 10 }} type="defaultSemiBold">{isServerReachable ? ir.task?.display_name : `${ir.task?.indicator?.code} : ${ir.task?.indicator?.name} (${ir.task?.organization?.name}, ${ir.task?.project?.name})`}</StyledText>
                    <StyledText style={{ marginBottom: 10 }}>{prettyDates(ir.interaction_date)} at {ir.interaction_location}</StyledText>
                    
                    {ir?.subcategories?.length > 0 && <View style={{ marginBottom: 10 }}> 
                        <StyledText type="defaultSemiBold">Subcategories</StyledText>
                        {ir.subcategories.map((cat) => (
                            <View key={cat.id ?? cat.subcategory} style={styles.li}>
                                <StyledText style={styles.bullet}>{'\u2022'}</StyledText>
                                <StyledText>{cat?.subcategory?.name} {cat?.numeric_component && `(${cat.numeric_component})`}</StyledText>
                            </View>
                        ))}
                    </View>}
                    {ir?.numeric_component && <View style={{ marginBottom: 10 }}>
                        <StyledText type="defaultSemiBold">Amount: {ir.numeric_component}</StyledText>
                    </View>}
                    {ir?.comments && ir?.comments != '' && <View>
                        <StyledText type="defaultSemiBold">Comments:</StyledText>
                        <StyledText>{ir.comments}</StyledText>
                    </View>}
                    <IconInteract onPress={() => goToEditIr(ir.id)} icon={<MaterialIcons name="edit" size={24} color="white" />} style={{marginStart: 'auto'}}/>
                </View>))
             : <StyledText>This respondent does not have any interactions on record.</StyledText>}
            </View>}

             {interactions.length > 20 && <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', marginBottom: 30}}>
                <StyledButton onPress={() => setPage(prev => prev - 1)} label='Previous' disabled={page == 1} />
                <View style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', marginStart: 20, marginEnd: 20}}>
                    <StyledText>Page</StyledText>
                    <StyledText>{page} of {Math.ceil(interactions.length/20)}</StyledText>
                </View>
                <StyledButton onPress={() => setPage(prev => prev + 1)} label='Next' disabled={page == Math.ceil(interactions.length/20)} />
            </View>}
            
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
});