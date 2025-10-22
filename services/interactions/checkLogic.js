export const checkLogic = (c, responseInfo, assessment, respondent) => {
    /*
    Checks logic to see if a condition is met
    -c (object): condition to evaluate
    - responseInfo (object): response data for the assessment
    - assessment (object): the whole assessment this condition is a part of
    - respondent (object): information about the respondent this assessment is for
    */
    if(!c || !responseInfo ||!assessment ||!respondent) return false
    if(c.source_type == 'assessment'){
        //if checking a response in assessment
        const prereq = assessment.indicators.find(i => i.id == c.source_indicator); //find the prereq
        if(!prereq || prereq == '' || prereq=='undefined') return false; //if no prereq is found return false
        let reqVal = null
        if(['single', 'multi'].includes(prereq.type)) reqVal = c.condition_type ? c.condition_type : c.value_option;
        else if(['boolean'].includes(prereq.type)) reqVal = c.value_boolean;
        else reqVal = c.value_text;
        let prereqVal = responseInfo?.[c.source_indicator]?.value
        if([null, undefined, '', 'undefined'].includes(prereqVal)) return false; //return false if there is no value to check against
        
        //start evaluating any conditions for multiselect types
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
        //then condition types for single select
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
        //since these are arrays, these work with includes
        if(prereq.type=='multi'){
            if(c.operator == '=') return prereqVal?.includes(reqVal);
            if(c.operator == '!=') return !prereqVal?.includes(reqVal);
        }
        //otherwise equality check
        else{
            if(c.operator == '=') return prereqVal == reqVal;
            if(c.operator == '!=') return prereqVal != reqVal;
        }
        //numeric and gt/lt
        if(['>', '<'].includes(c.operator)){
            if(isNaN(prereqVal) || isNaN(reqVal)){
                console.warn('Cannot compare a non-integer.', prereqVal, reqVal);
                return false
            }
            return c.operator == '>' ? parseFloat(prereqVal) > parseFloat(reqVal) : parseFloat(prereqVal) < parseFloat(reqVal)
        }
        //text and contains
        else if(c.operator == 'contains'){
            return prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        else if(c.operator == '!contains'){
            return !prereqVal.toLowerCase().includes(reqVal.toLowerCase());
        }
        return false
    }
    //otherwise check the respondent attribute
    else if(c.source_type == 'respondent'){
        const reqVal = c.value_text;
        //we need to dig down a layer to find this one
         const prereqVal = c.respondent_field == 'hiv_status' ? (respondent?.hiv_status?.hiv_positive ? "true" : 'false') : 
            respondent?.[c.respondent_field];

        if(c.operator == '=') return prereqVal == reqVal;
        if(c.operator == '!=') return prereqVal != reqVal;
        return false;
    }
}


