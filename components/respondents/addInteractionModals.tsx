import { useEffect, useState } from 'react';

import theme from '@/themes/themes';
import { Modal, StyleSheet, View } from 'react-native';
import Input from '../inputs/Input';
import MultiCheckbox from '../inputs/MultiCheckbox';
import MultiCheckboxNum from '../inputs/MultiCheckboxNum';
import StyledButton from '../inputs/StyledButton';

/*
Helper modals that are used to input additional information about an interaction within the add interaction
component. The three are
- comments (for adding/editing comments)
- number (for writing a single number)
- subcats (for selecting subcats and entering associated numeric values as required)

For all three of these modals, the parent component, addInteraction, will manage the selected state to make
sure information about the correct interaction/task is being edited. 

Each modal will have different buttons depending on whether or not the value being edited has just been added
or was previously added (based on the existing prop). If a value exists, the user can save, cancel, or remove.
If a value does not exist, the user can save or cancel, and since the information is required, cancelling will 
also remove the task from the interactions array.
*/

export function CommentModal({ onUpdate, onCancel, onClear, existing='' }){
    /*
    Modal that will appear when the user wants to add a comment a specific interaction. The parent component
    will manage which interaction is being edited
    - onUpdate (function): what to do when changes are made
    - onCancel (function): what to do when closing the modal
    - onClear (function): after adding, allows a user to clear the comment
    - existing (string, optional): the existing comment
    */

    //store comments in a local state while editing for easier editing/state management
    //it will get passed up through onUpdate
    const [comment, setComment] = useState(existing);

    //update + close
    const handleUpdate = () => {
        onUpdate(comment);
        onCancel();
    }
    //clear + close
    const handleClear = () => {
        onClear();
        onCancel();
    }

    return(
        <View>
            <Modal transparent={true}
                visible={true}
                animationType="slide"
            >
                <View style={styles.modalContent}>
                    <Input label={'Your Comment...'} value={comment} onChange={(v) => setComment(v)} />
                    {/* Slightly alter what the buttons do depending on if existing is passed */}
                    {comment !== '' && <StyledButton onPress={handleUpdate} label={'Confirm'} />}
                    {existing  != '' && <StyledButton onPress={() => onCancel()} label={'Cancel'} />}
                    {existing != '' && <StyledButton onPress={handleClear} label={'Remove'} />}
                    {existing  == '' && <StyledButton onPress={handleClear} label={'Cancel'} /> }
                </View>
            </Modal>
        </View>
    )
}

export function NumberModal({ onUpdate, onCancel, onClear,  existing='' }){
    /*
    Modal that will appear when ta single numeric input is required. The parent component
    will manage which interaction is being edited
    - onUpdate (function): what to do when changes are made
    - onCancel (function): what to do when closing the modal
    - onClear (function): on initial load, allows a user to click cancel to undo the operation of adding the interaction,
        since this field is required to proceed. After initial load, users should remove the interaction
    -existing (string, optional): the existing number
    */
    const [number, setNumber] = useState(existing); //store number in a local state while editing

    //on save, pass the local state to the parent state, then close
    const handleUpdate = () => {
        onUpdate(number);
        onCancel();
    }
    //remove ir from parent list, then close
    const handleClear = () => {
        onClear();
        onCancel();
    }

    return(
        <View>
            <Modal transparent={true} visible={true} animationType="slide">
                <View style={styles.modalContent}>
                    <Input label={'Enter a number...'} value={number} onChange={(v) => setNumber(v)} keyboard={'numeric'} />
                    {/* Slightly alter what the buttons do depending on if existing is passed */}
                    {number !== '' && <StyledButton onPress={handleUpdate} label={'Confirm'} />}
                    {existing  != '' && <StyledButton onPress={() => onCancel()} label={'Cancel'} />}
                    {existing != '' && <StyledButton onPress={handleClear} label={'Remove'} />}
                    {existing  == '' && <StyledButton onPress={handleClear} label={'Cancel'} /> }
                </View>
            </Modal>
        </View>
    )
}

export function SubcategoryModal({ options, onUpdate, onCancel, onClear, numeric=false, existing=[] }) {
    /*
    Modal that will appear when ta single numeric input is required. The parent component
    will manage which interaction is being edited
    - options (array): array of objects to populate checkbox options
    - onUpdate (function): what to do when changes are made
    - onCancel (function): what to do when closing the modal
    - onClear (function): on initial load, allows a user to click cancel to undo the operation of adding the interaction,
        since this field is required to proceed. After initial load, users should remove the interaction
    - numeric (boolean, optional): should checked options require a numeric entry
    - existing (string, optional): the existing array of selected options
    */

    const [subcats, setSubcats] = useState(existing); //track selected values locally

    //if the value is not numeric, edit the passed existing prop to a format that MultiCheckbox can read (just the ids)
    useEffect(() => {
        if(!existing || existing?.length==0 || numeric) return;
        setSubcats(existing.map((c) => (c.subcategory.id)));
    }, [existing])

    //handle saving these subcategories
    const handleUpdate = () => {
        //if the value is being passed form MultiCheckbox, it will have just the ids as values, so map it to the format AddInteraction is expecting
        if(!numeric){
            const values = subcats.map(c => {
                const name = options.find(o => o.id == c)?.name
                return {id: null, subcategory: {id: c, name: name}, numeric_component: null};
            })
            onUpdate(values);
        }
        else{
            if(subcats.find(cat => (!cat?.numeric_component || cat?.numeric_component == ''))){
                alert('Please enter a number for each selected subcategory.');
                return;
            }
            onUpdate(subcats);
        }
    }
    //remove the interaction
    const handleClear = () => {
        onClear();
        onCancel();
    }
    
    return (
        <View>
            <Modal transparent={true} visible={true} animationType="slide">
                <View style={styles.modalContent}>
                    <View style={styles.container}>
                        {numeric? 
                            <MultiCheckboxNum options={options} value={subcats} label={'Please select all relevent subcategories'} onChange={setSubcats}/> : 
                            <MultiCheckbox options={options} value={subcats} label='Please select all relevent subcategories' onChange={setSubcats} valueField={'id'} labelField={'name'} />}
                    </View>
                    {/* Slightly alter what the buttons do depending on if existing is passed */}
                    {subcats.length > 0 && <StyledButton onPress={handleUpdate} label={'Confirm'} />}
                    {existing.length > 0 && <StyledButton onPress={() => onCancel()} label={'Cancel'} />}
                    {existing.length > 0 && <StyledButton onPress={handleClear} label={'Remove'} />}
                    {existing.length === 0 && <StyledButton onPress={handleClear} label={'Cancel'} /> }
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
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
    container: { 
        marginVertical: 10 
    },
})