import { View } from "react-native";
import StyledText from "../styledText";
import Field from "./Field";

//a section of a form. helps with logic/segmenting/styling.
export default function FormSection({ fields, control, header=null }) {
    return (
        <View>
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