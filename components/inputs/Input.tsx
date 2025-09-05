
import theme from "@/themes/themes"
import { StyleSheet, TextInput, View } from "react-native"
import StyledText from "../styledText"

export default function Input({ value, onChange, label, error, placeholder='', keyboard=null, style=null}){
    /*
    Keyboard input that returns a string.
    - value (string/string convertible): value to display/control
    - onChange (function): what to do when user is typing
    - label (string): what the user should see above the input
    - error (string, RHF): RHF error field
    - placeholder (string, optional): placeholder text to show when no value is typed
    - keyboard (string, optional): enter to display specific keyboard (i.e., numeric, email, phone), entering textarea will show multiline input
    */
    return(
        <View style={[styles.field, , style]}>
            <StyledText type="defaultSemiBold">{label}</StyledText>
            <TextInput style={keyboard == 'textarea' ? styles.textarea : styles.input} value={value} onChangeText={(val) => onChange(val)} placeholder={placeholder} keyboardType={keyboard ? keyboard : 'default'} multiline={keyboard=='textarea'}/>
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    )
}

const styles = StyleSheet.create({
    field: {
        marginBottom: 10,
    },
    input: {
        padding: 15,
        backgroundColor: '#fff',
    },
    textarea: {
        padding: 15,
        backgroundColor: '#fff',
        height: 150,
        textAlignVertical: 'top',
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