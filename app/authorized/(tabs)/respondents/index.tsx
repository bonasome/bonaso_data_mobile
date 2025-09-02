import IconInteract from "@/components/inputs/IconInteract";
import Input from "@/components/inputs/Input";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Respondent } from "@/database/ORM/tables/respondents";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";


function RespondentCard({ respondent, fromServer }){
    /*
    Simple card that displays a respondent's name and when clicked directs to their detail page.
    - respondent (object): inforamation about the respondent to display
    - fromServer (boolean): flag to determine if this respondent was loaded from the server or from the local device
    */

    //determine name to display (will vary based on whether this is from the server)
    const display = fromServer ? respondent.display_name : 
        respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : `${respondent.first_name} ${respondent.last_name}`;
    //determine what id to direct the user to when clicked (local ids will use a '-' prefix)
    const param = fromServer ? respondent?.id : `-${respondent?.local_id}`;
    return (
        <View>
            <TouchableOpacity onPress={() => router.push(`/authorized/(tabs)/respondents/${param}`)} style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 10, margin: 10 }}>
                <StyledText type="defaultSemiBold">{display}</StyledText>
            </TouchableOpacity>
        </View>
    )
}

export default function Respondents(){
    /*
    Index component that will display a paginated list of respondents
    */
   //connection context
    const { offlineMode} = useAuth();
    const { isServerReachable } = useConnection();

    //respondents (seperate locally loaded from server loaded)
    const [serverRespondents, setServerRespondents] = useState([]);
    const [localRespondents, setLocalRespondents] = useState([]);

    //search/page for viewing
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    //fetch respondents on load or search change
    useEffect(() => {
        //if the user is online, search from the server
        if(isServerReachable && !offlineMode){
            const searchRespondents = async() => {
                try {
                    const response = await fetchWithAuth(`/api/record/respondents/?search=${search}&page=${page}`);
                    const data = await response.json();
                    if (response.ok) {
                        setServerRespondents(data.results);
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

        //simultaneously search the local device
        const searchLocal= async () => {
            const localResp = await Respondent.search(search);
            setLocalRespondents(localResp);
        }
        searchLocal();
    }, [search]);


    return(
        <View style={{ flex: 1}}>
            <View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 25}}>
                <StyledText type="title">Respondents</StyledText>
                <View style={{ display: 'flex', flexDirection: 'row'}}>
                    <FontAwesome5 name="search" size={24} color="white" style={{ marginTop: 'auto', marginBottom: 'auto', marginRight: 20}} />
                    <Input value={search} onChange={(val) => setSearch(val)} placeholder={'try searching a name...'} style={{ width: '65%'}} />
                    <IconInteract onPress={() => router.push(`/authorized/(tabs)/respondents/forms/respondentForm`)} 
                        icon={<FontAwesome name="user-plus" size={24} color="white" />} 
                        style={{ padding: 15, marginStart: 'auto', marginTop: 25, marginBottom: 10, backgroundColor: theme.colors.bonasoLightAccent }} 
                    />
                </View>
            </View>
        <StyledScroll>
            {localRespondents.length > 0 && <View>
                <StyledText type="subtitle">Not Uploaded!</StyledText>
                {localRespondents.map(r => (<RespondentCard key={r.local_id} respondent={r} fromServer={false} />))}
            </View>}
            {(isServerReachable && !offlineMode) && <View>
                {serverRespondents.length > 0 ? 
                    serverRespondents.map(r => (<RespondentCard key={r.id} respondent={r} fromServer={true}/>)) :
                    <StyledText type="defaultSemiBold">No respondents found...</StyledText>}
            </View>}
            <View style={{ padding: 15 }}></View>
        </StyledScroll>
        </View>
    )
}