import IconInteract from "@/components/inputs/IconInteract";
import LoadingScreen from "@/components/Loading";
import AddInteraction from "@/components/respondents/addInteraction";
import Interactions from "@/components/respondents/interactions";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { AgeRange, DisabilityType, District, KPType, Sex } from "@/database/ORM/tables/meta";
import { Respondent, RespondentLink } from "@/database/ORM/tables/respondents";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import countries from "world-countries";

export default function RespondentDetail(){
    /*
    Screen that displays detailed information about a respondent. Also allows for the user to create interactions
    for the respondent and view/edit past interactions (locally or from server). 

    Takes an id param. Local IDs (i.e., not in the server) must be prefixed with a  '-'.
    */
    const router = useRouter();
    const { id } = useLocalSearchParams(); //what ID to fetch details about, if local UUID, prefix with a '-'

    const { isServerReachable } = useConnection();
    const { offlineMode } = useAuth();

    const [respondent, setRespondent] = useState(null); //stores details
    const [labels, setLabels] = useState({}); //stores meta labels for converting db values to readable labels
    const [localId, setLocalId] = useState(null); //local uuid
    const [serverId, setServerId] = useState(null); //server ID
    
    const [refreshKey, setRefreshKey] = useState(new Date()); //update trigger for when interactions are added

    //get or create a local ID for this respondent
    useEffect(() => {
        const getLocalId = async () => {
            let sid = id.startsWith("-") ? null : id;
            let lid = id.startsWith("-") ? id.slice(1) : null; //chars after '-'
            //if this respondent is not in the local DB, create a local UUID for them used when creating interactions
            if(sid && !lid){
                const link = await RespondentLink.find(sid, 'server_id');
                if(link) lid = link.uuid; //set local ID if it exists
                else{
                    //if not in local DB, create a new link that can be referenced
                    const newUUID = randomUUID();
                    await RespondentLink.save({ server_id: sid, uuid: newUUID });
                    lid = newUUID;
                }
            }
            setServerId(sid);
            setLocalId(lid)
        }
        getLocalId();
    }, [id]);

    //redirect to respondent for  for editing details
    function goToEdit(){
        router.push({
            pathname: 'authorized/(tabs)/respondents/forms/respondentForm',
            params: serverId ? { serverId: serverId } : {localId: localId} //pass serverID first so details are not stored on device
        })
    }
    
    //try to get respondent details
    useEffect(() => {
        //if online and has a serverId, try to get details directly from the server
        if (serverId && isServerReachable && !offlineMode) {
            (async () => {
                try {
                    const response = await fetchWithAuth(`/api/record/respondents/${serverId}/`);
                    const data = await response.json();
                    if (response.ok) {
                        setRespondent(data);
                    } 
                    else {
                        console.error('API error', response.status);
                    }
                } 
                catch (err) {
                    console.error('Error fetching respondent', err);
                }
            })();
        }
        //otherwise look locally
        else if (localId) {
            (async () => {
                const found = await Respondent.find(localId, 'local_id');
                const serialized = await found?.serialize();
                setRespondent(serialized);
            })();
        }
    }, [localId, serverId]);

    //helper function to get display name
    const display = useMemo(() => {
        if(!respondent) return '';
        return serverId ? respondent.display_name : 
            respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : `${respondent.first_name} ${respondent.last_name}`;
    }, [respondent])

    //convert respondent DB values to readable labels based on the locally stored respondents meta
    useEffect(() => {
        const getLabels = async() => {
            const ar = await AgeRange.getLabel(respondent?.age_range);
            const sex = await Sex.getLabel(respondent?.sex);
            const district = await District.getLabel(respondent?.district);
            const kp_status = await Promise.all(respondent?.kp_status?.map(kp => KPType.getLabel(kp.name))) ?? [];
            const disability_status = await Promise.all(respondent?.disability_status?.map(d => DisabilityType.getLabel(d.name))) ?? [];
            setLabels({
                age_range: ar,
                sex: sex,
                district: district,
                kp_status: kp_status,
                disability_status: disability_status,
            })
        }
        getLabels();
    }, [respondent]);

    //convert 2 character country code to full name
    function getCountryName(alpha2) {
        const country = countries.find(c => c.cca2 === alpha2.toUpperCase());
        return country ? country.name.common : null;
    }
    
    if(!respondent) return <LoadingScreen />
    return (
        <StyledScroll>
            <View>
                <View style={styles.section}>
                    <View style={{ display: 'flex', flexDirection: 'row'}}>
                    <StyledText type="subtitle">{display}</StyledText>
                    <IconInteract onPress={goToEdit} icon={<MaterialCommunityIcons name="account-edit" size={24} color="white" />} style={{ marginStart: 'auto', padding: 0}} />
                    </View>
                    <StyledText type="defaultSemiBold">{labels?.sex}, {labels?.age_range}</StyledText>
                    <StyledText type="defaultSemiBold">
                        {respondent?.plot_no && respondent.plot_no + ', '}{respondent?.ward && respondent?.ward+', '}
                        {respondent?.village}, {labels?.district}, {getCountryName(respondent?.citizenship)}
                    </StyledText>

                    {respondent?.kp_status?.length > 0 && <View style={{ marginTop: 5}}>
                        <StyledText type="defaultSemiBold">Key Population Status</StyledText>
                        {labels?.kp_status?.map((kp) => (
                            <View key={kp} style={styles.li}>
                                <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                <StyledText>{kp}</StyledText>
                            </View>
                        ))}
                    </View>}

                    {respondent?.disability_status?.length > 0 && <View style={{ marginTop: 5}}>
                        <StyledText type="defaultSemiBold">Disability Status</StyledText>
                        {labels?.disability_status?.map((d) => (
                            <View key={d} style={styles.li}>
                                <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                <StyledText>{d}</StyledText>
                            </View>
                        ))}
                    </View>}
                </View>
            </View>
            <View>
                <AddInteraction localId={localId} serverId={serverId} onSubmit={() => setRefreshKey(new Date())} />
            </View>
            <View>
                <Interactions localId={localId} serverId={serverId} updateTrigger={refreshKey} />
                <View style={{ padding: 30 }}></View>
            </View>
        </StyledScroll>
    )
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

});