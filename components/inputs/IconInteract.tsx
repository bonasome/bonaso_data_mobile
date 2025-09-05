import { TouchableOpacity } from "react-native";
import StyledText from "../styledText";

export default function IconInteract({ icon, onPress, label='', style=null }) {
    /*
    Displays an icon that does something when clicked. 
    - icon (component): icon to display
    - onPress (function): what to do when pressed
    - label (string, optional): optional text label to show alongside icon
    - style (object, optional): accepts optional inline styles
    */
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