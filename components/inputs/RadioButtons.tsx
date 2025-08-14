import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from '../styledText';
export default function RadioButtons({ options, value, label, onChange, error }) {
    return (
        <View style={styles.container}>
            <StyledText type='defaultSemiBold' style={{ marginBottom: 4 }}>{label}</StyledText>
            {options.map(item => {
                return (
                    <TouchableOpacity
                        key={item.value}
                        style={styles.buttonContainer}
                        onPress={() => onChange(item.value)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={item.value == value ? 'radio-button-on-sharp' : 'radio-button-off-sharp'}
                            size={24}
                            color={item.value == value ? '#fff' : '#fff'}
                        />
                        <StyledText type='defaultSemiBold' style={styles.buttonLabel}>{item.label}</StyledText>
                    </TouchableOpacity>
                );
            })}
            {error && <StyledText style={styles.errorText}>{error}</StyledText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 10 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    buttonContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    buttonLabel: { marginLeft: 8, fontSize: 16 },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
});