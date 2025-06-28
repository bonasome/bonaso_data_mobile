import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from './styledText';
export default function MultiCheckboxList({ values, label, selected = [], onChange }) {
    const toggleValue = (value) => {
        const updated = selected.includes(value)
            ? selected.filter(v => v !== value)
            : [...selected, value];
        onChange(updated);
    };

    return (
        <View style={styles.container}>
            {values.map(item => {
                const checked = selected.includes(item.value);
                return (
                    <TouchableOpacity
                        key={item.value}
                        style={styles.checkboxContainer}
                        onPress={() => toggleValue(item.value)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={checked ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={checked ? theme.colors.bonasoLightAccent : '#fff'}
                        />
                        <StyledText type='defaultSemiBold' style={styles.checkboxLabel}>{item.label}</StyledText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 10 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    checkboxLabel: { marginLeft: 8, fontSize: 16 },
});