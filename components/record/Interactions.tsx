import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import StyledText from "../styledText";

export default function Interactions({ activeRespondent }) {
    const { isServerReachable } = useConnection();
    const [interactions, setInteractions] = useState([]);

    useEffect(() => {
        if(isServerReachable){
            const getInteractions = async() => {
                if(!activeRespondent) return;
                try {
                    console.log('fetching interactions...');
                    const response = await fetchWithAuth(`/api/record/interactions/?respondent=${activeRespondent.id}`);
                    const data = await response.json();
                    setInteractions(data.results)
                } 
                catch (err) {
                    console.error('Failed to fetch respondent: ', err);
                }
            }
            getInteractions();
        }
        else{
            const getLocal = async () => {
                const localIr = await Interaction.filter({ respondent: activeRespondent.uuid });
                let serialized = await Promise.all(localIr.map(ir => ir.serialize()));
                setInteractions(serialized);
            }
            getLocal();
        }
    }, [activeRespondent]);

    return (
        <View style={styles.lastStep}>
            <StyledText type="subtitle">Previous Interactions</StyledText>
            {interactions.length > 0 ? (
                interactions.map((ir) => (<View key={ir.id} style={styles.interactionCard}>
                    <StyledText type="subtitle">{ir.task?.display_name ?? `${ir.task?.indicator?.code} : ${ir.task?.indicator?.name} (${ir.task?.organization.name}, ${ir.task?.project?.name})`}</StyledText>
                    <StyledText type="default">{new Date(ir.interaction_date).toLocaleDateString()}</StyledText>
                    
                    {ir?.subcategories?.length > 0 && ir.subcategories.map((cat) => (
                        <View key={cat.id ?? cat.subcategory} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText>
                            <StyledText>{cat?.subcategory.name}</StyledText>
                        </View>))}
                </View>))
            ) : (<StyledText>This respondent does not have any interactions on record.</StyledText>)}
        </View>
    );
}
const styles = StyleSheet.create({
    step: {
        padding: 15,
        backgroundColor: theme.colors.bonasoMain,
        marginBottom: 20,
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
        backgroundColor: theme.colors.bonasoDarkAccent,
    },
});