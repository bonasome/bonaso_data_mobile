import FormSection from "@/components/forms/FormSection";
import StyledButton from "@/components/inputs/StyledButton";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
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
    /*
    Component that allows a user to edit an existing interaction (either stored on the server or locally
    stored). Accepts a localId or serverId URL param which will point to either the server record or the local
    record that the user intends to edit and load default values based on that. 
    */

    const router = useRouter();
    //connection/auth contexts
    const { isServerReachable } = useConnection();
    const { offlineMode } = useAuth();

    const { localId, serverId } = useLocalSearchParams(); //URL params to fetch correct record

    const [redirectId, setRedirectId] = useState(''); //what id to use when redirecting the user back to the respondent detail page
    
    const [existing, setExisting] = useState(null); //existing record

    //fetch the existing record
    useEffect(() => {
        //if local ID param is passed, find it from the local database
        if (localId) {
            (async () => {
                const found = await Interaction.find(localId);
                console.log(found)
                const serialized = await found?.serialize();
                setExisting(serialized);
                setRedirectId(`-${serialized.respondent_uuid}`); //set redirect ID to the interaction's respondent
            })();
        }
        //if server ID is passed, 
        if(serverId) {
            (async () => {
                try {
                    const response = await fetchWithAuth(`/api/record/interactions/${serverId}/`);
                    const data = await response.json();
                    if (response.ok) {
                        setExisting(data);
                        setRedirectId(data.respondent.id); //set redirect ID to the interaction's respondent
                    } 
                    else {
                        console.error('Server error:', response.status);
                    }
                } 
                catch (err) {
                    console.error('Error fetching respondent', err);
                }
            })();
        }
    }, [localId, serverId]);

    //allow the user to delete an interaction that has not yet been uploaded to the server
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
        //make sure interaction date is valid
        data.interaction_date= checkDate(data.interaction_date); //will return ISO string if ISO string (default) or date object (has been edited)
        if(!data.interaction_date){
            alert('A valid interaction date is Required.');
            return;
        }
        //also require location
        if(data.interaction_location == ''){
            alert('Interaction location is required.');
            return;
        }
        let result = null; //placeholder to track saved ID

        //if online, try to upload changes directly
        if(serverId && isServerReachable && !offlineMode){
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
        //if connection was lost while editing, throw an error to alert the user
        else if(serverId && !isServerReachable){
            alert('Please reconnect to edit this interaction.');
            return;
        }
        //try saving and then uploading the data
        else{
            try{
                //save locally
                console.log('submitting data...', data);
                result = await Interaction.save(data, existing?.id); //save locally first
                //if connected, try to upload the data
                //upload locally (in edge case where server error prevents something from being uploaded)
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

    //prepare existing subcategory data based on whether a number is required
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

    //set default values
    const defaultValues = useMemo(() => {
        return {
            interaction_date: existing?.interaction_date ?? null,
            interaction_location: existing?.interaction_location ?? '',
            numeric_component: existing?.numeric_component ?? '',
            subcategory_data: serverId ? existing?.subcategories : subcatData,
        }
    }, [existing]); 

    //construct RHF variables
    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({ defaultValues });

    //set default values to existing once loaded
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const info = [
        {name: 'interaction_date', label: 'Date of Interaction', type: 'date', rules: {required: 'Required'}},
        {name: 'interaction_location', label: 'Interaction Location', type: 'text', rules: {required: 'Required', maxLength: { value: 255, message: 'Maximum length is 255 characters.'}}},
    ]
    //only show if require_numeric is true and there are no subcategories
    const numeric = [
        {name: 'numeric_component', label: 'Number Distributed', type: 'number', rules: {required: 'Required'}},
    ]
    //show if subcategories
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

                <View style={{ padding: 30 }}>

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
});