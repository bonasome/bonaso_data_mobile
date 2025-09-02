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
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import countries from 'world-countries';
export default function CreateRespondent() {
    //navigator the help with directions to/from
    const router = useRouter();
    const { localId, serverId } = useLocalSearchParams();
    //connection state
    const { isServerReachable } = useConnection();
    const [existing, setExisting] = useState(null);
    const [display, setDisplay] = useState('');
    //meta containing options/labels for certain fields
    const [meta, setMeta] = useState(null); 
    const [redirectId, setRedirectId] = useState('');
    const [loading, setLoading] = useState(false);

    //slightly confusing, but a user can either load a profile from the device or from the server
     useEffect(() => {
        if (localId) {
            (async () => {
                setLoading(true);
                const found = await Respondent.find(localId, 'local_id');
                const serialized = await found?.serialize();
                setExisting(serialized);
                setRedirectId(`-${localId}`);
                setLoading(false);
                setDisplay(serialized.is_anonymous ? `Anonymous Respondent ${serialized.local_id}` : `${serialized.first_name} ${serialized.last_name}`)
            })();
        }
        if (serverId && isServerReachable) {
            (async () => {
                try {
                    setLoading(true);
                    const response = await fetchWithAuth(`/api/record/respondents/${serverId}/`);
                    const data = await response.json();
                    if (response.ok) {
                        setExisting(data);
                        setRedirectId(`${data.id}`);
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
    }, [localId, serverId])

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

    const pregnancyInfo = useMemo(() => {
        if(!serverId || !existing) return null;
        if(!existing?.pregnancies || existing?.pregnancies?.length == 0) return null
        let most_recent = existing?.pregnancies?.reduce((latest, current) => {
            return new Date(current.date1) > new Date(latest.date1) ? current : latest;
        });
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
            
            is_pregnant: serverId ? existing?.pregnancies?.length > 0 : existing?.is_pregnant ?? false,
            term_began: serverId ? pregnancyInfo?.term_began : existing?.term_began ?? null,
            term_ended: serverId ? pregnancyInfo?.term_ended : existing?.term_ended ?? null,

            email: existing?.email ?? '',
            phone_number: existing?.phone_number ?? '',

        }
    }, [existing]);

    //set up the form
    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({ defaultValues });

    //handle submission
    const onSubmit = async (data) => {
        //in case of switching, set stale fields to null
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
            if (!data.dob || new Date(data.dob) > new Date()) {
                alert("Date of birth is invalid.");
                return;
            }
            data.age_range = null; //dob is the highest truth
            data.dob = checkDate(data.dob);
            if(!data.dob){
                 alert('Date of Birth is Required.');
                return
            }
        }
        data.date_positive = checkDate(data.date_positive);
        if(data.hiv_positive && !data.date_positive){
            alert('A valid date positive is Required.');
            return;
        }
        data.term_began = checkDate(data.term_began)
        if(data.is_pregnant && !data.term_began){
            alert('A valid term began date is Required.'); 
            return;
        }
        data.term_ended = checkDate(data.term_ended); //this is nominally optional
        //try saving/uploading the data
        let result = null
        try{
            setLoading(true);
            console.log('submitting data...');
            //respondent was pulled from server and still connected, upload directly to avoid unnecesssary storage
            if(serverId && isServerReachable){
                data.kp_status_names = data.kp_status;
                data.disability_status_names = data.disability_status;
                data.hiv_status_data = {hiv_positive: data.hiv_positive, date_positive: data.date_positive};
                data.pregnancy_data = [{term_began: data.term_began, term_ended: data.term_ended, id: pregnancyInfo?.id ?? null}];
                
                try{
                    console.log('uploading respondent', data);
                    const response = await fetchWithAuth(`/api/record/respondents/${serverId}/`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    const returnData = await response.json();
                    if(response.ok){
                        router.push(`/authorized/(tabs)/respondents/${returnData.id}`) //redirect to the previous page with the id from the server
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
            }
            else{
                //if it exists i.e., a local ID param was passed, save over the old result, else create a new record
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
    const countryList = countries.map(c => ({
        label: c.name.common,
        value: c.cca2,       // ISO 3166-1 alpha-2 code
    }));

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    //anon watch to show or hide specific fields based on anon status
    const anon = useWatch({ control, name: 'is_anonymous', defaultValue: false });
    //show extra date fields if hiv/pregnant
    const hiv = useWatch({ control, name: 'hiv_positive', defaultValue: false });
    const pregnant = useWatch({ control, name: 'is_pregnant', defaultValue: false });
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
    //is pregnant
    const isPregnant = [
        {name: 'is_pregnant', label: 'Is this person pregnant (or were they recently pregnany)?', type: 'checkbox'}
    ]
    //prengnancy dates if pregnant
    const pregDates = [
        {name: 'term_began', label: 'When did this person become pregnant? (Required)', type: 'date', rules: { required: "Required" } },
        {name: 'term_ended', label: "When did this person's pregnancy end (leave blank if ongoing)?", type: 'date'},
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

    if(loading || !meta?.sexs) return <LoadingScreen /> //return nothing if the meta has not loaded
    return (
        <KeyboardAvoidingView style={styles.bg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StyledScroll>
            <View style={{ backgroundColor: theme.colors.bonasoUberDarkAccent, padding: 20}}>
                <StyledText type='subtitle'>{existing ? `Editing ${display}` : 'Creating New Respondent'}</StyledText>
            </View>
            <View style={styles.form}>
                <FormSection fields={isAnon} control={control} header={'Respondent Anonymity'} />
                {anon && <FormSection fields={anonBasic} control={control} header='Basic Information' />}
                {!anon && <FormSection fields={notAnonBasic} control={control} header='Basic Information' />}
                <FormSection fields={basics} control={control} header='Sex' />
                {!anon && <FormSection fields={address} control={control} header='Address'/>}
                <FormSection fields={geo} control={control} header='Geographic Information'/>
                <FormSection fields={special} control={control} header='Additional Information'/>
                <FormSection fields={hivpos} control={control} header='HIV Status'/>
                {hiv && <FormSection fields={datepos} control={control} header='Date HIV Positive'/>}
                <FormSection fields={isPregnant} control={control} header='Pregnancy Status'/>
                {pregnant && <FormSection fields={pregDates} control={control} header='Pregnancy Dates (for most recent/active term)'/>}
                {!anon && <FormSection fields={contact} control={control} header='Contact Information'/> }

                <StyledButton onPress={handleSubmit(onSubmit, (formErrors) => {console.log("Validation errors:", formErrors);})} label={'Submit'} />

                <StyledButton onPress={() => {existing ? router.push(`/authorized/(tabs)/respondents/${redirectId}`) :
                    router.push(`/authorized/(tabs)/respondents`)}} label={'Cancel'} />
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
        marginTop: 10,
    },
    spacer: {
        padding: 30,
    }
});