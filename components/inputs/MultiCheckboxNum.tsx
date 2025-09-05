import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from '../styledText';
import Input from './Input';

export default function MultiCheckboxNum({ options, value, label, onChange, error }) {
    /*
    Allows a user to select multiple items from a list and enter a numer alongside each selected value.
    Returns an array of objects like: {id: int, subcategory: {id: int, name: string}, numeric_component: int}.
    Designed for specific use for interactions that have subcategories and require a number. 

    - options (array): Array of objects to display. Needs a a value field (what to return) and a label field (what to display next to the checkbox)
    - value (array): array of selected objects
    - label (string): what text to display at the top of the component
    - onChange (function): what to do when values are selected or unselected
    - error (string, RHF): RHF error field
    */

    //determine what happens when a value is selected
    const toggleValue = (val) => {
        //if its already seleted, filter it out, otherwise add a new object to the array with a blank numeric value
        const updated = value?.find(v => val?.id == v?.subcategory?.id)
            ? value?.filter(v => v?.subcategory?.id !== val?.id)
            : [...value, {id: null, subcategory: val, numeric_component: ''}];
        onChange(updated); //update value
    };

    //determine what happens when a number is typed into an input
    const changeNumber = (val, num) => {
        //val --> the selected value
        //num --> the number being typed
        const toUpdate = value?.find(v => val?.id == v.subcategory?.id); //find target value
        const others = value?.filter(v => val?.id != v.subcategory?.id); //create array of others
        const updated = { ...toUpdate, numeric_component: num }; //set numeric component for target
        onChange([...others, updated]); //add it back to the value and run onChange
    };

    return (
        <View style={styles.container}>
            <StyledText type='defaultSemiBold'>{label}</StyledText>
            {options.map(item => {
                const checked = value?.find(v => item?.id == v?.subcategory?.id); //is this subcategory selected
                //find the numeric component for this val and convert it to a string
                const number = String(
                    value?.find(v => item?.id == v?.subcategory?.id)?.numeric_component ?? ''
                );
                return (
                    <TouchableOpacity key={item?.id} style={styles.checkboxContainer} onPress={() => toggleValue(item)} activeOpacity={0.7}>
                        <Ionicons
                            name={checked ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={checked ? theme.colors.bonasoLightAccent : '#fff'}
                        />
                        <StyledText type='defaultSemiBold' style={styles.checkboxLabel}>{item?.name}</StyledText>
                        {checked && <Input style={styles.input} value={number} onChange={(val) => changeNumber(item, val)} keyboard={'numeric'} placeholder={'ex. 6'} />}
                    </TouchableOpacity>
                );
            })}
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        marginVertical: 10 
    },
    label: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 8 
    },
    checkboxContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    checkboxLabel: { 
        marginLeft: 8, fontSize: 16 
    },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
    input: {
        marginStart: 10,
        width: 75,
    }
});