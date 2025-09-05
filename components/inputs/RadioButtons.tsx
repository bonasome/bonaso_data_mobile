import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from '../styledText';
export default function RadioButtons({ options, value, label, onChange, error, valueField='value', labelField='label' }) {
    /*
    Allows a user to select a single item from a list. Returns a single value. Preferred for shorter lists,
    but for longer lists (over 5-7 values), you should probably use the SimplePicker component. 
    - options (array): Array of objects to display. Needs a a value field (what to return) and a label field (what to display next to the checkbox)
    - value (value): selected value (string, number, etc.)
    - label (string): what text to display at the top of the component
    - onChange (function): what to do when values are selected or unselected
    - error (string, RHF): RHF error field
    - valueField (string, optional): what object key to use for values (default value)
    - labelField (string, optional): what object key to use for labels (default label)
    */
    return (
        <View style={styles.container}>
            <StyledText type='defaultSemiBold' style={{ marginBottom: 4 }}>{label}</StyledText>
            {options.map(item => {
                return (
                    <TouchableOpacity
                        key={item[valueField]}
                        style={styles.buttonContainer}
                        onPress={() => onChange(item.value)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={item[valueField] == value ? 'radio-button-on-sharp' : 'radio-button-off-sharp'}
                            size={24}
                            color={item[valueField] == value ? '#fff' : '#fff'}
                        />
                        <StyledText type='defaultSemiBold' style={styles.buttonLabel}>{item[labelField]}</StyledText>
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
    buttonContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    buttonLabel: { marginLeft: 8, fontSize: 16 },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
});