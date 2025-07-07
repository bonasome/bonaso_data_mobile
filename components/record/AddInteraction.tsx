import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import saveInteraction from '@/database/store/saveInteraction';
import deleteIfSynced from "@/database/upload/deleteIfSynced";
import uploadInteraction from '@/database/upload/uploadInteraction';
import fetchWithAuth from '@/services/fetchWithAuth';
import theme from "@/themes/themes";
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from "react";
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddInteraction({ respondent, tasks, fromLocal }){
    const { isServerReachable } = useConnection();
    const [doi, setDoi] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [selected, setSelected] = useState([])
    const [number, setNumber] = useState({});
    const [subcats, setSubcats] = useState({});
    const [allowedSubcats, setAllowedSubcats] = useState({});
    const [showSubcats, setShowSubcats] = useState(false)
    const [showNumber, setShowNumber] = useState(false);
    const [modalTask, setModalTask] = useState(null);


    function EnterNumber({ task }){
        const [localNumber, setLocalNumber] = useState(number[task.id] || '');

        const onCancel = () => {
           const downstreamIds = selected
                .filter(t => String(t?.indicator?.prerequisite) === String(task?.indicator?.id))
                .map(t => t.id);
            setSelected(prev => prev.filter(s => s.id !== task.id && !downstreamIds.includes(s.id)));
            setNumber(prev => ({ ...prev, [task.id]: '' }));
            setShowNumber(false);
        }

        return(
            <View>
                <Modal transparent={true}
                    visible={showNumber}
                    animationType="slide"
                onRequestClose={() => setShowNumber(false)}>
                    <View style={styles.modalContent}>
                        <StyledText type='subtitle'>Please enter a number.</StyledText>

                        <TextInput style={styles.input} keyboardType="numeric" value={localNumber}
                            onChangeText={(text) => setLocalNumber(text)} placeholder={'enter any number...'}
                        />

                        <View style={{flexDirection: 'row'}}>
                            <TouchableOpacity style={styles.button} disabled={localNumber === ''} onPress={() =>{
                                setSelected(prev => [...prev, task]);
                                setNumber(prev => ({ ...prev, [task.id]: localNumber })); 
                                setShowNumber(false)}
                            }>
                                <StyledText type='darkSemiBold' style={styles.buttonText}>Confirm</StyledText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.button} onPress={() => onCancel()}>
                                <StyledText type='darkSemiBold' style={styles.buttonText}>Cancel</StyledText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }

    function SelectSubcats({ task }){
        const [localSubcats, setLocalSubcats] = useState([]);
        useEffect(() => {
            if (showSubcats) {
                setLocalSubcats(subcats[task.id] || []);
            }
        }, [showSubcats]);
        
        const onCancel = () => {
            setSubcats(prev => ({ ...prev, [task.id]: [] }));

            const downstreamIds = selected
                .filter(t => String(t?.indicator?.prerequisite) === String(task?.indicator?.id))
                .map(t => t.id);

            setSelected(prev => prev.filter(s => s.id !== task.id && !downstreamIds.includes(s.id)));

            setShowSubcats(false);
        };
        const onSave = () => {
            setSubcats(prev => ({ ...prev, [task.id]: localSubcats })); 
            setSelected(prev => [...prev, task]);
            setShowSubcats(false);
            const downstreamTasks = selected.filter(t => String(t?.indicator?.prerequisite) === String(task?.indicator?.id));
            downstreamTasks.forEach(ct => {
                setAllowedSubcats(prev => ({ ...prev, [ct.id]: localSubcats }));

                if(subcats[ct.id]?.length > 0){
                    const valid_ids = localSubcats.map((c) => (c.linked_id))
                    const validSubcats = subcats[ct.id].filter(s => valid_ids.includes(s.linked_id));
                    setSubcats(prev => ({...prev, [ct.id]: validSubcats}));

                    if(validSubcats.length === 0){
                        setSelected(selected.filter(s => String(s.id) !== String(ct.id)))
                    }
                }
            });
        }
        console.log(localSubcats)

        const taskSubcats = allowedSubcats?.[task.id]?.length > 0 ? allowedSubcats?.[task.id] : task.indicator.subcategories;
        return(
            <View>
                <Modal transparent={true}
                    visible={showSubcats}
                    animationType="slide"
                    onRequestClose={() => setShowSubcats(false)}>
                    <View style={styles.modalContent}>
                    <StyledText style={styles.modalTitle} type='subtitle'>Please select all relevent subcategories.</StyledText>
                    <View style={styles.container}>
                        {taskSubcats.map(sc => {
                            const checked = localSubcats.filter(s => s.id === sc.id).length > 0;
                            return (
                                <TouchableOpacity
                                    key={sc.id}
                                    style={styles.checkboxContainer}
                                    onPress={() => {
                                        setLocalSubcats(prev => (
                                            prev.some(v => v.id === sc.id) ? 
                                            prev.filter(v => v.id !== sc.id) : [...localSubcats, sc]
                                        )
                                        )
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={checked ? 'checkbox' : 'square-outline'}
                                        size={24}
                                        color={checked ? theme.colors.bonasoLightAccent : '#fff'}
                                    />
                                    <StyledText type='defaultSemiBold' style={styles.checkboxLabel}>{sc.name}</StyledText>
                                    {task.indicator.require_numeric && checked && 
                                        <TextInput style={styles.smallInput} keyboardType="numeric"
                                            onChangeText={(v) => setLocalSubcats(prev => {
                                                const others = prev.filter(c => c.id !== sc.id);
                                                return [...others, { ...sc, numeric_component: v }];
                                            })} 
                                            value = {localSubcats.find(s => sc.id == s.id).numeric_component}
                                            placeholder={'enter any number...'}
                                        />
                                    }
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity style={styles.button} disabled={localSubcats.length === 0} onPress={() => onSave()}>
                        <StyledText type='darkSemiBold' style={styles.buttonText}>Confirm</StyledText>
                    </TouchableOpacity>

                     <TouchableOpacity style={styles.button} onPress={() =>onCancel()}>
                        <StyledText type='darkSemiBold' style={styles.buttonText}>Cancel</StyledText>
                    </TouchableOpacity>
                    </View>
                    </View>
                </Modal>
            </View>
        )
    }

    console.log(subcats)

    const handlePress = async (task) => {
        const existing = selected.filter(s => s.id === task.id);
        if(existing.length > 0 && !task.indicator.subcategories.length > 0 && !task.indicator.require_numeric){
            setSelected(selected.filter(s => s.id !== task.id))
            return;
        }
        if (task?.indicator?.prerequisite) {
            const prereq = task.indicator.prerequisite;
            const requiredTask = tasks.find(t => t.indicator.id === prereq);
            if (!requiredTask) {
                console.warn("Missing prerequisite task from available tasks");
                alert("This task has a prerequisite that could not be found locally. Please sync tasks.");
                return;
            }
            let isValid = false;
            console.log(prereq)
            console.log(selected)
            const inBatch = selected.filter(t => t?.indicator.id.toString() === requiredTask?.indicator.id.toString())
            console.log(inBatch)
            if (inBatch.length > 0) {
                isValid = true;
                const interSubcats = subcats[inBatch[0].id]
                console.log(interSubcats)
                setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
            } 
            if (!isValid){
                if(isServerReachable){
                    const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&task_indicator=${prereq.id}&before=${doi}`);
                    const data = await response.json()
                    if(data.results.length > 0){
                        const validPastInt = data.results.find(inter => inter?.task_detail?.indicator?.id === prereq);
                        console.log(validPastInt.interaction_date, doi)
                        if (validPastInt && new Date(validPastInt.interaction_date) <= doi) {
                            isValid = true;
                            if (validPastInt?.subcategories) {
                                const interSubcats = validPastInt.subcategories.map(t => t.name);
                                setAllowedSubcats(prev=> ({...prev, [task.id]: interSubcats}));
                            }
                        }
                    }
                }
            }
            if(!isValid && isServerReachable){
                alert(`This interaction requires that this respondent has been ${requiredTask.indicator.name}. However, we could not find an instance of this on record. Please assure that you have recorded that task first. (HINT: Set an interaction date if you have not already!)`)
                return;
            }
            if(!isValid && !isServerReachable){
                alert(`This interaction requires that this respondent has been ${requiredTask.indicator.name}.
                    However, we could not find an instance of this on record. If you beleive that there is
                    an instance of this on record, you may disregard this message. Just know that if there is no such
                    interaction, this interaction will not be saved.`)
            }
        }
        if(isServerReachable){
            const response = await fetchWithAuth(`/api/record/interactions/?respondent=${respondent.id}&task_indicator=${task.id}`);
            const data = await response.json()
            const pastInt = data.results.filter(inter => inter?.task_detail?.indicator?.id === task.indicator.id);
            const now = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);

            const tooRecent = pastInt.filter(
                inter => new Date(inter?.interaction_date) >= oneMonthAgo
            );
            if (tooRecent.length > 0 && existing.length === 0) {
                alert('This respondent has had this interaction in the last month. Please be sure you are not double recording.');
            }
        }
        if(task.indicator?.subcategories?.length > 0){
            setModalTask(task);
            setShowSubcats(true);
        }
        
        else if(task.indicator.require_numeric){
            setModalTask(task);
            setShowNumber(true);
        }
        else if(existing.length === 0){
            setSelected(prev => [...prev, task])
        }
    }

    const handleSubmit = async() => {
        const allTaskData = selected.map((task) => ({
            task: task.id,
            numeric_component: number[task.id] || null,
            subcategories_data: subcats[task.id] || [],
        }))
        const interactions = {
            tasks: allTaskData,
            respondent: respondent.id,
            doi: doi
        }
        const result = await saveInteraction(interactions, fromLocal)
        if (result.success) {
            alert("Saved successfully!");
            if(isServerReachable){
                try{
                    const uploaded = await uploadInteraction()
                    if(uploaded){
                        alert('Uploaded succesfuly!')
                        await deleteIfSynced();
                    }
                }
                catch(err){
                    console.error('Upload failed', err)
                }
            }
            setDoi(new Date())
            setSelected([]);
            setSubcats({})
            setNumber({})
        }
        else{
            alert('Save Failed.')
        }
    }

    const onChangeDate = (event, selectedDate) => {
        setShowDate(false);
        if (selectedDate) {
            setDoi(selectedDate);
        }
    }

    return(
        <View>
            <View style={styles.step}>
                <StyledText type='subtitle'>Step 2: Select a Date</StyledText>
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
            </View>
        
            <View style={styles.step}>
                <StyledText type='subtitle'>Step 3: Choose your tasks</StyledText>
                {tasks.length > 0 && tasks.map((task) => (
                    <TouchableOpacity key={task.id} style={selected.filter(s => s.id === task.id).length > 0 ? styles.selectedCard : styles.card} onPress={() => handlePress(task)}>
                        <StyledText type='defaultSemiBold' style={styles.buttonText}>{task.indicator.name}</StyledText>
                        {subcats[task.id]?.length > 0 && selected.filter(s => s.id === task.id).length > 0 &&
                            subcats[task.id].map((cat) => (
                                 <View key={cat.id} style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                    <StyledText >{cat.name} {cat?.numeric_component && `(${cat.numeric_component})`}</StyledText>
                                </View>
                            ))
                        }
                        {number[task.id] && selected.filter(s => s.id === task.id).length > 0 && 
                            <View style={styles.li}>
                                <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                <StyledText>Number: {number[task.id]} </StyledText>
                            </View>
                        }
                    </TouchableOpacity>
                ))}
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

    modalContent: {
        margin: 50,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        color: '#fff',
        padding: 40,
        minWidth: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        textAlign: 'center',
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