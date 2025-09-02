import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import { Task } from "@/database/ORM/tables/tasks";
import fetchWithAuth from '@/services/fetchWithAuth';
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import IconInteract from "../inputs/IconInteract";
import StyledButton from "../inputs/StyledButton";
import LoadingSpinner from "../LoadingSpinner";
import { CommentModal, NumberModal, SubcategoryModal } from "./addInteractionModals";


export default function AddInteraction({ localId, serverId=null, onSubmit  }){
    /*PARAMS: 
        - localId, the local uuid stored on device in the RespondentLink model, required
        -serverId, optional id that links to the server for certain serverside checks
    */
    //context to Fcheck connection
    const { isServerReachable } = useConnection();
    //vars to track high level information about all interactions
    const [doi, setDoi] = useState(new Date());
    const [location, setLocation] = useState('');
    //track selected tasks
    const [selected, setSelected] = useState([]);
    //track related information
    const [number, setNumber] = useState({}); //track numbers for tasks that require numbers (no subcats)
    const [subcats, setSubcats] = useState({}); //track subcateogry information per task {task_id: [{id: null, subcategory: {name: '', id: 1}, numeric_component: 1}]}
    const [allowedSubcats, setAllowedSubcats] = useState({}); //similar map that tracks allowed subcategories if there are prerequisites
    //meta vars to display/manage modals when more info is required
    const [showSubcats, setShowSubcats] = useState(false)
    const [showNumber, setShowNumber] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const [modalTask, setModalTask] = useState(null); //the task currently employing the modal
    //show date picker for DOI
    const [showDate, setShowDate] = useState(false);
    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadTasks = async () => {
            setLoading(true);
            if (isServerReachable){
                await syncTasks();
            }   
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize()));
            console.log(serialized)
            setTasks(serialized);
            setLoading(false);
        };
        loadTasks();
    }, [isServerReachable]);


    //function that runs whever a task is selected or removed from the list
    const handlePress = async (task) => {
        //determine if task is already selected
        const existing = selected.filter(s => s.id === task.id);

        //if yes, and there are no subcats/numeric inputs, remove it from selected
        if(existing.length > 0 && !task.indicator.subcategories.length > 0 && !task.indicator.require_numeric){
            setSelected(selected.filter(s => s.id !== task.id))
            return;
        }
        //by default, allow a user to select all subcategories
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
                const inBatch = selected.filter(t => t?.task?.indicator.id.toString() === requiredTask?.indicator.id.toString())
                if (inBatch.length > 0) {
                    isValid = true;
                    if(task?.indicator?.match_subcategories_to === prereq.indicator.id){
                        const interSubcatIDs = inBatch.subcategories_data.map((cat) => (cat?.subcategory?.id));
                        const interSubcats = task.indicator.subcategories.filter(cat => (interSubcatIDs.includes(cat.id)))
                        setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
                    }  
                }

                if (!isValid){
                    if(isServerReachable && serverId){
                        const response = await fetchWithAuth(`/api/record/interactions/?respondent=${serverId}&task_indicator=${prereq.id}&before=${doi}`);
                        const data = await response.json()
                        if(data.results.length > 0){
                            const validPastInt = data.results.find(inter => inter?.task?.indicator?.id == prereq.id);
                            if (validPastInt && new Date(validPastInt.interaction_date) <= new Date(doi)) {
                                isValid=true //if found, we're good. Just like above, set subcats if applicable
                                if(task.indicator.match_subcategories_to === prereq.id){
                                    setAllowedSubcats(prev=> ({...prev, [task.id]: validPastInt.subcategories.map((cat) => ({id: cat.subcategory.id, name: cat.subcategory.name}))}));
                                }
                            }
                        }
                    }
                }
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
                    const diffInDays = Math.abs(new Date(inter?.interaction_date) - new Date(date)) / msInDay;
                    return diffInDays <= 30;
                });
                if (tooRecent) {
                    alert('This respondent has had this interaction in the last month. ');
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
    //handle submission
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
            for(const task of selected){
                const data = {
                    interaction_date: doi.toISOString().split('T')[0], //remove timestamp
                    interaction_location: location,
                    respondent_uuid: localId,
                    task: task.id,
                    numeric_component: number[task.id] || null,
                    subcategory_data: subcats[task.id] || []
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
        //setDoi(new Date());
        //setLocation('');
        setSelected([]);
        setSubcats({});
        setNumber({});
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

    if(loading) return <LoadingSpinner label={'tasks'} />
    //if there are not tasks, you can't really do this so return nothing
    if(!tasks || tasks.length === 0) return (
        <View>
            <StyledText type="subtitle">No tasks. Make sure you have synced tasks online.</StyledText>
        </View>
    )
    return(
        <View>
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
                onCancel={() => setCommentsModalActive(false)} 
                onClear={(val) => setSelected(prev =>
                    prev.map(item => item.id === modalTask.id ? { ...item, comments: '' } : item)
                )}
                existing={modalTask?.comments ?? ''} 
            />}

            <View style={styles.step}>
                <StyledText type='subtitle'>Step 2: Select a Date/Location</StyledText>
                <StyledText type='defaultSemiBold'>Date</StyledText>
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
                <StyledText type='defaultSemiBold'>Location</StyledText>
                <TextInput placeholder="location..." style={styles.input} value={location} onChangeText={(val) => setLocation(val)} />
            </View>
        
            <View style={styles.step}>
                <StyledText type='subtitle'>Step 3: Choose your tasks</StyledText>
                {tasks.length > 0 && tasks.map((task) => {
                    const exists = selected.find(s => s.id === task.id);
                    if(!exists) return <StyledButton label={task?.display_name} onPress={() => handlePress(task)} />
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
                        </TouchableOpacity>
                    )
                })}
                {showSubcats && modalTask?.indicator?.subcategories?.length > 0 && (
                    <SelectSubcats task={modalTask} />
                )}
                {showNumber && modalTask?.indicator?.require_numeric && (
                    <EnterNumber task={modalTask} />
                )}
            </View>
            <View style={styles.step}>
                 <StyledText type='subtitle'>Step 4: Save Your Interaction</StyledText>
                <TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
                    <StyledText type='darkSemiBold' style={styles.buttonText}>Press Here to Save</StyledText>
                </TouchableOpacity>
            </View>
            
        </View>
    )
}

const styles = StyleSheet.create({
    step: {
        padding: 15,
        backgroundColor: theme.colors.bonasoMain,
        marginBottom: 20,
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
    searchEntry: {
        padding: 7,
    },
    date:{
        flexDirection: 'row',
    },
    card:{
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.bonasoLightAccent,
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
        marginTop: 30,
        marginBottom: 30,
        width: 250,
        backgroundColor: '#fff',
    },
    container: { marginVertical: 10 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    checkboxLabel: { marginLeft: 8, fontSize: 16 },
    smallInput: {
        marginTop: 30,
        marginBottom: 30,
        width: 40,
        backgroundColor: '#fff',
    },
});