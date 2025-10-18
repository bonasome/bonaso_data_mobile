import FormSection from "@/components/forms/FormSection";
import StyledButton from "@/components/inputs/StyledButton";
import LoadingScreen from "@/components/Loading";
import StyledScroll from "@/components/styledScroll";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import checkDate from "@/services/checkDate";
import fetchWithAuth from "@/services/fetchWithAuth";
import prettyDates from "@/services/prettyDates";
import theme from "@/themes/themes";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, View } from "react-native";

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
    const [loading, setLoading] = useState(false);
    //fetch the existing record
    useEffect(() => {
        //if local ID param is passed, find it from the local database
        if (localId) {
            (async () => {
                setLoading(true);
                const found = await Interaction.find(localId);
                const serialized = await found?.serialize();
                setExisting(serialized);
                setRedirectId(`-${serialized.respondent_uuid}`); //set redirect ID to the interaction's respondent
                setLoading(false);
            })();
        }
        //if server ID is passed, 
        if(serverId) {
            (async () => {
                try {
                    setLoading(true);
                    const response = await fetchWithAuth(`/api/record/interactions/${serverId}/`);
                    const data = await response.json();
                    if (response.ok) {
                        setExisting(data);
                        setRedirectId(data.respondent); //set redirect ID to the interaction's respondent
                    } 
                    else {
                        console.error('Server error:', response.status);
                    }
                } 
                catch (err) {
                    console.error('Error fetching respondent', err);
                }
                finally{
                    setLoading(false);
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
        data.interaction_date = checkDate(data.interaction_date); //will return ISO string if ISO string (default) or date object (has been edited)
        if(!data.interaction_date){
            alert('A valid interaction date is Required.');
            return;
        }
        //make sure date is within the project range and not in the future
        const projectStart = new Date(existing?.task?.project?.start);
        const projectEnd = new Date(existing?.task?.project?.end);
        const interactionDate = new Date(data.interaction_date);

        // midnight today (strip time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        interactionDate.setHours(0,0,0,0)
        if(interactionDate > today){
            alert('Interaction date cannot be in the future.');
            return;
        }
        if (interactionDate < projectStart || interactionDate > projectEnd) {
            alert(`Interaction date outside of project scope. Please select a date between ${prettyDates(existing?.task?.project?.start)} and ${prettyDates(existing?.task?.project?.end)}`);
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
                setLoading(true);
                if(data.numeric_component == '') data.numeric_component = null;
                data.subcategories_data = existing?.task?.indicator?.require_numeric ? data.subcategory_data : data.subcategory_data?.map(cat => ({id:null, subcategory:{id: cat}, numeric_component: null}));
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
            finally{
                setLoading(false);
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
                setLoading(true);
                //if subcategories and no numeric, convert the list of ids returned by checkbox to objects the DB expects
                if(!existing?.task?.indicator?.require_numeric && existing?.task?.indicator?.subcategories?.length > 0){
                    data.subcategory_data = data.subcategory_data.map(c => {
                        const name = existing.task.indicator.subcategories.find(o => o.id == c)?.name
                        return {id: null, subcategory: {id: c, name: name}, numeric_component: null};
                    })
                }
                console.log('submitting data...', data);
                //save the interaction locally in case of connection interrupt
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
            finally{
                setLoading(true);
            }
        }
        //if not connected/uploaded, redirect using the local id
        router.push({ pathname: `/authorized/(tabs)/respondents/${redirectId}` });
        return result
    };

    //prepare existing subcategory data based on whether a number is required
    const subcatData = useMemo(() => {
        if(!existing || !existing?.subcategories || existing?.subcategories?.length === 0) return [];// return empty array if not data
        //map with numbers if requires numeric
        if(existing?.task?.indicator?.require_numeric){
            return existing?.subcategories?.map(cat => (
                {
                    id: cat?.id, 
                    subcategory:{'id': cat?.subcategory?.id}, 
                    numeric_component: cat?.numeric_component
                }
            )) ?? []
        }
        //if no subcats, convert to array of ints for checkbox component
        else{
            return existing?.subcategories?.map(cat => cat?.subcategory?.id) ?? [];
        }
    }, [existing]);

    //set default values
    const defaultValues = useMemo(() => {
        return {
            interaction_date: existing?.interaction_date ?? null,
            interaction_location: existing?.interaction_location ?? '',
            numeric_component: existing?.numeric_component?.toString() ?? '',
            subcategory_data: subcatData, //interaction ORM will expect this as subcategory data
            comments: existing?.comments ?? '',
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
    console.log(existing)
    const info = [
        {name: 'interaction_date', label: 'Date of Interaction', type: 'date', rules: {required: 'Required'}},
        {name: 'interaction_location', label: 'Interaction Location', type: 'text', rules: {required: 'Required', maxLength: { value: 255, message: 'Maximum length is 255 characters.'}}},
    ]
    //only show if require_numeric is true and there are no subcategories
    const numeric = [
        {name: 'numeric_component', label: 'Number Distributed', type: 'numeric', rules: {required: 'Required'}},
    ]
    //show if subcategories
    const subcats = [
        {name: 'subcategory_data', label: 'Subcategories',  type: `${existing?.task?.indicator?.require_numeric ? 'multinumber' : 'multiselect'}`,
            options: existing?.task?.indicator?.subcategories, valueField: 'id', labelField: 'name', rules: {required: 'Required'}
        }
    ]
    //optional comments
    const comments = [
        {name: 'comments', label: 'Comments', type: 'textarea'}
    ]

    if(loading) return <LoadingScreen />
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bonasoDarkAccent }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StyledScroll>
                <View style={{ marginTop: 20 }}>
                    <FormSection fields={info} control={control} header={'Editing Interaction'} />
                    {existing?.task?.indicator?.require_numeric && existing?.task?.indicator?.subcategories?.length == 0 &&
                        <FormSection fields={numeric} control={control} />}
                    {existing?.task?.indicator?.subcategories?.length > 0 && 
                        <FormSection fields={subcats} control={control} />}
                    <FormSection fields={comments} control={control} />
                    < StyledButton onPress={handleSubmit(onSubmit, (formErrors) => {
                            console.log("Validation errors:", formErrors);
                        })} label={'Submit'} 
                    />
                    <StyledButton onPress={() => router.push(`/authorized/(tabs)/respondents/${redirectId}`)} label={'Cancel'}/>
                    {existing && !serverId && <StyledButton onPress={handleDelete} label={'Delete'}/>}
                </View>
                <View style={{ padding: 30 }}></View>
            </StyledScroll>
        </KeyboardAvoidingView>
    );
}