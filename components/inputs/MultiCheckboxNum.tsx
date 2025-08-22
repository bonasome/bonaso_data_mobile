import theme from '@/themes/themes';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import StyledText from '../styledText';
import Input from './Input';

export default function MultiCheckboxNum({ options, value, label, onChange, error }) {
    const toggleValue = (val) => {
        const updated = value?.find(v => val?.id == v?.subcategory?.id)
            ? value?.filter(v => v?.subcategory?.id !== val?.id)
            : [...value, {id: null, subcategory: val, numeric_component: ''}];
        onChange(updated);
    };

    const changeNumber = (val, num) => {
        const toUpdate = value?.find(v => val?.id == v.subcategory?.id);
        const others = value?.filter(v => val?.id != v.subcategory?.id);
        const updated = { ...toUpdate, numeric_component: num };
        onChange([...others, updated]);
    };
    return (
        <View style={styles.container}>
            <StyledText type='defaultSemiBold'>{label}</StyledText>
            {options.map(item => {
                const checked = value?.find(v => item?.id == v?.subcategory?.id);
                const number = String(
                    value?.find(v => item?.id == v?.subcategory?.id)?.numeric_component ?? ''
                );
                return (
                    <TouchableOpacity
                        key={item?.id}
                        style={styles.checkboxContainer}
                        onPress={() => toggleValue(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={checked ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={checked ? theme.colors.bonasoLightAccent : '#fff'}
                        />
                        <StyledText type='defaultSemiBold' style={styles.checkboxLabel}>{item?.name}</StyledText>
                        {checked && <Input value={number} onChange={(val) => changeNumber(item, val)} keyboard={'numeric'} />}
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
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    checkboxLabel: { marginLeft: 8, fontSize: 16 },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
});