import theme from "@/themes/themes";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function IconInteract({ icon, onPress }){
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            {icon}
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 9,
        marginStart: 5, 
        marginEnd: 5,
    }
})