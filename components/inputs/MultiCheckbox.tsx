import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from '../styledText';

export default function MultiCheckbox({ options, value, label, onChange, error, valueField='value', labelField='label' }) {
    /*
    Allows a user to select multiple items from a list. Returns an array.
    - options (array): Array of objects to display. Needs a a value field (what to return) and a label field (what to display next to the checkbox)
    - value (array): array of selected objects
    - label (string): what text to display at the top of the component
    - onChange (function): what to do when values are selected or unselected
    - error (string, RHF): RHF error field
    - valueField (string, optional): what object key to use for values (default value)
    - labelField (string, optional): what object key to use for labels (default label)
    */

    //handle checking or unchecking a value by appending or filtering it from the value array
    const toggleValue = (val) => {
        const updated = value?.includes(val)
            ? value.filter(v => v !== val)
            : [...value, val];
        onChange(updated);
    };

    return (
        <View style={styles.container}>
            <StyledText type='defaultSemiBold'>{label}</StyledText>
            {options.map(item => {
                const checked = value?.includes(item[valueField]);
                return (
                    <TouchableOpacity
                        key={item[valueField]}
                        style={styles.checkboxContainer}
                        onPress={() => toggleValue(item[valueField])}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={checked ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={checked ? theme.colors.bonasoLightAccent : '#fff'}
                        />
                        <StyledText type='defaultSemiBold' style={styles.checkboxLabel}>{item[labelField]}</StyledText>
                    </TouchableOpacity>
                );
            })}
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 10 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    checkboxLabel: { marginLeft: 8, fontSize: 16 },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
});