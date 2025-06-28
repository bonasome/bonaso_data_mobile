import theme from '@/themes/themes';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet } from 'react-native';
export default function SimplePicker({values, name, callback, value=''}) {
    return(
        <Picker style={styles.picker}
            onValueChange={(val) => callback(val)}
            selectedValue={value} testID={`picker`}
        >
        <Picker.Item label={`Select a ${name}`} value="" />
            {values && values.map(item => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
    </Picker>
    )
}

const styles = StyleSheet.create({
    picker: {
        borderRadius: 8,
        backgroundColor: theme.colors.bonasoLightAccent,
        marginBottom: 20,
    },
})