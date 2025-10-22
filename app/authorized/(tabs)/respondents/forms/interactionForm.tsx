import LoadingScreen from "@/components/Loading";
import FormSection from "@/components/forms/FormSection";
import StyledButton from "@/components/inputs/StyledButton";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import { Interaction } from "@/database/ORM/tables/interactions";
import { Respondent } from "@/database/ORM/tables/respondents";
import { Task } from "@/database/ORM/tables/tasks";
import checkDate from "@/services/checkDate";
import fetchWithAuth from "@/services/fetchWithAuth";
import { calcDefault } from '@/services/interactions/calcDefault';
import { checkLogic } from '@/services/interactions/checkLogic';
import prettyDates from "@/services/prettyDates";
import syncTasks from "@/services/syncTasks";
import theme from "@/themes/themes";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import ResponseField from '../../../../../components/respondents/responseField';

export default function AssessmentForm(){
    const router = useRouter();
    const { offlineMode } = useAuth();
    
    const { isServerReachable } = useConnection(); 
    const { respondentId, localRespondentId, taskId, serverIrId, localIrId } = useLocalSearchParams()
    const [existing, setExisting] = useState(null);

    const [task, setTask] = useState(null);
    const [respondent, setRespondent] = useState(null);
    const [redirectId, setRedirectId] = useState('')
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);


    //load tasks by default
    useEffect(() => {
        if(!taskId) return;
        const loadTasks = async () => {
            setLoading(true);
            if (isServerReachable){
                await syncTasks(); //try to fetch online if tasks are over 12 hours old
            }   
            const myTasks = await Task.find(taskId);
            if(!myTasks) return;
            let serialized = await myTasks.serialize();
            setTask(serialized);
            setLoading(false);
        };
        loadTasks();
    }, [isServerReachable, taskId]);

    useEffect(() => {
        const getInteraction = async () => {
            setLoading(true)
            if(serverIrId){
                try {
                    console.log('fetching indicator details...');
                    const response = await fetchWithAuth(`/api/record/interactions/${serverIrId}/`);
                    const data = await response.json();
                    if(response.ok){
                        //update the context
                        setExisting(data);
                        setRespondent(data.respondent)
                        setRedirectId(data.respondent.id)
                    }
                } 
                catch (err) {
                    console.error('Failed to fetch interaction: ', err);
                } 
                finally {
                    setLoading(false);
                }
            }
            else if(localIrId){
                try{
                    setLoading(true);
                    const found = await Interaction.find(localIrId);
                    const serialized = await found?.serialize();
                    setExisting(serialized)
                    setRedirectId(`-${serialized.respondent_uuid}`); //set redirect Id to the interaction's respondent
                }
                catch(err){
                    console.error('Failed to fetch local interaction: ', err)
                }
                finally{
                    setLoading(false);
                }
            }
        }
        getInteraction();
    }, [localIrId, serverIrId]);

    useEffect(() => {
        const getRespondentDetails = async () => {
            if(respondentId && isServerReachable){
                try {
                    console.log('fetching indicator details...');
                    const response = await fetchWithAuth(`/api/record/respondents/${respondentId}/`);
                    const data = await response.json();
                    if(response.ok){
                        setRespondent(data);
                    }
                } 
                catch (err) {
                    console.error('Failed to fetch respondent: ', err);
                } 
                finally {
                    setLoading(false);
                }
            }
            else if(localRespondentId){
                try{
                    setLoading(true); 
                    const found = await Respondent.find(localRespondentId, 'local_id');
                    const serialized = await found?.serialize();
                    setRespondent(serialized);
                }
                catch(err){
                    console.error('Failed to fetch local respondent: ', err)
                }
                finally{
                    setLoading(false);
                }
            }
        };
        getRespondentDetails();
    }, [respondentId, localRespondentId]);

    const onSubmit = async (data) => {
        data.respondent_uuid = localRespondentId;
        data.task_id = taskId;

        //make sure date is within the project range and not in the future
        const projectStart = new Date(existing?.task?.project?.start);
        const projectEnd = new Date(existing?.task?.project?.end);
        const interactionDate = new Date(data.interaction_date);
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
        data.interaction_date = checkDate(data.interaction_date)
        let result = null; //placeholder to track saved Id
        //if online, try to upload changes directly

        if(serverIrId && isServerReachable && !offlineMode){
            try{
                data.respondent_id = respondent?.id;
                setLoading(true);
                console.log('uploading interaction', data);
                const response = await fetchWithAuth(`/api/record/interactions/${serverIrId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const returnData = await response.json();
                if(response.ok){
                    router.push({ pathname: `/authorized/(tabs)/respondents/${redirectId}` });
                }
                else{
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
        else if(serverIrId && !isServerReachable){
            alert('Please reconnect to edit this interaction.');
            return;
        }
        //try saving and then uploading the data
        else{
            try{
                setLoading(true);
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
                    alert('Interaction saved. Will sync next time connection is found.');
                    router.push({ pathname: `/authorized/(tabs)/respondents/${redirectId}` });
                }
            }
            catch(err){
                console.error(err);
            }   
            finally{
                setLoading(false);
            }
        }
        return result
    };
    const defaultValues = useMemo(() => {
        return {
            interaction_date: existing?.interaction_date ?? '',
            interaction_location: existing?.interaction_location ?? '',
            response_data: calcDefault(task?.assessment, existing),
            comments: existing?.comments ?? '',
        }
    }, [existing]);

    const methods = useForm({ defaultValues });
    const { register, unregister, control, handleSubmit, reset, watch, setFocus, getValues, setValue, formState: { errors } } = methods;
    
    //scroll to errors
    const onError = (errors) => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            setFocus(firstError); // sets cursor into the field
            // scroll the element into view smoothly
            const field = document.querySelector(`[name="${firstError}"]`);
            if (field && field.scrollIntoView) {
            field.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    };

    //load existing values once existing loads, if provided
    useEffect(() => {
        if (task?.assessment) {
            const defaults = {
                interaction_date: existing?.interaction_date ?? '',
                interaction_location: existing?.interaction_location ?? '',
                response_data: calcDefault(task?.assessment, existing),
                comments: existing?.comments ?? '',
            };
            reset(defaults);
        }
    }, [task?.assessment, existing, reset]);

    const responseInfo = useWatch({ control, name: "response_data" });
    
    const visibilityMap = useMemo(() => {
        if(serverIrId && !existing) return null;
        if(!task?.assessment || !respondent) return {};
        const map = {}
        task?.assessment.indicators.forEach((ind) => {
             const logic = ind.logic;
            //no logic, always return true
            if(!logic?.conditions || logic?.conditions?.length == 0) map[ind.id] = true;
            else if(ind.logic.group_operator == 'AND'){
                map[ind.id] = logic.conditions.every(c => (checkLogic(c, responseInfo, task?.assessment, respondent)))
            }
            //must be an OR
            else{
                map[ind.id] =  logic.conditions.some(c => (checkLogic(c, responseInfo, task?.assessment, respondent)))
            }
        });
        return map;
    }, [responseInfo]);

    useEffect(() => {
        if (!task?.assessment || !respondent || !visibilityMap) return;
        task?.assessment.indicators.forEach(ind => {
            if (!visibilityMap[ind.id]) {
                const currentValue = responseInfo?.[ind.id]?.value;
                // ✅ Only unregister/reset if there’s actually data
                if (currentValue !== undefined) {
                    setValue(`response_data.${ind.id}`, {}, { shouldDirty: false });
                    unregister(`response_data.${ind.id}.value`);
                }
            }
        });
    }, [visibilityMap, unregister, task?.assessment, respondent]);

     const optionsMap = useMemo(() => {
        if(serverIrId && !existing) return null;
        if(!task?.assessment) return {};
        const map = {}
        task?.assessment.indicators.forEach((ind) => {
            if(['boolean'].includes(ind.type)){
                map[ind.id] = [{value: true, label: 'Yes'}, {value: false, label: 'No'}];
                return;
            }
            else if(!['single', 'multi', 'multint'].includes(ind.type)){
                map[ind.id] = [] //keep each value in map as an array to avoid issues down the line
                return;
            }
            let opts = ind?.options?.map((o) => ({value: o.id, label: o.name})) ?? [];
            if(ind.allow_none) opts.push({value: 'none', label: 'None of the above'})
            if(ind.match_options){
                const valid = responseInfo?.[ind.match_options]?.value;
                opts = opts.filter(o => (valid?.includes(o?.value) || o?.value == 'none'));
            }
            map[ind.id] = opts
        })
        return map
    }, [task?.assessment, responseInfo]);

    useEffect(() => {
        if(!task?.assessment || !optionsMap) return;
        if(serverIrId && !existing) return;
        task?.assessment.indicators.forEach((ind) => {
            const options = optionsMap[ind.id]
            if (!['single', 'multi'].includes(ind.type)) return;
            if (!options || options.length === 0) return;

            const val = getValues(`response_data.${ind.id}.value`);
            const valid_ids = options.map(p => p.value);

            if (ind.type === 'multi') {
                const valArray = Array.isArray(val) ? val : [];
                const filtered = valArray.filter(v => valid_ids.includes(v));
                if (JSON.stringify(valArray) !== JSON.stringify(filtered)) {
                    setValue(`response_data.${ind.id}.value`, filtered);
                }
            }
            if (ind.type === 'single') {
                const useVal = valid_ids.includes(val) ? val : null;
                if (JSON.stringify(val) !== JSON.stringify(useVal)) {
                    setValue(`response_data.${ind.id}.value`, useVal);
                }
            }
        });
    }, [optionsMap]);

    const basics = [
        { name: 'interaction_date', label: 'Date of Interaction', type: "date", rules: { required: "Required", },
            tooltip: 'Give it a memorable name.',
        },
        { name: 'interaction_location', label: "Location of Interaction", type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
                placeholder: 'A brief overview, the purpose, objectives, anything...'
        },
    ]
    const comments = [
        {name: 'comments', label: 'Comments/Notes', type: 'textarea'}
    ]

    const visibleInds = (task?.assessment && respondent && visibilityMap) ? task?.assessment.indicators.filter(ind => (visibilityMap[ind.id])) : [];
    if(loading || !respondent || !task?.assessment || !visibilityMap) return <LoadingScreen />
    return(
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bonasoDarkAccent }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StyledScroll>
                <FormProvider {...methods} >
                    <FormSection control={control} fields={basics} header={'Date & Location'} />

                    {task?.assessment.indicators.sort((a, b) => a.indicator_order-b.indicator_order).map((ind) => (
                        <ResponseField indicator={ind} shouldShow={visibilityMap[ind.id]} options={optionsMap[ind.id]} />
                    ))}
                    {visibleInds.length == 0 && <View>
                        <StyledText>This respondent is not eligible for this assessment.</StyledText>
                    </View>}
                    <FormSection control={control} fields={comments} />
                    {visibleInds.length > 0 && < StyledButton onPress={handleSubmit(onSubmit, (formErrors) => {
                            console.log("Validation errors:", formErrors);
                        })} label={'Submit'} 
                    />}
                    <StyledButton onPress={() => router.push(`/authorized/(tabs)/respondents/${redirectId}`)} label={'Cancel'}/>
                </FormProvider>
                <View style={{ padding: 40}}></View>
            </StyledScroll>
        </KeyboardAvoidingView>
    )
}