import IndexWrapper from "@/components/IndexWrapper";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { SpecialRespondentAttribute } from "@/database/ORM/tables/meta";
import { Task } from "@/database/ORM/tables/tasks";
import syncTasks from '@/services/syncTasks';
import theme from "@/themes/themes";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

function TaskCard({ task }) {
    /*
    Card that displays information about a task and its associated indicator. 
    - task (object): The task to display information about
    */
    const [expanded, setExpanded] = useState(false);
    const [labels, setLabels] = useState({});

    //convert respondent DB values to readable labels based on the locally stored respondents meta
        useEffect(() => {
            const getLabels = async() => {
                const required_attributes = await Promise.all(task?.indicator?.required_attributes?.map(a => SpecialRespondentAttribute.getLabel(a.name))) ?? [];
                setLabels({
                    required_attributes: required_attributes
                })
            }
            getLabels();
        }, [task]);

    return(
        <View style={styles.card}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ marginBottom: 5 }}>
                {task?.indicator && <StyledText type='defaultSemiBold' >{task.display_name}</StyledText>}
            </TouchableOpacity>

            {expanded &&  <View style={{ marginBottom: 5,  }}>
                {task?.indicator?.description ? <StyledText style={{ marginBottom: 5 }}>{task.indicator.description}</StyledText> : <StyledText>No description.</StyledText>}
                {task.indicator.prerequisites.length > 0 && <View style={{borderWidth: 2, borderColor: theme.colors.warning, backgroundColor: theme.colors.warningBg, padding: 5 }}>
                    <StyledText type="defaultSemiBold" style={{ color: theme.colors.warningText }}>Prerequisite Indicators</StyledText>
                    {task.indicator.prerequisites.map((p) => (
                        <View key={p.id} style={styles.li}>
                            <StyledText style={[styles.bullet, {color: theme.colors.warningText}]}>{'\u2022'}</StyledText> 
                            <StyledText style={{ color: theme.colors.warningText }}>{`${p.indicator.code}: ${p.indicator.name}`}</StyledText>
                        </View>
                    ))}
                </View>}

                {task.indicator.subcategories.length > 0 && <View style={{ marginBottom: 5 }}>
                    <StyledText type="defaultSemiBold">Subcategories</StyledText>
                    {task.indicator.subcategories.map((cat) => (
                        <View key={cat.id} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{cat.name}</StyledText>
                        </View>
                    ))}
                </View>}

                {task.indicator.required_attributes.length > 0 && <View style={{ marginBottom: 5 }}>
                    <StyledText type="defaultSemiBold">Requires Respondent Attribute</StyledText>
                    {labels?.required_attributes.map((attr) => (
                        <View key={attr} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{attr}</StyledText>
                        </View>
                    ))}
                </View>}
                
                {task.indicator.require_numeric && <View style={{ borderWidth: 2, borderColor: theme.colors.warning, backgroundColor: theme.colors.warningBg, padding: 5}}>
                    <StyledText type="defaultSemiBold" style={{ marginBottom: 5, color: theme.colors.warningText }}>Requires a number!</StyledText>
                </View>}

            </View>}
        </View>
    )
}

export default function Tasks() {
    /*
    Component that displays a list of tasks from the local database. 
    */
    const { offlineMode } = useAuth(); //check if user has tokens
    const { isServerReachable } = useConnection();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [tasks, setTasks] = useState([]); //tasks to display

    //fetch the tasks from the db
    useEffect(() => {
        const loadTasks = async () => {
            if (isServerReachable && !offlineMode){
                await syncTasks();
            }   
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize())); //serialize the array
            if(!search || search != '') setTasks(serialized.filter((t) => (t.display_name.toLowerCase().includes(search.toLowerCase()))));
            else setTasks(serialized);
        };
        loadTasks();
    }, [isServerReachable, search]);

    const tasksToMap = tasks.slice((page-1)*10, ((page-1)*10+10));
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bonasoDarkAccent }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StyledScroll>
            <StyledText type="title">Your Tasks</StyledText>
            <IndexWrapper page={page} onPageChange={setPage} onSearchChange={setSearch} fromServer={false} entries={tasks.length}>
                {tasksToMap.length > 0 && tasksToMap.map((t) => (
                    <TaskCard key={t.id} task={t} />
                ))}
                {tasks.length === 0 && <StyledText style={styles.card} type="defaultSemiBold">No tasks yet!</StyledText>}
            </IndexWrapper>
            <View style={{ padding: 20}}></View>
        </StyledScroll>
        </KeyboardAvoidingView>
    );
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