import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import { Respondent } from "@/database/ORM/tables/respondents";
import checkServerConnection from "@/services/checkServerConnection";
import syncMeta from "@/services/syncMeta";
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from "react-native";
import IconInteract from "./inputs/IconInteract";
import StyledText from "./styledText";

export default function Header() {
    /*
    App header that displays information and gives actions to sync app and logout. Visible at all times
    once the user is authorized. 
    */
    
    //get necesary contexts
    const { signOut, offlineMode } = useAuth();
    const { isServerReachable } = useConnection();

    //custom action to focibly sync the app (upload unsynced data and get latest info from the server)
    //available when user is connected and not in offline mode 
    //will also manually recheck connection
    const sync = async () => {
        const connected = await checkServerConnection();
        if (connected && !offlineMode) {
            try {
                await Respondent.upload();
                await Interaction.upload();
                await syncTasks(true);
                await syncMeta(true);
            } 
            catch (err) {
                console.error('Upload failed during sync:', err);
            }
        }
    };

    return(
        <View style={styles.header}>
            {/* Icon to display connection status */}
            <MaterialIcons 
                style={styles.connected} 
                name={isServerReachable ? 'wifi' : 'wifi-off' } size={20} 
                color={isServerReachable ? theme.colors.bonasoMain : theme.colors.errorBg} 
            />
            <StyledText style={styles.headerText} type="defaultSemiBold">BONASO Data Portal</StyledText>
            <View style={styles.actions}>
                {isServerReachable && !offlineMode && <IconInteract onPress={() => sync()} icon={<FontAwesome5 name="sync" size={20} color="#fff" />} />}
                <IconInteract onPress={() => signOut()} icon={<MaterialCommunityIcons name="logout" size={24} color="#fff" />} />
                
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    header:{
        paddingTop: 20,
        paddingStart: 20,
        paddingEnd: 20,
        paddingBottom: 10,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        flexDirection: 'row',
        height: 85,
    },
    connected:{
        left: 7,
        top: 20,
    },
    headerText:{
        fontSize: 17,
        marginLeft: 30,
        marginTop: 20,
    },
    actions: {
        marginStart: 'auto',
        flexDirection: 'row',
        marginTop: 14,
    }
})