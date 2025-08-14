import theme from "@/themes/themes";
import { StyleSheet, TouchableOpacity } from "react-native";
import StyledText from "../styledText";
export default function StyledButton({ onPress, label}){
    return(
        <TouchableOpacity onPress={onPress} style={styles.button}>
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
})