import theme from "@/themes/themes";
import { StyleSheet, TouchableOpacity } from "react-native";
import StyledText from "../styledText";


export default function StyledButton({ onPress, label, disabled=false, style=null}){
    /*
    Simple button that uses a consistent style. 
    - onPress (function): what to do when button is pressed
    - label (string): text to display on button
    - disabled (boolean, optional): conditions under which to disable the button
    - style (object, optional): for inline stlyes
    */
    return(
        <TouchableOpacity onPress={onPress} style={[disabled ? styles.disabled : styles.button, style]} disabled={disabled}>
            <StyledText type="defaultSemiBold" style={styles.buttonText}>{label}</StyledText>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    disabled: {
        backgroundColor: theme.colors.lightGrey,
        padding: 12,
        marginTop: 20,
        alignItems: 'center',
    },
})