import IconInteract from "@/components/inputs/IconInteract";
import LoadingScreen from "@/components/Loading";
import Interactions from "@/components/respondents/interactions";
import PregnancyModal from "@/components/respondents/pregnancyModal";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { AgeRange, DisabilityType, District, KPType, Sex, SpecialRespondentAttribute } from "@/database/ORM/tables/meta";
import { Pregnancy, Respondent, RespondentLink } from "@/database/ORM/tables/respondents";
import fetchWithAuth from "@/services/fetchWithAuth";
import prettyDates from "@/services/prettyDates";
import theme from "@/themes/themes";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import countries from "world-countries";
import Tasks from "../tasks";


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
    
    const [editingPreg, setEditingPreg] = useState(false); //pregnancy object currently being created/edited
    const [targetPreg, setTargetPreg] = useState(null);

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
    const getRespondent = async() => {
        if (serverId && isServerReachable && !offlineMode) {
            try {
                console.log('fetching respondent details...')
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
        }
        //otherwise look locally
        else if (localId) {
            const found = await Respondent.find(localId, 'local_id');
            const serialized = await found?.serialize();
            setRespondent(serialized);
        }
    }

    useEffect(() => {
        //if online and has a serverId, try to get details directly from the server
        const initialLoad = async() => {
            await getRespondent();
        }
        initialLoad();
    }, [id, localId, serverId]);

    //helper function to get display name
    const display = useMemo(() => {
        if(!respondent) return '';
        return serverId ? respondent.display_name : 
            respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : `${respondent.first_name} ${respondent.last_name}`;
    }, [respondent])

    //convert respondent DB values to readable labels based on the locally stored respondents meta
    useEffect(() => {
        if (!respondent) return;
        const attrs = respondent?.special_attribute?.filter(attr => (!['PLWHIV', 'KP', 'PWD'].includes(attr.name))) ?? [];
        const getLabels = async() => {
            const ar = await AgeRange.getLabel(respondent?.age_range);
            const sex = await Sex.getLabel(respondent?.sex);
            const district = await District.getLabel(respondent?.district);
            const kp_status = await Promise.all(respondent?.kp_status?.map(kp => KPType.getLabel(kp.name))) ?? [];
            const disability_status = await Promise.all(respondent?.disability_status?.map(d => DisabilityType.getLabel(d.name))) ?? [];
            const special_attribute = await Promise.all(attrs.map(a => SpecialRespondentAttribute.getLabel(a.name))) ?? [];
            setLabels({
                age_range: ar,
                sex: sex,
                district: district,
                kp_status: kp_status,
                disability_status: disability_status,
                special_attribute: special_attribute,
            })
        }
        getLabels();
    }, [respondent]);

    //convert 2 character country code to full name
    function getCountryName(alpha2) {
        const country = countries.find(c => c.cca2 === alpha2.toUpperCase());
        return country ? country.name.common : null;
    }

    //handle the user creating, editing, or deleting a user pregnancy
    const editPregnancy = async (data) => {
        try{
            console.log('submitting data...');
            //respondent was pulled from server and still connected, upload directly to avoid unnecesssary storage on device
            if(serverId && isServerReachable){
                //send data as a patch. The pregnancy modal should provide correct data for editing/creating
                //it will also send the correct data for deleting, which the server will do if a term_began is null while an existing id is provided
                try{
                    console.log('uploading respondent', data);
                    const response = await fetchWithAuth(`/api/record/respondents/${serverId}/`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    const returnData = await response.json();
                    if(response.ok){
                        alert('Pregnancy status updated!');
                        getRespondent();
                    }
                }
                catch(err){
                    console.error(err);
                }
            }
            //if connection is lost in the middle of update, alert the user
            else if(serverId && !isServerReachable){
                alert('You are currently offline. Please reconnect to make edits.');
                return;
            }
            //if respondent is not in server, create or update the local record
            else{
                //the server will treat a null term_began with an id as a delete
                //so handle the same situation locally
                if(!data.pregnancy_data[0]?.term_began){
                    await Pregnancy.delete(data?.pregnancy_data[0]?.id);
                    alert('removed');
                    getRespondent();
                    return;
                }
                let pregData = data.pregnancy_data[0]
                pregData.respondent = localId;
                let result = await Pregnancy.save(pregData); //save locally first
                getRespondent();
                alert('Pregnancy status updated!');
            }
        }
        catch(err){
            console.error(err);
        } 
    }

    if(!respondent) return <LoadingScreen />
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bonasoDarkAccent }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StyledScroll>
            {editingPreg && <PregnancyModal onSave={(data) => editPregnancy(data)} onCancel={() => {setEditingPreg(false); setTargetPreg(null)}} existing={targetPreg} />}
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

                    {respondent?.special_attribute?.filter(attr => (!['PLWHIV', 'KP', 'PWD'].includes(attr.name)))?.length > 0 && <View style={{ marginTop: 5}}>
                        <StyledText type="defaultSemiBold">Special Attributes</StyledText>
                        {labels?.special_attribute?.map((a) => (
                            <View key={a} style={styles.li}>
                                <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                <StyledText>{a}</StyledText>
                            </View>
                        ))}
                    </View>}

                    {respondent?.hiv_status?.hiv_positive && <View>
                        <StyledText>HIV Positive since {prettyDates(respondent?.hiv_status?.date_positive)}</StyledText>
                    </View>}
                    
                    <StyledText type="defaultSemiBold">Pregnancies</StyledText>
                    <IconInteract icon={<Ionicons name="add-circle" size={24} color="white" />} onPress={() => setEditingPreg(true)} label={'Add new pregnancy'}/>
                    {respondent?.pregnancies?.length > 0 && <View>
                        {respondent?.pregnancies.map((p) => (<View key={p.id} style={{ display: 'flex', flexDirection: 'row', maxWidth: '75%', padding: 4, backgroundColor: theme.colors.bonasoMain }}>
                            <StyledText>
                                {p.term_ended ? `Pregnant from ${prettyDates(p.term_began)} to ${prettyDates(p.term_ended)}` : 
                            `Pregnant since ${prettyDates(p.term_began)}`}
                            </StyledText>
                            <IconInteract onPress={() => {setEditingPreg(true); setTargetPreg(p)}} icon={<FontAwesome6 name="pencil" size={24} color="white" />} style={{ marginStart: 12 }}/>
                        </View>))}
                    </View>}
                </View>
            </View>
            <View>
                <Tasks serverRespondent={serverId} localRespondent={localId} forAssessment={true}/>
            </View>
            <View>
                <Interactions localId={localId} serverId={serverId} />
            </View>

            <View style={{ padding: 40}}></View>
        </StyledScroll>
        </KeyboardAvoidingView>
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
    }
})