import theme from "@/themes/themes";
import { StyleSheet, View } from "react-native";
import StyledText from "../styledText";
import Field from "./Field";

export default function FormSection({ fields, control, header=null }) {
    /*
    Returns a series of related form fields (or inputs) that can collectively respond to logic. 
    - fields (array): array of objects used to construct inputs (see [./Field.tsx])
    - control (RHF control): form controller
    - header (string, optional): text to display at the top of the section
    */
    return (
        <View style={styles.segment}>
            {header && <StyledText type="subtitle">{header}</StyledText>}
            {fields.map((field) => (
                <Field 
                    key={field.name} 
                    field={field} 
                    control={control} 
                    placeholder={field?.placeholder ?? null}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    segment: {
        margin: 10,
        backgroundColor: theme.colors.bonasoMain,
        padding: 20,
    }
})