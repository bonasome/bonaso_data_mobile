import { useEffect } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";


import theme from "@/themes/themes";
import { View } from 'react-native';
import Field from "../forms/Field";

export default function ResponseField ({ indicator, defaultVal, isVisible, onFieldChange, options=[] }){
    /*
    Displays and returns the appropriate input type for an indicator in an assessment.
    - indicator (object): what indicator is being responded to
    - shouldShow (boolean): should this indicator be visible
    - options (array): what options should be used (if applicable)
    */

    //Form Provider context for RHF
    const { field } = useController({ name: `response_data.${indicator.id}.value` });
    const { control, setValue, getValues, unregister, resetField } = useFormContext();

    //convert indicator types to names used for our inputs
    const convertType = (type) => {
        if(type=='boolean') return 'radio';
        else if(type=='single') return 'radio';
        else if(type=='multi') return 'multiselect';
        else if(type=='text') return 'textarea';
        else if(type=='integer') return 'numeric';
        else return type;
    }

    //handle none option for multiselects (may need to unselect option)
    const handleMultiSelectChange = (selectedValues) => {
        const lastElement = selectedValues[selectedValues.length - 1];
        if (lastElement == 'none') {
            return ['none']; // reset everything else
        } 
        return selectedValues.filter(v => v !== 'none');
    };

    // calculate default value for this question
   const value = useWatch({ control, name: `response_data.${indicator.id}` });

    useEffect(() => {
    if (!indicator) return;
        onFieldChange(indicator.id, value);
    }, [value, indicator.id, onFieldChange]);

    // unregister invisible fields
    useEffect(() => {
        if (!isVisible) {
            unregister(`response_data.${indicator.id}.value`);
        }
    }, [isVisible, unregister, indicator.id]);

    useEffect(() => {
        if (defaultVal && isVisible) {
            resetField(`response_data.${indicator.id}`, { defaultValue: defaultVal });
        }
    }, [defaultVal, isVisible, indicator.id, setValue]);

    //set up field
    let fieldConfig = {
        type: convertType(indicator.type), 
        name: `response_data.${indicator.id}.value`, 
        label: `${indicator.indicator_order + 1}. ${indicator.name}`, 
        options: options, 
        onChange: indicator.type == 'multi' ? handleMultiSelectChange : undefined,
    }

    //special required rules (false is a valid value)
    if(indicator.required && isVisible){
        fieldConfig.rules = {
            validate: (value) => {
                // Allow false, 0, empty array, but disallow null or undefined
                if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                    return 'Required';
                }
                return true;
            }
        };
        fieldConfig.label = `${indicator.indicator_order + 1}. ${indicator.name}*`
    }

    if(!isVisible) return null;
    return(
        <View>
            <View style={{display: 'flex', flexDirection: 'row', backgroundColor: theme.colors.bonasoMain, padding: 20, margin: 10}}>
                <Field control={control} field={fieldConfig} />
            </View>
        </View>
    )
}