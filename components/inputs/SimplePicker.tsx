import cleanLabel from '@/services/cleanLabels';
import theme from '@/themes/themes';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';
import StyledText from '../styledText';


export default function SimplePicker({options, label, name, onChange, value, error }) {
    /*
    Allows a user to select a single item from a list. Returns a single value. Preferred for longer lists,
    but shorter lists should use radio buttons. 
    - options (array): Array of objects to display. Needs a a value field (what to return) and a label field (what to display next to the checkbox)
    - value (value): selected value (string, number, etc.)
    - label (string): what text to display at the top of the component
    - name (string): name of the value being controlled (used for determining label within picker)
    - onChange (function): what to do when values are selected or unselected
    - error (string, RHF): RHF error field
    */
    return(
        <View>
            <StyledText type="defaultSemiBold">{label}</StyledText>
            <Picker style={styles.picker} onValueChange={(val) => onChange(val)} selectedValue={value} testID={`picker`}>
                <Picker.Item color={theme.colors.bonasoUberDarkAccent} label={`Select a${['a', 'e', 'i', 'o', 'u'].includes(name.charAt(0)) ? 'n' : ''} ${cleanLabel(name)}`} value="" />
                    {options && options.map(item => (
                        <Picker.Item key={item.value} color={theme.colors.bonasoUberDarkAccent} label={item.label} value={item.value} />
                    ))}
            </Picker>
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    )
}

const styles = StyleSheet.create({
    picker: {
        borderRadius: 8,
        backgroundColor: theme.colors.bonasoLightAccent,
        marginBottom: 20,
    },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
})