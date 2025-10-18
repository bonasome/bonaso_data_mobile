export const calcDefaultLocal = (assessment, existing=null) => {
    if(!assessment) return {}
    let map = {}
    assessment.indicators.forEach((ind) => {
        if(ind.type == 'multi'){
            const val =  (existing && ind.allow_none) ? (existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.value == 'none')).length > 0 ? 
                ['none'] : existing?.responses?.filter(r => r.indicator?.id == ind?.id)?.map(r => (parseInt(r.value)))) : 
                existing?.responses?.filter(r => r.indicator?.id == ind?.id)?.map(r => (parseInt(r.value))) ?? [];
            map[ind.id] = { value: val }
        } 
        else if(ind.type == 'single'){
            const val = (ind.allow_none && existing) ? (existing?.responses?.find(r => r.indicator.id == ind.id)?.value ?? 'none'): 
                parseInt(existing?.responses?.find(r => r.indicator?.id == ind?.id)?.value) ?? null;
            map[ind.id] = { value: val }
        }
        else if(ind.type == 'boolean'){
            let val = existing?.responses.find(r => r.indicator?.id == ind?.id)?.value ?? null;
            if(['true', 1, '1'].includes(val)) val = true;
            if(['false', 0, '0'].includes(val)) val = false;
            map[ind.id] = { value: val }
        }
        else {
            const val = existing?.responses?.find(r => r.indicator?.id == ind?.id)?.value ?? '';
            map[ind.id] = { value: val }
        }
    });
    console.log(map)
    return map;
}

export const calcDefaultServer = (assessment, existing=null) => {
    if(!assessment) return {}
    let map = {}
    
    assessment.indicators.forEach((ind) => {
        if(ind.type == 'multi'){
            const val =  (existing && ind.allow_none) ? (existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.response_option.id)).length > 0 ? 
                existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.response_option.id)) : ['none']) : 
                existing?.responses?.filter(r => r.indicator.id == ind.id)?.map(r => (r.response_option.id)) ?? [];
            map[ind.id] = { value: val }
        } 
        else if(ind.type == 'single'){
            const val = (ind.allow_none && existing) ? (existing?.responses?.find(r => r.indicator.id == ind.id)?.response_option ?? 'none'): 
                existing?.responses?.find(r => r.indicator.id == ind.id)?.response_option ?? null;
            map[ind.id] = { value: val }
        }
        else if(ind.type == 'boolean'){
            const val = existing?.responses.find(r => r.indicator.id == ind.id)?.response_boolean ?? null;
            map[ind.id] = { value: val }
        }
        else {
            const val = existing?.responses?.find(r => r.indicator.id == ind.id)?.response_value ?? '';
            map[ind.id] = { value: val }
        }
    });
    console.log(map)
    return map;
}