import theme from "@/themes/themes";
import { StyleSheet, View } from "react-native";
import StyledText from "../styledText";
import Field from "./Field";
//a section of a form. helps with logic/segmenting/styling.
export default function FormSection({ fields, control, header=null }) {
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