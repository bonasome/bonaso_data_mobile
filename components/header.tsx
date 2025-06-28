import { useAuth } from "@/context/AuthContext";
import theme from "@/themes/themes";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useConnection } from "@/context/ConnectionContext";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import StyledText from "./styledText";

export default function Header() {
    const { signOut } = useAuth();
    const { isServerReachable} = useConnection();
    const [user, setUser] = useState(null);

    return(
        <View style={styles.header}>
            {user && <StyledText type="defaultSemiBold" numberOfLines={1} ellipsizeMode="tail">{user?.username}</StyledText>}
                
            <MaterialIcons style={styles.connected} name={isServerReachable ? 'wifi' : 'wifi-off' } size={20} color={isServerReachable ? theme.colors.bonasoMain : theme.colors.errorBg} />
            <StyledText style={styles.headerText} type="defaultSemiBold">BONASO Data Portal</StyledText>
            <TouchableOpacity onPress={() => signOut()} style={styles.button}>
                <StyledText style={styles.buttonText}>Logout</StyledText>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    header:{
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        flexDirection: 'row',
        height: 85,
    },
    connected:{
        left: 7,
        top: 20,
    },
    button: {
        marginTop: 8,
        marginLeft: 'auto',
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 7,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerText:{
        fontSize: 17,
        marginLeft: 30,
        marginTop: 20,
    }
})