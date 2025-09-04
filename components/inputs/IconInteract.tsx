import { TouchableOpacity } from "react-native";
import StyledText from "../styledText";

export default function IconInteract({ icon, onPress, style=null, label='' }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[{ padding: 9, marginStart: 5, marginEnd: 5, display: 'flex', flexDirection: 'row' }, style]}
        >
        {icon}
        {label != '' && <StyledText style={{ marginStart: 7 }}>{label}</StyledText>}
        </TouchableOpacity>
    );
}