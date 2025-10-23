import IndexWrapper from "@/components/IndexWrapper";
import SimplePicker from "@/components/inputs/SimplePicker";
import StyledButton from "@/components/inputs/StyledButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Organization, Project, Task } from "@/database/ORM/tables/tasks";
import syncTasks from '@/services/syncTasks';
import theme from "@/themes/themes";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from "react-native";


function TaskCard({ task, localRespondent=null, serverRespondent=null }) {
    /*
    Card that displays information about a task and its associated indicator. 
    - task (object): The task to display information about
    */
   const router= useRouter();
    const [expanded, setExpanded] = useState(false);
    const [labels, setLabels] = useState({});

    if(!task) return <LoadingSpinner />
    return(
        <View style={styles.card}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ marginBottom: 5 }}>
                {task?.assessment && <StyledText type='defaultSemiBold' >{task.display_name}</StyledText>}
            </TouchableOpacity>

            {expanded &&  <View style={{ marginBottom: 5, marginTop: 10 }}>
                {task?.assessment?.description ? <StyledText style={{ marginBottom: 5 }}>{task.indicator.description}</StyledText> : <StyledText>No description.</StyledText>}
                {task.assessment.indicators.sort((a, b) => (a.indicator_order-b.indicator_order)).map((ind) => (
                    <View>
                        <StyledText>{ind.indicator_order + 1}. {ind.name}</StyledText>
                    </View>
                ))}            
            </View>}
            {(localRespondent || serverRespondent) && <StyledButton onPress={() => router.push({
                    pathname: '/authorized/(tabs)/respondents/forms/interactionForm',
                    params: { taskId: task.id, respondentId: serverRespondent, localRespondentId: localRespondent}
                })} label={`Start ${task?.assessment?.name}`} />}
        </View>
    )
}

export default function Tasks({ localRespondent=null, serverRespondent=null, forAssessment=false }) {
    /*
    Component that displays a list of tasks from the local database. 
    */
    const { offlineMode } = useAuth(); //check if user has tokens
    const { isServerReachable } = useConnection();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(true);
    const [tasks, setTasks] = useState([]); //tasks to display

    const [org, setOrg] = useState(null);
    const [project, setProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [orgs, setOrgs] = useState([])
    //fetch the tasks from the db
    
    useEffect(() => {
        const loadTasks = async () => {
            if (isServerReachable && !offlineMode){
                await syncTasks();
            }   
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize())); //serialize the array
            let filtered = serialized;
            console.log(org)
            if(org) filtered = filtered.filter(t => (t.organization.id == org));
            if(project) filtered = filtered.filter(t => (t.project.id == project));
            if(!search || search != '') filtered = filtered.filter((t) => (t.display_name.toLowerCase().includes(search.toLowerCase())));
            setTasks(filtered);
        };
        loadTasks();
    }, [isServerReachable, search, org, project]);
    

    useEffect(() => {
        const loadProjects = async() => {
            const myProj = await Project.all();
            let serialized = await Promise.all(myProj.map(p => p.serialize()));
            setProjects(serialized.map((p) => ({value: p.id, label: p.name})))
        }
        loadProjects();
        const loadOrgs = async() => {
            const myOrgs= await Organization.all();
            let serialized = await Promise.all(myOrgs.map(o => o.serialize()));
            setOrgs(serialized.map((o) => ({value: o.id, label: o.name})))
        }
        loadOrgs();
    }, []);

    const tasksToMap = tasks.slice((page-1)*10, ((page-1)*10+10));
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bonasoDarkAccent }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StyledScroll style={forAssessment ? { margin: 0, padding: 0} : {}}>
            <View style={forAssessment ? {backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 20} : {}}>
                {!forAssessment && <StyledText type="title">Your Tasks</StyledText>}
                {forAssessment && <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
                    <StyledText type="subtitle">Start Assessment</StyledText>
                    {expanded ? <FontAwesome name="arrow-circle-o-up" size={24} color="white" style={{marginLeft: 'auto'}}/> : <FontAwesome name="arrow-circle-o-down" size={24} color="white" style={{marginLeft: 'auto'}}/>}
                </TouchableOpacity>}
                <SimplePicker onChange={(o) => setOrg(o)} options={orgs} name={'organization'} label={'Select an Organization'} value={org}/>
                <SimplePicker onChange={(p) => setProject(p)} options={projects} name={'project'} label={'Select a Project'} value={project} />
                {expanded && <IndexWrapper page={page} onPageChange={setPage} onSearchChange={setSearch} fromServer={false} entries={tasks.length}>
                    <StyledText style={{ marginTop: 5, marginBottom: 5, fontStyle: 'italic' }} type="defaultSemiBold">Click on a task to reveal more information.</StyledText>
                    {tasksToMap.length > 0 && tasksToMap.map((t) => (
                        <TaskCard key={t.id} task={t} localRespondent={localRespondent} serverRespondent={serverRespondent} />
                    ))}
                    {tasks.length === 0 && <StyledText style={styles.card} type="defaultSemiBold">No tasks yet!</StyledText>}
                </IndexWrapper>}
                {!forAssessment && <View style={{ padding: 20}}></View>}
            </View>
        </StyledScroll>
        {forAssessment &&<View style={{ padding: 10}}></View> }
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