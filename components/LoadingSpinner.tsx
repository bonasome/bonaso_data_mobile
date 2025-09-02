import { ActivityIndicator, StyleSheet, View } from 'react-native';
import StyledText from './styledText';
export default function LoadingSpinner({ label=''}){
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