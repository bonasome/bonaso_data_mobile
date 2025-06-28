import themes from "@/themes/themes";
import { ScrollView, StyleSheet } from "react-native";

export default function StyledScroll({ children }) {
    return (
        <ScrollView style={styles.container}>
            { children }
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themes.colors.bonasoDarkAccent,
        padding: 20,
    },
});