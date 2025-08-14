import theme from '@/themes/themes';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from "react-native";
import StyledText from "../styledText";
import StyledButton from './StyledButton';

export default function DatePicker({ value, onChange, error, label }){
    const [showDate, setShowDate] = useState(false);

    return(
        <View>
            <StyledText type="defaultSemiBold">{label}</StyledText>
            <TouchableOpacity onPress={() => setShowDate(true)} style={styles.button}>
                <StyledText style={styles.buttonText} type="defaultSemiBold">
                {value ? new Date(value).toDateString() : 'Select date'}
                </StyledText>
            </TouchableOpacity>
            {showDate && (
                <DateTimePicker
                value={new Date(value)}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                    setShowDate(false);
                    if (selectedDate) onChange(selectedDate);
                }}
                />
            )}
            {value && <StyledButton onPress={() => onChange(null)} label={'Clear Date'} />}
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