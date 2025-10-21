export const checkLogic = (c, responseInfo, assessment, respondent) => {
    if(!c || !responseInfo ||!assessment ||!respondent) return false
    if(c.source_type == 'assessment'){
        const prereq = assessment.indicators.find(i => i.id == c.source_indicator);
        if(!prereq || prereq == '' || prereq=='undefined') return false;
        let reqVal = null
        if(['single', 'multi'].includes(prereq.type)) reqVal = c.condition_type ? c.condition_type : c.value_option;
        else if(['boolean'].includes(prereq.type)) reqVal = c.value_boolean;
        else reqVal = c.value_text;
        let prereqVal = responseInfo?.[c.source_indicator]?.value
        if([null, undefined, '', 'undefined'].includes(prereqVal)) return false;
        
        
       if ((prereq.type === 'multi') && ['any','none','all'].includes(c.condition_type)) {
            prereqVal = prereqVal || [];
            switch(reqVal) {
                case 'any':
                    return prereqVal.length > 0 && !['none'].includes(prereqVal);
                case 'none':
                    return prereqVal.includes('none');
                case 'all':
                    return prereqVal.length === (prereq.options?.length || 0);
            }
        }
        if ((prereq.type === 'single') && ['any','none','all'].includes(c.condition_type)) {
            prereqVal = prereqVal || null;
            switch(reqVal) {
                case 'none':
                    return prereqVal == 'none';
                case 'any':
                    return prereqVal && prereqVal != 'none';
                case 'all':
                    return false; // impossible
            }
        }
        if(prereq.type=='multi'){
            if(c.operator == '=') return prereqVal?.includes(reqVal);
            if(c.operator == '!=') return !prereqVal?.includes(reqVal);
        }
        else{
            if(c.operator == '=') return prereqVal == reqVal;
            if(c.operator == '!=') return prereqVal != reqVal;
        }
        
        if(['>', '<'].includes(c.operator)){
            if(isNaN(prereqVal) || isNaN(reqVal)){
                console.warn('Cannot compare a non-integer.', prereqVal, reqVal);
                return false
            }
            return c.operator == '>' ? parseFloat(prereqVal) > parseFloat(reqVal) : parseFloat(prereqVal) < parseFloat(reqVal)
        }
        else if(c.operator == 'contains'){
            return prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        else if(c.operator == '!contains'){
            return !prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        return false
    }
    else if(c.source_type == 'respondent'){
        const reqVal = c.value_text;
         const prereqVal = c.respondent_field == 'hiv_status' ? (respondent?.hiv_status?.hiv_positive ? "true" : 'false') : 
            respondent?.[c.respondent_field];
        //these are all that's supported right now
        if(c.operator == '=') return prereqVal == reqVal;
        if(c.operator == '!=') return prereqVal != reqVal;
        return false;
    }
}


