import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons'; // or 'react-native-vector-icons/Ionicons'
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from '../styledText';

export default function Checkbox({ label, value, onChange, error }) {
    return (
        <View>
            <TouchableOpacity
                style={styles.container}
                onPress={() => onChange(!value)}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={value ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={value ? theme.colors.bonasoLightAccent : '#fff'}
                />
                <StyledText type='defaultSemiBold' style={styles.label}>{label}</StyledText>
            </TouchableOpacity>
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    label: {
        marginLeft: 10,
        fontSize: 16,
    },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
});