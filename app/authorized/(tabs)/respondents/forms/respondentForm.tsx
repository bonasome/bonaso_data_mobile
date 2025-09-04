import FormSection from '@/components/forms/FormSection';
import StyledButton from '@/components/inputs/StyledButton';
import LoadingScreen from '@/components/Loading';
import StyledScroll from '@/components/styledScroll';
import StyledText from '@/components/styledText';
import { useConnection } from '@/context/ConnectionContext';
import getMeta from '@/database/ORM/getMeta';
import { Respondent, RespondentLink } from '@/database/ORM/tables/respondents';
import checkDate from '@/services/checkDate';
import fetchWithAuth from '@/services/fetchWithAuth';
import theme from '@/themes/themes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import countries from 'world-countries';


export default function CreateRespondent() {
    /*
    Form that allows a user to create or edit a respondent, either locally or from the server. 
    Optionally takes either a localId or serverId URL param for editing existing values. If a serverId is 
    provided and the user is online, form changes go directly to the server. If localId is provided, changes
    will be saved locally and uploaded when there is connection.  
    */
    //navigator the help with directions to/from
    const router = useRouter();
    const { localId, serverId } = useLocalSearchParams();
    //connection state
    const { isServerReachable } = useConnection();
    //existing information
    const [existing, setExisting] = useState(null);
    const [display, setDisplay] = useState(''); //name/value to display
    const [redirectId, setRedirectId] = useState(''); //id to use when redirecting to detail page
    //meta containing options/labels for certain fields
    const [meta, setMeta] = useState(null); 
    
    const [loading, setLoading] = useState(false);

    //load existing data (if provided)
     useEffect(() => {
        //if localId is provided, search the local DB for the value
        if (localId) {
            (async () => {
                setLoading(true);
                const found = await Respondent.find(localId, 'local_id');
                const serialized = await found?.serialize();
                setExisting(serialized);
                setRedirectId(`-${localId}`); //redirect based on localId
                setLoading(false);
                setDisplay(serialized.is_anonymous ? `Anonymous Respondent ${serialized.local_id}` : `${serialized.first_name} ${serialized.last_name}`);
            })();
        }
        //if serverId and user is online, check the server for the respondent
        if (serverId && isServerReachable) {
            (async () => {
                try {
                    setLoading(true);
                    const response = await fetchWithAuth(`/api/record/respondents/${serverId}/`);
                    const data = await response.json();
                    if (response.ok) {
                        setExisting(data);
                        setRedirectId(`${data.id}`); //redirect to detail page based on serverId
                        setDisplay(data.display_name);
                    } 
                    else {
                        console.error('API error', response.status);
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

    //load the meta (from local storage)
    useEffect(() => {
        let isMounted = true;
        const loadMeta = async () => {
            try {
                const localMeta = await getMeta();
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
        loadMeta();
        return () => {
            isMounted = false;
        };
    }, []);

    //helper function to load most recent pregnancy data (since unlike the website, the app only tracks the most recent pregnancy)
    const pregnancyInfo = useMemo(() => {
        //if no pregnnacy data, return nothing
        if(!serverId || !existing) return null;
        if(!existing?.pregnancies || existing?.pregnancies?.length == 0) return null
        //find most recent pregnancy by term_began
        let most_recent = existing?.pregnancies?.reduce((latest, current) => {
            return new Date(current.term_began) > new Date(latest.term_began) ? current : latest;
        });
        //set existing date values based on this
        if(most_recent.term_began) most_recent.term_began = new Date(most_recent.term_began);
        if(most_recent.term_ended) most_recent.term_ended = new Date(most_recent.term_ended);
        return most_recent
    }, [existing]);


    //set the default values
    const defaultValues = useMemo(() => {
        return {
            is_anonymous: existing?.is_anonymous ?? false,

            id_no: existing?.id_no ?? '',
            first_name: existing?.first_name ?? '',
            last_name: existing?.last_name ?? '',

            sex: existing?.sex ?? null,
            age_range: existing?.age_range ?? '',
            dob: existing?.dob ?? null,
            
            plot_no: existing?.plot_no ?? '',
            ward: existing?.ward ?? '',
            village: existing?.village ?? '',
            district: existing?.district ?? '',
            citizenship: existing?.citizenship ?? 'BW',

            kp_status: existing?.kp_status?.map((kp) => (kp.name)) ?? [],
            disability_status: existing?.disability_status?.map((d) => (d.name)) ?? [],
            
            hiv_positive: serverId ? existing?.hiv_status?.hiv_positive : existing?.hiv_positive ?? false,
            date_positive: serverId ?  existing?.hiv_status?.date_positive  : existing?.date_positive ?? null,

            email: existing?.email ?? '',
            phone_number: existing?.phone_number ?? '',

        }
    }, [existing]);

    //constrct RHF variables
    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({ defaultValues });

    const dateValidation = (dateString, label, after=null, afterLabel='date of birth') => {
        //takes an ISO string and checks if its in the future or past the respondent DOB if dobCheck is enabled
        const date = new Date(dateString);
        const today = new Date();
        let afterDate = null;
        if(after) afterDate = new Date(after);

        today.setHours(0, 0, 0, 0);
        if(date > today){
            return {success: false, message: `${label} cannot be in the future.`}
        }
        if(afterDate && date < afterDate){
            return {success: false, message: `${label} cannot be before ${afterLabel}.`}
        }
        return {success: true, message: ''}
    }   

    //handle submission
    const onSubmit = async (data) => {
        //in case of switching to or from anon, set stale fields to null
        if (data.is_anonymous) {
            data.first_name = null;
            data.last_name = null;
            data.dob = null;
            data.id_no = null;
            data.ward = null;
            data.plot_no = null;
            data.email = null;
            data.phone_number = null;
        } 
        else {
            data.age_range = null; //dob is the highest truth, age_range will be autocalced from that
            //if not anon, validate DOB
            data.dob = checkDate(data.dob); //will return ISO string if default is ISO string or if date value is passed
            if(!data.dob){
                 alert('Date of Birth is Required.');
                return
            }
            const { success, message } = dateValidation(data.dob, 'Date of Birth');
            if(!success){
                alert(message);
                return;
            }
        }
        //check date positive date and return ISO string
        if(data.hiv_positive){
            data.date_positive = checkDate(data.date_positive);
            if(!data.date_positive){
                alert('A valid date positive is Required.');
                return;
            }
            const { success, message } = dateValidation(data.date_positive, 'Date positive', data.dob);
            if(!success){
                alert(message);
                return;
            }
        }
        else{
            data.date_positive = null;
        }
        //try saving/uploading the data
        let result = null; //placeholder for saved id
        try{
            setLoading(true);
            console.log('submitting data...');
            //respondent was pulled from server and still connected, upload directly to avoid unnecesssary storage on device
            if(serverId && isServerReachable){
                //convert fields to how the backend expects them
                data.kp_status_names = data.kp_status;
                data.disability_status_names = data.disability_status;
                data.hiv_status_data = {hiv_positive: data.hiv_positive, date_positive: data.date_positive};
                try{
                    console.log('uploading respondent', data);
                    const response = await fetchWithAuth(`/api/record/respondents/${serverId}/`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    const returnData = await response.json();
                    if(response.ok){
                        router.push(`/authorized/(tabs)/respondents/${returnData.id}`) //redirect to the respondent detail page with the id from the server
                    }
                    else{
                        console.error(returnData);
                    }
                }
                catch(err){
                    console.error(err);
                }
            }
            else if(serverId && !isServerReachable){
                alert('You are currently offline. Please reconnect to make edits.');
                return;
            }
            //if respondent is not in server, create or update local record
            else{
                let result = existing ? await Respondent.save(data, existing.local_id, 'local_id') : await Respondent.save(data); //save locally first
                //if connected, try to upload the data
                if (isServerReachable) {
                    try {
                        //upload the respondent
                        const uploaded = await Respondent.upload();
                        //get the server ID by pulling its link (which should auto add when uploaded)
                        const link = await RespondentLink.find(result, 'uuid');
                        //automatically redirect the user to the record page with this respondent loaded by passing the server id
                        router.push(`/authorized/(tabs)/respondents/${link.server_id}`);
                        return uploaded
                    } 
                    catch (err) {
                        alert('Respondent saved, but the upload failed. Will try again next time connection is found.');
                        console.error('Upload failed', err);
                    }
                }
                //otherwise alert the user the item was saved and redirect to the detail page
                else{
                    router.push(`/authorized/(tabs)/respondents/-${result}`);
                    alert('Respondent saved. Will sync next time connection is found.');
                    return result
                }
            }
        }
        catch(err){
            console.error(err);
        } 
        finally{
            setLoading(false);
        }  
    };

    //create array for citizenship picker
    const countryList = countries.map(c => ({
        label: c.name.common,
        value: c.cca2,       // ISO 3166-1 alpha-2 code
    }));

    //set existing values once existing has loaded
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    //anon watch to show or hide specific fields based on anon status
    const anon = useWatch({ control, name: 'is_anonymous', defaultValue: false });
    //show extra date fields if hiv positive/pregnant
    const hiv = useWatch({ control, name: 'hiv_positive', defaultValue: false });
    //anon toggle
    const isAnon = [
        { name: 'is_anonymous', label: "Does this respondent wish to remain anonymous", 
            type: "checkbox", tooltip: `We encourage respondents to provide us with as much information as possible
            so that we can better assist them, but we recognize that not every respondent wants to provide this information.
            As such, you can mark a respondent as anonymous, in which case they will not have to give an personally identifying information.`
        }
    ]
    //basics for non anon
    const notAnonBasic= [
        { name: 'id_no', label: "Omang/ID/Passport Number (Required)", type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} } },
        {name: 'first_name', label: 'First Name (Required)', type: 'text',
            rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} } },
        {name: 'last_name', label: 'Last Name (Required)', type: 'text',  rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} } },  
        {name: 'dob', label: 'Date of Birth (Required)', type: 'date',  rules: { required: "Required" } },
    ]
    //basics for all
    const basics = [
        {name: 'sex', label: 'Sex (Required)', type: 'radio', options: meta?.sexs,  rules: { required: "Required" },
            tooltip: 'Please provide the sex/gender that this person currently identifies as, or select "Non-Binary".'
        }
    ]
    //basics for anon
    const anonBasic = [
        {name: 'age_range', label: 'Respondent Age Range (Required)', type: 'select',
            options: meta?.age_ranges,  rules: { required: "Required" } },
    ]
    //address (plot no/ward), non-anon only
    const address = [
        {name: 'plot_no', label: 'Plot Number (or description)', type: 'text', 
            tooltip: 'If you may visit this person again, you may want to record some information about where they live.'
        },
        {name: 'ward', label: 'Kgotlana/Ward', type: 'text', rules: {maxLength: { value: 255, message: 'Maximum length is 255 characters.'}},},
    ]
    //more general geo info, shown to all
    const geo = [
        {name: 'village', label: 'Village/Town/City (Primary Residence) (Required)', type: 'text',  rules: { required: "Required",
            maxLength: { value: 255, message: 'Maximum length is 255 characters.'},
         },
            tooltip: 'Please provide the village, town, or city that best describes where this person currently resides.'
        },
        {name: 'district', label: 'District (Required)', type: 'select',  rules: { required: "Required" },
            options: meta?.districts, 
            tooltip: 'Please provide the district where this person currently resides.'
        },
        {name: 'citizenship', label: 'Citizenship/Nationality (Required)', type: 'select',  rules: { required: "Required"},
            options: countryList,
            tooltip: 'Please provide the village, town, or city that best describes where this person currently resides.'
        },
    ]
    //kp/disability, shown to all
    const special = [
        {name: 'kp_status', label: 'Key Population Status (Select all that apply)', type: 'multiselect',  
            options: meta?.kp_types},
        {name: 'disability_status', label: 'Disability Status (Select all that apply)', type: 'multiselect',  
            options: meta?.disability_types},
    ]
    //hiv positive
    const hivpos = [
        {name: 'hiv_positive', label: 'Is this person HIV Positive?', type: 'checkbox'}
    ]
    //date positive if hiv positive
    const datepos = [
        {name: 'date_positive', label: 'What date did this person become HIV positive (enter today if unsure) (Required)', type: 'date',  rules: { required: "Required" } },
    ]
    //contact info if not anon
    const contact = [
        {name: 'email', label: 'Email', type: 'email-address',  rules: {pattern: {value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Please enter a valid email.',
        }, maxLength: { value: 255, message: 'Maximum length is 255 characters.'}}, 
        tooltip: 'This information is not used by the system, but you may want to record it for your own records.'},
        
        {name: 'phone_number', label: 'Phone Number', type: 'phone-pad', tooltip: 'This information is not used by the system, but you may want to record it for your own records.',
            rules: {maxLength: { value: 255, message: 'Maximum length is 255 characters.'}},
        },
    ]

    if(loading || !meta?.sexs) return <LoadingScreen /> //return loading if the meta has not loaded or existing hasn't loaded (assuming id was provided)
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bonasoDarkAccent }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StyledScroll>
            <View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 20}}>
                <StyledText type='subtitle'>{existing ? `Editing ${display}` : 'Creating New Respondent'}</StyledText>
            </View>
            <View style={{ marginTop: 10 }}>
                <FormSection fields={isAnon} control={control} header={'Respondent Anonymity'} />
                {anon && <FormSection fields={anonBasic} control={control} header='Basic Information' />}
                {!anon && <FormSection fields={notAnonBasic} control={control} header='Basic Information' />}
                <FormSection fields={basics} control={control} header='Sex' />
                {!anon && <FormSection fields={address} control={control} header='Address'/>}
                <FormSection fields={geo} control={control} header='Geographic Information'/>
                <FormSection fields={special} control={control} header='Additional Information'/>
                <FormSection fields={hivpos} control={control} header='HIV Status'/>
                {hiv && <FormSection fields={datepos} control={control} header='Date HIV Positive'/>}
                {!anon && <FormSection fields={contact} control={control} header='Contact Information'/> }

                <StyledButton onPress={handleSubmit(onSubmit, (formErrors) => {console.log("Validation errors:", formErrors);})} label={'Submit'} />

                <StyledButton onPress={() => {existing ? router.push(`/authorized/(tabs)/respondents/${redirectId}`) :
                    router.push(`/authorized/(tabs)/respondents`)}} label={'Cancel'} />
            </View>
            <View style={{ padding: 30 }}></View>
        </StyledScroll>
        </KeyboardAvoidingView>
    );
}