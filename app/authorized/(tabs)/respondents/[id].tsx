import StyledButton from "@/components/inputs/StyledButton";
import AddInteraction from "@/components/respondents/addInteraction";
import Interactions from "@/components/respondents/interactions";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { AgeRange, DisabilityType, District, KPType, Sex } from "@/database/ORM/tables/meta";
import { Respondent, RespondentLink } from "@/database/ORM/tables/respondents";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import countries from "world-countries";

export default function RespondentDetail(){
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [respondent, setRespondent] = useState(null);
    const [labels, setLabels] = useState({});
    const [localId, setLocalId] = useState(null);
    const [serverId, setServerId] = useState(null);
    
    const [refreshKey, setRefreshKey] = useState(new Date());

    useEffect(() => {
        const getLocalId = async () => {
            let sid = id.startsWith("-") ? null : id;
            let lid = id.startsWith("-") ? id.slice(1) : null;
            if(sid && !lid){
                const link = await RespondentLink.find(sid, 'server_id');
                console.log(link)
                if(link) lid = link.uuid;
                else{
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

    //redirect to create page
    function goToEdit(){
        router.push({
            pathname: 'authorized/(tabs)/respondents/forms/respondentForm',
            params: serverId ? { serverId: serverId } : {localId: localId}
        })
    }
    
    useEffect(() => {
        if (serverId) {
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
        else if (localId) {
            (async () => {
                const found = await Respondent.find(localId, 'local_id');
                const serialized = await found?.serialize();
                setRespondent(serialized);
            })();
        }
    }, [localId, serverId]);
    console.log('local', localId)
    const display = useMemo(() => {
        if(!respondent) return '';
        return serverId ? respondent.display_name : 
            respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : `${respondent.first_name} ${respondent.last_name}`;
    }, [respondent])

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

    function getCountryName(alpha2) {
        const country = countries.find(c => c.cca2 === alpha2.toUpperCase());
        return country ? country.name.common : null;
    }

    const countryList = countries.map(c => ({
        label: c.name.common,
        value: c.cca2,       // ISO 3166-1 alpha-2 code
    }));

    if(!respondent) return <View></View>
    return (
        <StyledScroll>
            <StyledButton onPress={() => router.push('/authorized/(tabs)/respondents')} label={'Back'} />
            <View>
                <StyledText type="subtitle">{display}</StyledText>
                <View style={styles.section}>
                    <StyledText type="defaultSemiBold">{labels?.sex}, {labels?.age_range}</StyledText>
                    <StyledText type="defaultSemiBold">
                        {respondent?.plot_no && respondent.plot_no + ', '}{respondent?.ward && respondent?.ward+', '}
                        {respondent?.village}, {labels?.district}, {getCountryName(respondent?.citizenship)}
                    </StyledText>
                </View>
                {respondent?.kp_status?.length > 0 && <View style={styles.section}>
                    <StyledText type="defaultSemiBold">Key Population Status</StyledText>
                    {labels?.kp_status?.map((kp) => (
                        <View key={kp} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{kp}</StyledText>
                        </View>
                    ))}
                </View>}
                {respondent?.disability_status?.length > 0 && <View style={styles.section}>
                    <StyledText type="subtitle">Disability Status</StyledText>
                    {labels?.disability_status?.map((d) => (
                        <View key={d} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{d}</StyledText>
                        </View>
                    ))}
                </View>}
                <StyledButton onPress={goToEdit} label={'Edit Details'} />
            </View>
            <View>
                <AddInteraction localId={localId} serverId={serverId} onSubmit={() => setRefreshKey(new Date())} />
            </View>
            <View>
                <Interactions localId={localId} serverId={serverId} updateTrigger={refreshKey} />
            </View>
        </StyledScroll>
    )
}

const styles = StyleSheet.create({
    section: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        margin: 10,
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