import Checkboxes from '@/components/checkboxes';
import SimplePicker from '@/components/simplePicker';
import StyledScroll from '@/components/styledScroll';
import StyledText from '@/components/styledText';
import ToggleCheckbox from '@/components/toggleCheckbox';
import { useConnection } from '@/context/ConnectionContext';
import saveRespondent from '@/database/store/saveRespondent';
import { mapMeta } from '@/database/sync/mapMeta';
import deleteIfSynced from '@/database/upload/deleteIfSynced';
import uploadRespondent from '@/database/upload/uploadRespondents';
import theme from '@/themes/themes';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateRespondent() {
    const navigation = useNavigation();
    const { isServerReachable } = useConnection();
    const [meta, setMeta] = useState(null);
    const [showDate, setShowDate] = useState(false);
    const [isAnon, setIsAnon] = useState(false);

    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            first_name: '',
            last_name: '',
            dob: null,
            age_range: '',
            id_no: '',
            sex: '',
            district: '',
            ward: '',
            village: '',
            citizenship: 'Motswana',
            kp_status_names: [],
            disability_status_names: [],
            email: '',
            phone: '',
            is_pregnant: false,
            hiv_positive: false,
        }
    });

    useEffect(() => {
        let isMounted = true;
        const getMeta = async () => {
            try {
                const localMeta = await mapMeta();
                if (isMounted) {
                    setMeta(localMeta);
                }
            } 
            catch (err) {
                console.error('Failed to load meta:', err);
                if (isMounted) {
                    setMeta(null); // or empty object {} or show a fallback
                }
            }
        };
        getMeta();
        return () => {
            isMounted = false;
        };
    }, []);
    const onSubmit = async (data) => {
        console.log(data)
        if (isAnon) {
            data.first_name = null;
            data.last_name = null;
            data.dob = null;
            data.id_no = null;
            data.ward = null;
            data.email = null;
            data.phone = null;
        } else {
            if (!data.dob || new Date(data.dob) > new Date()) {
                alert("Date of birth is invalid.");
                return;
            }
            data.age_range = null;
        }
        data.is_anonymous = isAnon;
        const result = await saveRespondent(data);
        let id = result.id
        console.log(id)
        if (result.success) {
            alert("Saved successfully!");
            if (isServerReachable) {
                try {
                    const uploaded = await uploadRespondent();
                    if (uploaded) await deleteIfSynced();
                    id = uploaded[uploaded.length - 1];
                    
                } catch (err) {
                    alert('Upload failed.')
                    console.error('Upload failed', err);
                }
            }
            console.log(id)
            router.push({ pathname: '/authorized/(tabs)/record', params: { created: id } });
        } 
        else {
            alert("Failed to save.");
        }
    };

    
    return (
        <StyledScroll>
            <View style={styles.form}>
            <StyledText type='title'>Creating New Respondent</StyledText>
            <View style={styles.field}>
                <StyledText style={styles.fieldHeader} type='defaultSemiBold'>Is this an anonymous respondent?</StyledText>
                <ToggleCheckbox label="Yes" value={isAnon} onChange={setIsAnon} />
            </View>

            {!isAnon && (
                <>
                    <View style={styles.field}>
                        <StyledText type='defaultSemiBold' style={styles.fieldHeader}>ID or Passport Number</StyledText>
                        <Controller
                            rules={!isAnon ? { required: 'ID number is required' } : {}}
                            control={control}
                            name="id_no"
                            render={({ field: { onChange, value } }) => (
                                <TextInput placeholder="ID No" style={styles.input} value={value} onChangeText={onChange} />
                            )}
                        />
                        {errors.id_no && (
                            <StyledText style={styles.errorText}>{errors.id_no.message}</StyledText>
                        )}
                    </View>
                    
                    <View style={styles.field}>
                        <StyledText type='defaultSemiBold' style={styles.fieldHeader}>First Name</StyledText>
                        <Controller
                            control={control}
                            name="first_name"
                            rules={!isAnon ? { required: ' First name is required' } : {}}
                            render={({ field: { onChange, value } }) => (
                                <TextInput placeholder="First Name" style={styles.input} value={value} onChangeText={onChange} />
                            )}
                        />
                        {errors.first_name && (
                            <StyledText style={styles.errorText}>{errors.first_name.message}</StyledText>
                        )}
                    </View>

                    <View style={styles.field}>
                        <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Last Name</StyledText>
                        <Controller
                            control={control}
                            name="last_name"
                            rules={!isAnon ? { required: ' Last name is required' } : {}}
                            render={({ field: { onChange, value } }) => (
                                <TextInput placeholder="Last Name" style={styles.input} value={value} onChangeText={onChange} />
                            )}
                        />
                        {errors.last_name && (
                            <StyledText style={styles.errorText}>{errors.last_name.message}</StyledText>
                        )}
                    </View>
                </>
            )}

            {meta && (
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Sex</StyledText>
                    <Controller
                        name="sex"
                        control={control}
                        rules={{ required: 'Sex is required' }}
                        render={({ field: { value, onChange } }) => (
                            <SimplePicker 
                                name="sex"
                                values={meta.sex}
                                value={value}
                                callback={onChange}
                            />
                        )}
                    />
                    {errors.sex && <StyledText style={styles.errorText}>{errors.sex.message}</StyledText>}
                </View>
            )}

            {isAnon && meta && (
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Age Range</StyledText>
                    <Controller
                        name="age_range"
                        control={control}
                        rules={isAnon ?  {required: 'Age range is required'} : {}}
                        render={({ field: { value, onChange } }) => (
                            <SimplePicker
                                name="age_range"
                                values={meta.age_range}
                                value={value}
                                callback={onChange}
                            />
                        )}
                    />
                    {errors.age_range && <StyledText style={styles.errorText}>{errors.age_range.message}</StyledText>}
                </View>
            )}

            {!isAnon && (
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Date of Birth</StyledText>
                    <Controller
                        control={control}
                        name="dob"
                        defaultValue={null}
                        rules={{
                            validate: (value) => {
                            if (!isAnon && !value) {
                                return 'Date of birth is required';
                            }
                            if (!isAnon && new Date(value) > new Date()) {
                                return 'Date cannot be in the future';
                            }
                            return true;
                            }
                        }}
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <View>
                                <TouchableOpacity onPress={() => setShowDate(true)} style={styles.button}>
                                    <StyledText style={styles.buttonText} type="defaultSemiBold">
                                    {value ? new Date(value).toDateString() : 'Select date'}
                                    </StyledText>
                                </TouchableOpacity>
                                {showDate && (
                                    <DateTimePicker
                                    value={new Date(value)}
                                    mode="date"
                                    display="default"
                                    onChange={(_, selectedDate) => {
                                        setShowDate(false);
                                        if (selectedDate) onChange(selectedDate);
                                    }}
                                    />
                                )}
                            {error && <StyledText style={styles.errorText}>{error.message}</StyledText>}
                            </View>
                        )}
                        />
                </View>
            )}

            {!isAnon && 
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Ward</StyledText>
                    <Controller
                        control={control}
                        name="ward"
                        render={({ field: { onChange, value } }) => (
                            <TextInput placeholder="Ward" style={styles.input} value={value} onChangeText={onChange} />
                        )}
                    />
                </View>
            }

            <View style={styles.field}>
                <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Village</StyledText>
                <Controller
                    control={control}
                    name="village"
                    rules={{ required: 'Village is required' }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput placeholder="Village" style={styles.input} value={value} onChangeText={onChange} />
                    )}
                />
                {errors.village && (
                    <StyledText style={styles.errorText}>{errors.village.message}</StyledText>
                )}
            </View>

            {meta && 
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>District</StyledText>
                    <Controller
                        name="district"
                        control={control}
                        rules={{required: 'District is required'}}
                        render={({ field: { value, onChange } }) => (
                            <SimplePicker
                                name="district"
                                values={meta.districts}
                                value={value}
                                callback={onChange}
                            />
                        )}
                    />
                    {errors.district && <StyledText style={styles.errorText}>{errors.district.message}</StyledText>}
                </View >
            }

            <View style={styles.field}>
                <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Citizenship</StyledText>
                <Controller
                    control={control}
                    name="citizenship"
                    rules={{ required: 'Citizenship is required' }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput placeholder="Citizenship" style={styles.input} value={value} onChangeText={onChange} />
                    )}
                />
                {errors.first_name && (
                    <StyledText style={styles.errorText}>{errors.first_name.message}</StyledText>
                )}
            </View>

            {meta && 
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Key Population Status</StyledText>
                    <Checkboxes
                        values={meta.kp_types}
                        label="Key Population Types"
                        selected={watch('kp_status_names')}
                        onChange={(val) => setValue('kp_status_names', val)}
                    />
                </View>
            }

            {meta && 
                <View style={styles.field}>
                    <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Key Population Status</StyledText>
                    <Checkboxes
                        values={meta.disability_types}
                        label="Disability Types"
                        selected={watch('disability_status_names')}
                        onChange={(val) => setValue('disability_status_names', val)}
                    />
                </View>
                }

            {!isAnon && (
                <>
                    <View style={styles.field}>
                        <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Email</StyledText>
                        <Controller
                            control={control}
                            rules={{pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email address' } }}
                            name="email"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    keyboardType="email-address"
                                    placeholder="person@email.com"
                                    style={styles.input}
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                        {errors.email && (
                            <StyledText style={styles.errorText}>{errors.email.message}</StyledText>
                        )}
                    </View>
                    <View style={styles.field}>
                        <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Phone Number</StyledText>
                        <Controller
                            control={control}
                            name="phone"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    keyboardType="phone-pad"
                                    placeholder="+267 71 234 567"
                                    style={styles.input}
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                    </View>
                </>
            )}
            <View style={styles.field}>
                <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Is this person pregnant?</StyledText>
                <Controller
                    control={control}
                    name="is_pregnant"
                    render={({ field: { onChange, value } }) => (
                        <ToggleCheckbox label="Yes" value={value} onChange={onChange} />
                    )}
                />
            </View>

            <View style={styles.field}>
                <StyledText type='defaultSemiBold' style={styles.fieldHeader}>Is this person HIV positive?</StyledText>
                <Controller
                    control={control}
                    name="hiv_positive"
                    render={({ field: { onChange, value } }) => (
                        <ToggleCheckbox label="Yes" value={value} onChange={onChange} />
                    )}
                />
            </View>



            <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit, (formErrors) => {
                console.log("Validation errors:", formErrors);
            })}>
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('(tabs)', { screen: 'Record' })}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.spacer}>

            </View>
        </StyledScroll>
    );
}

const styles = StyleSheet.create({
    form:{
        marginTop: 30,
    },
    field: {
        backgroundColor: theme.colors.bonasoMain,
        padding: 20,
        margin: 7,
    },
    fieldHeader:{
        textAlign: 'center',
    },
    errorText:{
        color: theme.colors.errorText,
        backgroundColor: theme.colors.errorBg,
        padding: 5,
        margin: 10,
        borderWidth: 4,
        borderColor: theme.colors.error,
    },
    input: {
        padding: 15,
        backgroundColor: '#fff',
    },
    picker: {
        borderRadius: 8,
        backgroundColor: theme.colors.bonasoDarkAccent,
        marginBottom: 20,
    },
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        marginVertical: 8,
    },
    button: {
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    spacer: {
        padding: 60,
    }
});