import checkDate from "@/services/checkDate";
import theme from "@/themes/themes";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Modal, StyleSheet, View } from "react-native";
import FormSection from "../forms/FormSection";
import StyledButton from "../inputs/StyledButton";


export default function PregnancyModal({ onSave, onCancel, existing=null }){

    const onRemove = () => {
        const pregnancy = {id: existing?.id, term_began: null, term_ended: null};
        onSave({pregnancy_data: [pregnancy]});
        onCancel();
    }

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

    const onSubmit = (data) => {
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
        const pregnancy = {id: existing?.id ?? null, term_began: data.term_began, term_ended: data.term_ended}
        onSave({pregnancy_data: [pregnancy]});
        onCancel();
    }

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