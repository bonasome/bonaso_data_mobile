import { TouchableOpacity } from "react-native";

export default function IconInteract({ icon, onPress, style }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[{ padding: 9, marginStart: 5, marginEnd: 5 }, style]}
        >
        {icon}
        </TouchableOpacity>
    );
}