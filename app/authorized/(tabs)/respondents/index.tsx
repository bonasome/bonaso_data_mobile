import Input from "@/components/inputs/Input";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Respondent } from "@/database/ORM/tables/respondents";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function RespondentCard({ respondent, fromServer }){

    const display = fromServer ? respondent.display_name : 
        respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : `${respondent.first_name} ${respondent.last_name}`;
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
    const { offlineMode} = useAuth();
    const { isServerReachable } = useConnection();

    const [serverRespondents, setServerRespondents] = useState([]);
    const [localRespondents, setLocalRespondents] = useState([]);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

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
        <StyledScroll>
            <StyledText type="title">Respondents</StyledText>
            <Input value={search} onChange={(val) => setSearch(val)} label='Search' placeholder={'try searching a name...'} />
            {localRespondents.length == 0 && serverRespondents.length == 0 &&
            <StyledText>No respondents yet. Make one!</StyledText>}
            {localRespondents.length > 0 && <View>
                <StyledText type="subtitle">Not Uploaded</StyledText>
                {localRespondents.map(r => (<RespondentCard respondent={r} fromServer={false} />))}
            </View>}
            {isServerReachable && <View>
                <StyledText type="subtitle">From Server</StyledText>
                {serverRespondents.length > 0 ? 
                    serverRespondents.map(r => (<RespondentCard respondent={r} fromServer={true}/>)) :
                    <StyledText>No respondents found.</StyledText>}
            </View>}
        </StyledScroll>
    )
}
const styles = StyleSheet.create({
    step: {
        padding: 15,
        backgroundColor: theme.colors.bonasoMain,
        marginBottom: 20,
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
    bar:{
        color: theme.colors.bonasoUberDarkAccent
    },


});