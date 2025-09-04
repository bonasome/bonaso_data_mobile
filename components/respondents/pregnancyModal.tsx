import checkDate from "@/services/checkDate";
import theme from "@/themes/themes";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Modal, StyleSheet, View } from "react-native";
import FormSection from "../forms/FormSection";
import StyledButton from "../inputs/StyledButton";


export default function PregnancyModal({ onSave, onCancel, existing=null }){
    /*
    Model that allows a user to edit, create, or delete a pregnancy instance for a respondent. 
    - onSave (function): what to do with the data when submitted
    - onCancel (function): closes the modal
    - existing (object): pregnancy data to edit
    */

    //the server will treat no term_began as a delete, so do that to delete the object
    const onRemove = () => {
        const pregnancy = {id: existing?.id, term_began: null, term_ended: null};
        onSave({pregnancy_data: [pregnancy]});
        onCancel();
    }

    //helper function to validate pregnancy dates are not in the future and does not end before it starts
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

    //handle submission of form, verify dates and then convert data to how the server will expect it
    const onSubmit = (data) => {
        //validate dates are not in the future and ended is not before start
        data.term_began = checkDate(data.term_began)
        if(!data.term_began){
            alert('A valid term began date is Required.'); 
            return;
        }
        let { success, message } = dateValidation(data.term_began, 'Pregnancy term began');
        if(!success){
            alert(message);
            return;
        }
        data.term_ended = checkDate(data.term_ended); //this is nominally optional
        if(data.term_ended){
            let { success, message } = dateValidation(data.term_ended, 'Pregnancy term ended', data.term_began, 'pregnancy term began');
            if(!success){
                alert(message);
                return;
            }
        }
        //convert to how the server expects it
        const pregnancy = {id: existing?.id ?? null, term_began: data.term_began, term_ended: data.term_ended}
        onSave({pregnancy_data: [pregnancy]});
        onCancel();
    }

    //set defailt start/end dates
    const defaultValues = useMemo(() => {
        return {
            term_began: existing?.term_began ?? null,
            term_ended: existing?.term_ended ?? null,
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

    //dates
    const info = [
        {name: 'term_began', label: 'Pregnancy Began (Required)', type: 'date', rules: {required: 'Required'}},
        {name: 'term_ended', label: 'Pregnancy Ended (Leave blank if ongoing)', type: 'date' },
    ]

    return(
        <Modal transparent={true} visible={true} animationType="slide">
            <View style={styles.modalContent}>
                <FormSection fields={info} control={control} header={'Editing Pregnancy'} />
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <StyledButton onPress={handleSubmit(onSubmit, (formErrors) => {console.log("Validation errors:", formErrors);})} label={'Submit'}/>
                    <StyledButton onPress={onCancel} label={'Cancel'} style={{ marginStart: 15, marginEnd: 15 }}/>
                    {existing &&  <StyledButton onPress={onRemove} label={'Delete'}/>}
                </View>
            </View>
        </Modal >
    )
}

const styles = StyleSheet.create({
    modalContent: {
        margin: 50,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        color: '#fff',
        padding: 40,
        minWidth: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        textAlign: 'center',
    },
    container: { 
        marginVertical: 10 
    },
})