import theme from '@/themes/themes';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';
import StyledText from '../styledText';
export default function SimplePicker({options, name, onChange, value, error }) {
    return(
        <View>
            <Picker style={styles.picker}
                onValueChange={(val) => onChange(val)}
                selectedValue={value} testID={`picker`}
            >
                <Picker.Item label={`Select a ${name}`} value="" />
                    {options && options.map(item => (
                        <Picker.Item key={item.value} label={item.label} value={item.value} />
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