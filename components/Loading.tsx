import theme from '@/themes/themes';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import StyledText from './styledText';
export default function LoadingScreen(){
    /*
    Returns a full loading/splash screen, for when a whole screen is loading.
    */
    return(
        <View style={styles.container}>
            <Image style={styles.loginImg} source={require('../assets/images/bonasoWhite.png')} />
            <ActivityIndicator size="large" color="#fffff" />
            <StyledText style={{ marginTop: 10 }}>Loading...</StyledText>
        </View>
    );
    
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.bonasoDarkAccent,
        padding: 10,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    loginImg:{
        height: 200,
        width: 200,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 50,
        marginBottom: 50,
    },
});