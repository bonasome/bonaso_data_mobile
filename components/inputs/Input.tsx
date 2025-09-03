
import theme from "@/themes/themes"
import { StyleSheet, TextInput, View } from "react-native"
import StyledText from "../styledText"

export default function Input({ value, onChange, label, error, placeholder='', keyboard=null, style=null}){
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