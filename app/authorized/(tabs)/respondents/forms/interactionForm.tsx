import FormSection from "@/components/forms/FormSection";
import StyledButton from "@/components/inputs/StyledButton";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import checkDate from "@/services/checkDate";
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

export default function EditInteraction(){
    //navigator the help with directions to/from
    const router = useRouter();
    const [redirectId, setRedirectId] = useState('');
    const { localId, serverId } = useLocalSearchParams();
    const { isServerReachable } = useConnection();

    const [existing, setExisting] = useState(null);
    useEffect(() => {
        if (localId) {
            (async () => {
                const found = await Interaction.find(localId);
                console.log(found)
                const serialized = await found?.serialize();
                setExisting(serialized);
                setRedirectId(`-${serialized.respondent_uuid}`);
            })();
        }
        if(serverId) {
            (async () => {
                try {
                    const response = await fetchWithAuth(`/api/record/interactions/${serverId}/`);
                    const data = await response.json();
                    if (response.ok) {
                        setExisting(data);
                        setRedirectId(data.id);
                    } 
                    else {
                        console.error('API error', response.status);
                    }
                } 
                catch (err) {
                    console.error('Error fetching respondent', err);
                }
            })();
        }
    }, [localId, serverId]);


    const handleDelete = async() => {
        try{
            if(existing?.id){
                await Interaction.delete(existing.id)
            }
            router.push(`/authorized/(tabs)/respondents/${redirectId}`)
        }
        catch(err){
            console.error(err);
        }
    }

    //handle submission
    const onSubmit = async (data) => {
        //in case of switching, set stale fields to null
        data.interaction_date= checkDate(data.interaction_date);
        if(!data.interaction_date){
            alert('A valid date positive is Required.');
            return;
        }
        if(data.interaction_location == ''){
            alert('Interaction location is required.');
            return;
        }
        let result = null
        if(serverId && isServerReachable){
            try{
                if(data.numeric_component == '') data.numeric_component = null;
                data.subcategories_data = data.subcategory_data;
                console.log('uploading interaction', data);
                const response = await fetchWithAuth(`/api/record/interactions/${serverId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const returnData = await response.json();
                if(!response.ok){
                    console.error(returnData);
                }
            }
            catch(err){
                console.error(err);
            }
        }
        else if(serverId && !isServerReachable){
            alert('Please reconnect to edit this interaction.')
        }
        //try saving/uploading the data
        else{
            try{
                console.log('submitting data...', data);
                result = await Interaction.save(data, existing?.id); //save locally first
                //if connected, try to upload the data
                if (isServerReachable) {
                    try {
                        //upload the interaction
                        const uploaded = await Interaction.upload();
                        //automatically redirect the user to the record page with this respondent loaded by passing the server id
                        router.push({ pathname: `/authorized/(tabs)/respondents/${redirectId}` });
                        return uploaded
                    } 
                    catch (err) {
                        alert('Interaction saved, but the upload failed. Will try again next time connection is found.');
                        console.error('Upload failed', err);
                    }
                }
                else{
                    alert('Interaction saved. Will sync next time connection is found.')
                }
            }
            catch(err){
                console.error(err);
            }   
        }
        //if not connected/uploaded, redirect using the local id
        router.push({ pathname: `/authorized/(tabs)/respondents/${redirectId}` });
        return result
    };
    const subcatData = useMemo(() => {
        if(!existing || !existing?.subcategory_data || existing?.subcategory_data?.length === 0) return [];
        if(existing?.task?.indicator?.require_numeric){
            return existing?.subcategory_data?.map(cat => (
                {
                    id: cat?.id, 
                    subcategory:{'id': cat?.subcategory?.id}, 
                    numeric_component: cat?.numeric_component
                }
            )) ?? []
        }
        else{
            return existing?.subcategory_data?.map(cat => cat?.subcategory?.id) ?? []
        }
    }, [existing]);

    const defaultValues = useMemo(() => {
        return {
            interaction_date: existing?.interaction_date ?? null,
            interaction_location: existing?.interaction_location ?? '',
            numeric_component: existing?.numeric_component ?? '',
            subcategory_data: serverId ? existing?.subcategories : subcatData,
        }
    }, [existing]); 

    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const info = [
        {name: 'interaction_date', label: 'Date of Interaction', type: 'date', rules: {required: 'Required'}},
        {name: 'interaction_location', label: 'Interaction Location', type: 'text', rules: {required: 'Required', maxLength: { value: 255, message: 'Maximum length is 255 characters.'}}},
    ]
    const numeric = [
        {name: 'numeric_component', label: 'Number Distributed', type: 'number', rules: {required: 'Required'}},
    ]
    const subcats = [
        {name: 'subcategory_data', label: 'Subcategories',  type: `${existing?.task?.indicator?.require_numeric ? 'multinumber' : 'multicheckbox'}`,
            options: existing?.task?.indicator?.subcategories
        }
    ]

    return (
        <KeyboardAvoidingView
                        style={styles.bg}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
        <StyledScroll>
            <View style={styles.form}>
                <StyledText type='title'>Editing Interaction</StyledText>
                <FormSection fields={info} control={control} header={'Respondent Anonymity'} />
                {existing?.task?.indicator?.require_numeric && existing?.task?.indicator?.subcategories?.length == 0 &&
                    <FormSection fields={numeric} control={control} header='Basic Information' />}
                {existing?.task?.indicator?.subcategories?.length > 0 && 
                    <FormSection fields={subcats} control={control} header='Basic Information' />}

                < StyledButton onPress={handleSubmit(onSubmit, (formErrors) => {
                        console.log("Validation errors:", formErrors);
                    })} label={'Submit'} 
                />
                <StyledButton onPress={() => router.push(`/authorized/(tabs)/respondents/${redirectId}`)} label={'Cancel'}/>
                {existing && !serverId && <StyledButton onPress={handleDelete} label={'Delete'}/>}
            </View>

            <View style={styles.spacer}>

            </View>
        </StyledScroll>
        </KeyboardAvoidingView>
    );
}
const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: theme.colors.bonasoDarkAccent,
    },
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
    spacer: {
        padding: 60,
    }
});