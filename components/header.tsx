import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import { Respondent } from "@/database/ORM/tables/respondents";
import checkServerConnection from "@/services/checkServerConnection";
import syncMeta from "@/services/syncMeta";
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import StyledText from "./styledText";

export default function Header() {
    const { signOut } = useAuth();
    const { isServerReachable, setIsServerReachable } = useConnection();
    const [user, setUser] = useState(null);

    const sync = async () => {
        const connected = await checkServerConnection();
        console.log(connected)
        if (connected) {
            try {
                await Respondent.upload();
                await Interaction.upload();
                await syncTasks();
                await syncMeta();
            } 
            catch (err) {
                console.error('Upload failed during sync:', err);
            }
        }
        setIsServerReachable(connected);
    };

    return(
        <View style={styles.header}>
            {user && <StyledText type="defaultSemiBold" numberOfLines={1} ellipsizeMode="tail">{user?.username}</StyledText>}
            <MaterialIcons 
                style={styles.connected} 
                name={isServerReachable ? 'wifi' : 'wifi-off' } size={20} 
                color={isServerReachable ? theme.colors.bonasoMain : theme.colors.errorBg} 
            />
            <StyledText style={styles.headerText} type="defaultSemiBold">BONASO Data Portal</StyledText>
            <TouchableOpacity onPress={() => sync()} style={styles.button}>
                <StyledText style={styles.buttonText}>Sync</StyledText>
            </TouchableOpacity>
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