import theme from '@/themes/themes';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from "react-native";
import StyledText from "../styledText";
import StyledButton from './StyledButton';

export default function DatePicker({ value, onChange, error, label, name }){
    /*
    Component that allows a user to select a datetime from a calendar.
    - value (datetime object): the value to use/set
    - onChange(function): what to do on date select
    - error (string, RHF): display RHF errors
    - label (string): text to display to user
    - name (string): name reference
    */
    const [showDate, setShowDate] = useState(false); //controls whether date selector calendar is visible

    return(
        <View>
            <StyledText type="defaultSemiBold">{label}</StyledText>
            <View style={{ display: 'flex', flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => setShowDate(true)} style={styles.button}>
                    <StyledText style={styles.buttonText} type="defaultSemiBold">
                    {value ? new Date(value).toDateString() : 'Select date'}
                    </StyledText>
                </TouchableOpacity>
                {showDate && (
                    <DateTimePicker
                        value={value ? new Date(value) : new Date()} //set default value to today to prevent users having to scroll from the 70s
                        mode="date"
                        display="default"
                        onChange={(_, selectedDate) => {
                            setShowDate(false);
                            if (selectedDate) onChange(selectedDate);
                        }}
                    />
                )}
                {value && <StyledButton onPress={() => onChange(null)} label={'Clear Date'} style={{ marginStart: 'auto' }} />}
            </View>
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 12,
        marginTop: 20,
        alignItems: 'center',
        marginEnd: 10, 
    },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
})