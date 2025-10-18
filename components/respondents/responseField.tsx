import { useEffect, useMemo, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import { checkLogic } from "@/services/interactions/checkLogic";

import { View } from 'react-native';
import Field from "../forms/Field";

export default function ResponseField ({ indicator, assessment, respondent, responseInfo }){
    const [expanded, setExpanded] = useState(false);
    const { field } = useController({ name: `response_data.${indicator.id}.value` });
    const { control, setValue, getValues } = useFormContext();

    const shouldShow = useMemo(() => {
        if(!indicator || !assessment ||!respondent) return false;
        const logic = indicator.logic;
        //no logic, always return true
        if(!logic?.conditions || logic?.conditions?.length == 0) return true;
        if(indicator.logic.group_operator == 'AND'){
            return logic.conditions.every(c => (checkLogic(c, responseInfo, assessment, respondent)))
        }
        //must be an OR
        else{
            return logic.conditions.some(c => (checkLogic(c, responseInfo, assessment, respondent)))
        }
    }, [JSON.stringify(responseInfo)]);


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

    const options = useMemo(() => {
        let opts = indicator?.options?.map((o) => ({value: o.id, label: o.name})) ?? [];
        if(indicator.type == 'boolean') return [{value: true, label: 'Yes'}, {value: false, label: 'No'}]
        if(indicator.allow_none) opts.push({value: 'none', label: 'None of the above'})
        if(!indicator.match_options) return opts;
        else if(indicator.match_options){
            const valid = responseInfo?.[indicator.match_options]?.value;
            return opts.filter(o => (valid?.includes(o?.value) || o?.value == 'none'))
        }
    }, [JSON.stringify(responseInfo)])
    
    useEffect(() => {
        if (!['single', 'multi'].includes(indicator.type)) return;
        if (!options || options.length === 0) return;

        const val = getValues(`response_data.${indicator.id}.value`);
        const valid_ids = options.map(p => p.value);

        if (indicator.type === 'multi') {
            const valArray = Array.isArray(val) ? val : [];
            const filtered = valArray.filter(v => valid_ids.includes(v));
            setValue(`response_data.${indicator.id}.value`, filtered);
        }

        if (indicator.type === 'single') {
            const useVal = valid_ids.includes(val) ? val : null;
            setValue(`response_data.${indicator.id}.value`, useVal);
        }
    }, [options, indicator.id, setValue, getValues]);


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
                if (value === null || value === undefined || value === '') {
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