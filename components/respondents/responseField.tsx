import { useEffect, useState } from "react";
import { useController, useFormContext } from "react-hook-form";


import { View } from 'react-native';
import Field from "../forms/Field";

export default function ResponseField ({ indicator, shouldShow, options }){
    const [expanded, setExpanded] = useState(false);
    const { field } = useController({ name: `response_data.${indicator.id}.value` });
    const { control, setValue, getValues } = useFormContext();


    useEffect(() => {
        if (!shouldShow) {
            if (indicator.type == 'multi') setValue(`response_data.${indicator.id}.value`, []);
            else if (indicator.type == 'single') setValue(`response_data.${indicator.id}.value`, null);
            else if (indicator.type == 'boolean') setValue(`response_data.${indicator.id}.value`, null);
            else setValue(`response_data.${indicator.id}.value`, '');
        }
    }, [shouldShow, setValue]);


    const convertType = (type) => {
        if(type=='boolean') return 'radio';
        else if(type=='single') return 'radio';
        else if(type=='multi') return 'multiselect';
        else if(type=='text') return 'textarea';
        else if(type=='integer') return 'numeric';
        else return type;
    }


    const handleMultiSelectChange = (selectedValues) => {
        const lastElement = selectedValues[selectedValues.length - 1];
        if (lastElement == 'none') {
            return ['none']; // reset everything else
        } 
        return selectedValues.filter(v => v !== 'none');
    };

    let fieldConfig = {
        type: convertType(indicator.type), 
        name: `response_data.${indicator.id}.value`, 
        label: `${indicator.indicator_order + 1}. ${indicator.name}`, 
        options: options, 
        onChange: indicator.type == 'multi' ? handleMultiSelectChange : undefined,
    }

    if(indicator.required){
        fieldConfig.rules = {
            validate: (value) => {
                // Allow false, 0, empty array, but disallow null or undefined
                if (value === null || value === undefined || value === '' || (Array.isArray(val) && val.length === 0)) {
                    return 'Required';
                }
                return true;
            }
        };
        fieldConfig.label = `${indicator.indicator_order + 1}. ${indicator.name}*`
    }
    
    if(!shouldShow) return <></>
    return(
        <View>
            <View style={{display: 'flex', flexDirection: 'row'}}>
                <Field control={control} field={fieldConfig} />
            </View>
        </View>
    )
}