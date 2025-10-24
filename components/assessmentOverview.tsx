import cleanLabels from "@/services/cleanLabels";
import theme from "@/themes/themes";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Modal, StyleSheet, View } from "react-native";
import IconInteract from "./inputs/IconInteract";
import StyledButton from "./inputs/StyledButton";
import StyledScroll from "./styledScroll";
import StyledText from "./styledText";

const TYPE_MAP = {
    'multi': 'Multiselect',
    'single': 'Single Select',
    'multint': 'Numbers by Category',
    'integer': 'Number',
    'text': 'Open Answer',
    'boolean': 'Yes/No',
}

export default function AssessmentOverview({ assessment, onClose }){

    return(
        <Modal>
        <StyledScroll style={{ padding: 20 }}>
            <IconInteract icon={<FontAwesome name="close" size={24} color="white" />} onPress={onClose} style={{ marginStart: 'auto'}}/>
            <StyledText type="title">Viewing Assessment {assessment.name}</StyledText>
            {assessment.description && <StyledText>{assessment.description}</StyledText>}
            <View style={{ padding: 20, marginTop: 20, backgroundColor: theme.colors.bonasoUberDarkAccent }}>
            {assessment.indicators.sort((a, b) => (a.indicator_order - b.indicator_order)).map((ind) => (<View key={ind.id} style={{ borderBottomColor: 'white', borderBottomWidth: 2, marginBottom: 20 }}>
                    <StyledText type="subtitle">{ind.indicator_order+1}. {ind.name}</StyledText>
                    {ind.description && ind.description != '' && <StyledText>Description: {ind.description}</StyledText>}
                    {TYPE_MAP?.[ind.type] && <StyledText>Type: {TYPE_MAP[ind.type]}</StyledText>}
                    {ind.options && ind.options.length > 0 && <View>
                        <StyledText type="defaultSemiBold">Options</StyledText>
                        <View style={styles.ul}>
                                {ind.options.map((o) => (<View style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                    <StyledText>{o.name}</StyledText>
                                </View>))}
                                {ind.allow_none && <View style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText>
                                    <StyledText>None of the Above</StyledText> 
                                </View>}
                        </View>
                    </View>}

                    {ind.logic && ind.logic.conditions && ind.logic.conditions.length > 0 && <View style={{ marginTop: 10}}>
                        <StyledText type="defaultSemiBold">Visible When:</StyledText>
                        <View style={styles.ul}>
                            {ind?.logic?.conditions?.map((c) => {
                                let source = ''
                                let val = '';
                                let ind = null;
                                
                                if(c.source_type == 'assessment') ind = assessment.indicators.find((ind) => (ind.id == c.source_indicator))
                                let operator = c.condition_type ? 'Is' : c.operator
                                if(c.condition_type) val =  c.condition_type
                                else if(ind && ['multi', 'single'].includes(ind.type)) val = ind.options.find((o) => (o.id == c.value_option)).name;
                                else if(ind && ['boolean'].includes(ind.type)) val = c.value_boolean ? 'Yes' : 'No'
                                else val = c.value_text;
                                if(c.source_type == 'respondent') source = `Respondent's ${c.respondent_field}`;
                                else if(c.source_type == 'assessment') source = `${ind.indicator_order+1}. ${ind.name}`
                                return(
                                    <View style={styles.li}>
                                        <StyledText style={styles.bullet}>{'\u2022'}</StyledText>
                                        <StyledText>{source} {operator} "{cleanLabels(val)}"</StyledText>
                                    </View>
                                )
                            })}
                        </View>
                    </View>}
                </View>))}
                </View>
                <StyledButton onPress={onClose} label={'Close'} />
                <View style={{ padding: 30}}></View>
        </StyledScroll>
        </Modal>
    )
}

//styles
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