import { ActivityIndicator, StyleSheet, View } from 'react-native';
import StyledText from './styledText';
export default function LoadingSpinner({ label=''}){
    /*
    Small spinner that indicates a component is loading. Useful when one specific component in an app 
    is loading. 
    - label (string, optional): display loading + label for a but more info
    */
    return(
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#fffff" />
            <StyledText style={{ marginTop: 10 }}>Loading {label}...</StyledText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});