import StyledButton from "@/components/inputs/StyledButton";
import Interactions from "@/components/record/Interactions";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { Interaction } from "@/database/ORM/tables/interactions";
import { AgeRange, DisabilityType, District, KPType, Sex } from "@/database/ORM/tables/meta";
import { Respondent } from "@/database/ORM/tables/respondents";
import theme from "@/themes/themes";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function RespondentCard({ respondent }){
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [labels, setLabels] = useState(null);
    const display = respondent.is_anonymous ? `Anonymous Respondent ${respondent.local_id}` : `${respondent.first_name} ${respondent.last_name}`;
    function goToEditResp(id){
        router.push({ 
            pathname: '/authorized/create/CreateRespondent', 
            params: { local_id: id } 
        });
    }
    useEffect(() => {
        const getLabels = async() => {
            const ar = await AgeRange.getLabel(respondent.age_range);
            const sex = await Sex.getLabel(respondent.sex);
            const district = await District.getLabel(respondent.district);
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

    return(
        <View style={styles.card}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <StyledText type="defaultSemiBold">{display}</StyledText>
            </TouchableOpacity>
            {expanded && <View>
                {respondent.is_anonymous && <StyledText>Anonymous</StyledText>}
                <StyledText>{labels?.sex}, {respondent.is_anonymous ? labels?.age_range : respondent.dob}</StyledText>
                {respondent.plot_no && <StyledText>Plot No: {respondent.plot_no}</StyledText>}
                {respondent.ward && <StyledText>Plot No: {respondent.ward}</StyledText>}
                <StyledText>{respondent.village}, {labels?.district}, {respondent.citizenship}</StyledText>
                {respondent.kp_status && <View>
                    <StyledText type="subtitle">Key Population Status</StyledText>
                    {labels?.kp_status?.map((kp) => (
                        <View key={kp} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{kp}</StyledText>
                        </View>
                    ))}
                </View>}
                {respondent.disability_status && <View>
                    <StyledText type="subtitle">Disability Status</StyledText>
                    {labels?.disability_status?.map((d) => (
                        <View key={d} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{d}</StyledText>
                        </View>
                    ))}
                </View>}
                {respondent.hiv_positive && <StyledText>HIV Positive since {respondent.date_positive}</StyledText>}
                {respondent.is_pregnant && (respondent.term_ended ?  <StyledText>Pregnant from {respondent.term_began} to {respondent.term_ended}</StyledText> :
                    <StyledText>Pregnant since {respondent.term_began}</StyledText>)}
                <StyledButton key={respondent.local_id} onPress={() => goToEditResp(respondent.local_id)} label={'Edit Details'} />
                <Interactions activeRespondent={respondent} fromLocal={true} />
            </View>}
        </View>
    )
}


export default function Unsynced(){
    const router = useRouter();
    const [respondents, setRespondents] = useState([]);
    const [interactions, setInteractions] = useState([]);
    
    useEffect(() => {
        const loadData = async() => {
            const rInstances = await Respondent.all()
            const rSerialized = await Promise.all(rInstances.map(r => r.serialize()));
            setRespondents(rSerialized);

            const iInstances = await Interaction.all()
            const iSerialized = await Promise.all(iInstances.map(i => i.serialize()));
            setInteractions(iSerialized);
        }
        loadData();
    }, []);

    return(
        <StyledScroll>
            <View>
                <StyledText type="subtitle">Respondents</StyledText>
                {respondents.map(r => (
                    <RespondentCard key={r.local_id} respondent={r} />
                ))}
            </View>
        </StyledScroll>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        flex: 1,
        justifyContent: 'center',
        marginTop: 10,
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