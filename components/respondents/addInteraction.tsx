import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import { Task } from "@/database/ORM/tables/tasks";
import fetchWithAuth from '@/services/fetchWithAuth';
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import IndexWrapper from "../IndexWrapper";
import IconInteract from "../inputs/IconInteract";
import StyledButton from "../inputs/StyledButton";
import LoadingSpinner from "../LoadingSpinner";
import { CommentModal, NumberModal, SubcategoryModal } from "./addInteractionModals";

export default function AddInteraction({ localId, serverId=null, onSubmit  }){
    /*
        Component that allows a user to create a number of interactions at once by entering a date and location
        and then selected a number of tasks to create interactions for. Designed to be used in the respondent detail
        page so that all interactions are linked to the same respondent. 
        - localId (integer): the local respondent uuid stored on device in the RespondentLink model
        - serverId (integer, optional): optional id that links to the server for certain serverside checks
        - onSubmit (function): alerts parent component that an update was made so that it can trigger 
            updates in other components
    */
    //context to check connection
    const { isServerReachable } = useConnection();
    //vars to track high level information about all interactions
    const [doi, setDoi] = useState(new Date());
    const [location, setLocation] = useState('');
    //track selected tasks and information about them
    const [selected, setSelected] = useState([]); //{id: taskID, task: task, subcategories_data: [], numeric_component: ''}
    //map that tracks allowed subcategories if there are prerequisites
    const [allowedSubcats, setAllowedSubcats] = useState({}); 
    //meta vars to display/manage modals when more info is required
    const [showSubcats, setShowSubcats] = useState(false)
    const [showNumber, setShowNumber] = useState(false);
    const [showComments, setShowComments] = useState(false);
    //the task/associated information currently employing one of the modals
    const [modalTask, setModalTask] = useState(null); 
    //show date picker for DOI
    const [showDate, setShowDate] = useState(false);
    //tracks available tasks
    const [tasks, setTasks] = useState([]);
    //custom page tracker for paginating tasks (default length of 10)
    const [page, setPage] = useState(1); 
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState(false);
    //tracks if tasks are loding
    const [loading, setLoading] = useState(false);

    //load tasks by default
    useEffect(() => {
        const loadTasks = async () => {
            setLoading(true);
            if (isServerReachable){
                await syncTasks(); //try to fetch online if tasks are over 12 hours old
            }   
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize()));
            setTasks(serialized);
            setLoading(false);
        };
        loadTasks();
    }, [isServerReachable]);

    useEffect(() => {
        const updateSearch = async() => {
            console.log(search)
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize()));
            if(search != '') setTasks(serialized.filter((t) => (t.display_name.toLowerCase().includes(search.toLowerCase()))));
            else setTasks(serialized);
        }
        updateSearch();
    }, [search])

    //function that runs whever a task is added from selected
    const handlePress = async (task) => {
        //determine if task is already selected
        const existing = selected.filter(s => s.id === task.id);

        //if its already in the list, alert the user and exit the function
        if(existing.length > 0){
            alert('Task already in interaction!');
            return;
        }

        //by default, allow a user to select all subcategories, if applicable
        if(task.indicator.subcategories.length > 0) setAllowedSubcats(prev => ({...prev, [task.id]: task.indicator.subcategories}));
        
        //check for prereqs
        if (task?.indicator?.prerequisites) {
            for (const prereq of task.indicator.prerequisites){
                const requiredTask = tasks.find(t => t.indicator.id === prereq.indicator.id);
                if (!requiredTask) {
                    alert("This task has a prerequisite that could not be found locally. Please sync tasks.");
                }
                let isValid = false; //helper to track if a prereq is found

                //first check tasks in the local selected array
                const inBatch = selected.find(t => t?.task?.indicator.id.toString() === requiredTask?.indicator.id.toString());
                if (inBatch) {
                    isValid = true;
                    //if found and this prereq is supposed to match subcategories, update allowed subcategories
                    if(task?.indicator?.match_subcategories_to === prereq.indicator.id){
                        const interSubcatIDs = inBatch.subcategories_data.map((cat) => (cat?.subcategory?.id));
                        const interSubcats = task.indicator.subcategories.filter(cat => (interSubcatIDs.includes(cat.id)))
                        setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
                    }  
                }
                //if not found in batch, try to find something offline
                if (!isValid){
                    if(isServerReachable && serverId){
                        const response = await fetchWithAuth(`/api/record/interactions/?respondent=${serverId}&indicator=${prereq.indicator.id}&end=${doi.toISOString().split('T')[0]}`);
                        const data = await response.json();
                        if(data.results.length > 0){
                            const validPastInt = data.results.find(inter => inter?.task?.indicator?.id == prereq.indicator.id);
                            if (validPastInt && new Date(validPastInt.interaction_date) <= new Date(doi)) {
                                isValid=true //if found, we're good. Just like above, limit allowedSubcats if applicable
                                if(task.indicator.match_subcategories_to === prereq.indicator.id){
                                    setAllowedSubcats(prev=> ({...prev, [task.id]: validPastInt.subcategories.map((cat) => ({id: cat.subcategory.id, name: cat.subcategory.name}))}));
                                }
                            }
                        }
                    }
                }
                //if nothing is found, warn the user this might throw a flag
                if(!isValid){
                    alert(`This interaction requires that this respondent has had an interaction related to task "${prereq.indicator.code}: ${prereq.indicator.name}". However, we could not find an instance of this on record. If this an interaction with this task is not added, this interaction will be flagged.`)
                }
            }
        }
        //if allow repeat is not ticked, check for an interaction in the past 30 days, as this will trigger a flag
        if (isServerReachable && serverId && !task.indicator.allow_repeat) {
            try{
                const response = await fetchWithAuth(`/api/record/interactions/?respondent=${serverId}&indicator=${task.indicator.id}`);
                const data = await response.json();
                const msInDay = 1000 * 60 * 60 * 24; //convert ms to days
                // check if any interaction was within the past 30 days of interactionDate
                const tooRecent = data.results.some(inter => {
                    const diffInDays = Math.abs(new Date(inter?.interaction_date) - new Date(doi)) / msInDay;
                    return diffInDays <= 30;
                });
                //warn the user it will be flagged
                if (tooRecent) {
                    alert('This respondent has had this interaction in the last 30 days and will be flagged.');
                }
            }
            catch(err){
                console.error(err);
            }
        }
        //create a new package containing all the fields the interaction may need
        const newIr = {id: task.id, task: task, subcategories_data: [], numeric_component: '', comments: ''}

        //push this task id to the list of those in the interaction
        setSelected(prev => [...prev, newIr]) //update the state

       //if additional information is required, show the appropriate modal
        if(task.indicator.subcategories.length > 0){
            setShowSubcats(true);
            setModalTask(newIr);
        }
        //if it has subcategories and requires numeric, the subcategory modal will handle it
        else if(task.indicator.require_numeric){
            setShowNumber(true);
            setModalTask(newIr)
        }
    }

    //remove a task from the batch
    const removeItem = (task) => {
        setSelected(prev => {
            const updated = prev.filter(t => t.id !== task.id);
            return updated;
        });
    };

    //handle submission of the interactions
    const handleSubmit = async() => {
        //check date of interaction and date is valid
        if(!doi || new Date(doi) > new Date()){
            alert('Please enter a valid interaction date that is not in the future.');
            return;
        }
        //check location
        if(!location){
            alert('Interaction location is required.');
            return;
        }
        //save and submit
        try{
            console.log('submitting tasks...', localId);
            for(const ir of selected){
                const data = {
                    interaction_date: doi.toISOString().split('T')[0], //remove timestamp
                    interaction_location: location,
                    respondent_uuid: localId,
                    task: ir.task.id,
                    numeric_component: ir?.numeric_component || null,
                    subcategory_data: ir?.subcategories_data || [],
                    comments: ir?.comments || '',
                }
                //save this data locally
                const saved = await Interaction.save(data);
            }
            if(isServerReachable){
                //if server is available, try to upload it immediately
                const uploaded = await Interaction.upload()
                if(uploaded){
                    alert('Uploaded succesfuly!');
                    onSubmit();
                }
            }
            else{
                //else alert user that it is saved locally
                alert('Interactions saved! They will be uploaded next time connection is found.');
                onSubmit();
            }
        }
        catch(err){
            console.error('Save failed', err)
        }
        setSelected([]); //reset selected
    }

    //helper function to manage the date
    const onChangeDate = (event, selectedDate) => {
        setShowDate(false);
        if (selectedDate) {
            setDoi(selectedDate);
        }
    }

    //handle a user changing the number of selected components
    const handleSubcatEdit = (ir, val) => {
        //check for potetial downstream tasks that rely on this as a parent interaction
        for(const sel of selected){
            //check if this item uses this as a match subcats
            if(sel.task.indicator.match_subcategories_to == ir.task.indicator.id){
                const selIDs = sel.subcategories_data.map((cat) => cat?.subcategory?.id);
                const interSubcatIDs = val.map((cat) => (cat?.subcategory?.id));
                //check if the new list removes a choice that the downstream interaction was relying on (prevents flags)
                if(!selIDs.every(id => interSubcatIDs.includes(id))){
                    alert(`Cannot make these changes without invalidating a depending task (${sel.task.display_name}). Please edit that interaction first.`);
                    return;
                }
                //if its still a subset, set the downstream tasks allowed subcats to the selected cats
                //this works since the subcategories for task and sel.task should be identical
                const interSubcats = ir.task.indicator.subcategories.filter(cat => (interSubcatIDs.includes(cat.id)));
                setAllowedSubcats(prev=> ({...prev, [sel.id]: interSubcats}));
            }
        }
        //edit the actual state once verification is complete
        setSelected(prev => prev.map(item => item.id === modalTask.id ? { ...item, subcategories_data: val } : item))
        setShowSubcats(false);
    }
    
    //determine what happens when the user taps the button for a task in selected, by default remove it, or reopen to information modal
    const handlePressAgain = (ir) => {
        if(ir?.task?.indicator?.subcategories?.length > 0){
            setModalTask(ir); 
            setShowSubcats(true);
        }
        else if(ir?.task?.indicator.require_numeric){
            setModalTask(ir);
            setShowNumber(true);
        }
        else{
            removeItem(ir?.task);
        }
    }

    //only map tasks in page
    const tasksToMap = tasks.slice((page-1)*10, ((page-1)*10+10));

    if(loading) return <LoadingSpinner label={'tasks'} />
    return(
        <View>
            {/* Conditional modals */}
            {showSubcats && <SubcategoryModal onUpdate={(val) => {handleSubcatEdit(modalTask, val)}} 
                onClear={() => {removeItem(modalTask)}}
                onCancel={() => setShowSubcats(false)} existing={modalTask?.subcategories_data ?? []}
                options={allowedSubcats[modalTask.id]} numeric={modalTask.task.indicator.require_numeric} 
            />}

            {showNumber && <NumberModal onUpdate={(val) => setSelected(prev =>
                    prev.map(item => item.id === modalTask.id ? { ...item, numeric_component: val } : item)
                )} 
                onClear={() => {removeItem(modalTask)}}
                onCancel={() => setShowNumber(false)} existing={modalTask?.numeric_component ?? ''} 
            />}

            {showComments&& <CommentModal onUpdate={(val) => setSelected(prev =>
                    prev.map(item => item.id === modalTask.id ? { ...item, comments: val } : item)
                )} 
                onCancel={() => setShowComments(false)} 
                onClear={(val) => setSelected(prev =>
                    prev.map(item => item.id === modalTask.id ? { ...item, comments: '' } : item)
                )}
                existing={modalTask?.comments ?? ''} 
            />}

            <View style={styles.section}>
                <TouchableOpacity onPress={() => setExpanded(!expanded)} style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
                    <StyledText type="subtitle">Create New Interactions</StyledText>
                    {expanded ? <FontAwesome name="arrow-circle-o-up" size={24} color="white" style={{marginLeft: 'auto'}}/> : <FontAwesome name="arrow-circle-o-down" size={24} color="white" style={{marginLeft: 'auto'}}/>}
                </TouchableOpacity>
                {expanded && <View>
                    <StyledText type='defaultSemiBold'>Interaction Date</StyledText>
                    <View style={styles.date}>
                        <TouchableOpacity style={styles.button} onPress={() => setShowDate(true)}>
                            <StyledText type='darkSemiBold' style={styles.buttonText}>{new Date(doi).toDateString()}</StyledText>
                        </TouchableOpacity>
                        {showDate && (
                        <DateTimePicker
                            value={doi}
                            mode="date"
                            display="default"
                            onChange={onChangeDate}
                        />
                        )}
                    </View>
                    <StyledText type='defaultSemiBold'>Interaction Location</StyledText>
                    <TextInput placeholder="Gaborone Clinic, Main Kgotla..." style={styles.input} value={location} onChangeText={(val) => setLocation(val)} />

                    <StyledText type='defaultSemiBold'>Tap on the tasks below to add them to this interaction...</StyledText>
                    <IndexWrapper page={page} onSearchChange={setSearch} onPageChange={setPage} entries={tasks?.length} fromServer={false}>
                        {tasksToMap.length > 0 ? tasksToMap.map((task) => {
                            const exists = selected.find(s => s.id === task.id);
                            if(!exists) return <StyledButton key={task.id} label={task?.display_name} onPress={() => handlePress(task)} />
                            return(
                                <TouchableOpacity key={task.id} style={styles.selectedCard} onPress={() => handlePressAgain(exists)}>
                                    <StyledText type='defaultSemiBold' style={styles.buttonText}>{task.display_name}</StyledText>

                                    {exists?.subcategories_data && exists?.subcategories_data.map((cat) => (
                                        <View key={cat.subcategory.id} style={styles.li}>
                                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                            <StyledText >{cat.subcategory.name} {cat?.numeric_component && `(${cat.numeric_component})`}</StyledText>
                                        </View>
                                    ))}

                                    {exists?.numeric_component && <View style={styles.li}>
                                        <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                        <StyledText>{exists.numeric_component} </StyledText>
                                    </View>}

                                    <IconInteract onPress={() => {setShowComments(true); setModalTask(exists)}} icon={<MaterialCommunityIcons name="comment-plus" size={24} color="white" />} />    
                                    <StyledText type="defaultSemiBold">Comments:</StyledText>
                                    <StyledText>{exists?.comments == '' ? 'No Comments' : `${exists?.comments}`}</StyledText>
                                
                                </TouchableOpacity>
                            )
                        }) : <StyledText>No tasks found...</StyledText>}
                    </IndexWrapper>
                    <StyledButton onPress={handleSubmit} label='Press Here to Save' disabled={(selected.length == 0 || location == '' || !doi)} />
                </View>}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    section: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        marginBottom: 10,

    },
    button:{
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 15,
        margin: 10,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
    date:{
        flexDirection: 'row',
    },
    selectedCard:{
        padding: 30,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.bonasoDarkAccent,
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
    input: {
        marginTop: 5,
        marginBottom: 30,
        width: '90%',
        padding: 15,
        backgroundColor: '#fff',
    },
});