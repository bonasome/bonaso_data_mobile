export const calcDefault = (assessment, existing = null) => {
    /*
    Calculates default values for interactionForm (including setting existing vals if editing)
    - assessment (object): assessment being responded to
    - existing (object): existing object if editing
    */
    if (!assessment) return {};
    let map = {}; //object we'll return to set existing values

    //loop though each indicator to set the value
    assessment.indicators.forEach((ind) => {
        const firstMatch = existing?.responses?.find(r => r.indicator.id == ind.id) ?? null;
        const rDate = firstMatch?.response_date ?? '';
        const rLocation = firstMatch?.response_location ?? '';

        // MULTI-SELECT (combine these into one array, since Responses will store them as seperate rows)
        if (ind.type === 'multi') {
            let val = existing
                ? existing.responses
                      .filter(r => r.indicator.id == ind.id)
                      .map(r => r.response_option?.id)
                : [];
            //none options are not stored in the db, so if there are values and this should be visible set it to 'none', since that was the intent
            if (ind.allow_none && existing && (!val || val==undefined || val.includes(undefined) || val.length === 0)) {
                val = ['none'];
            }
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
        //create array of multint objects
        else if(ind.type == 'multint'){
            let val = ind.options.map(o => ({ 
                option: o.id, 
                value: existing?.responses?.find(r => (r?.indicator?.id == ind.id && r?.response_option?.id == o?.id))?.response_value ?? ''
            }))
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
        // SINGLE-SELECT
        else if (ind.type === 'single') {
            let val;
            if (existing) {
                //none options are not recorded in the DB
                if (ind.allow_none) {
                    //if not found but existing, this was a none
                    val = firstMatch?.response_option?.id ?? 'none';
                } 
                else {
                    val = firstMatch?.response_option?.id ?? null;
                }
            } 
            else {
                val = null;
            }
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }

        // BOOLEAN - db may store these as 0/1
        else if (ind.type === 'boolean') {
            console.log(firstMatch)
            let val = null;
            if([true, 1].includes(firstMatch?.response_boolean)) val = true;
            if([false, 0].includes(firstMatch?.response_boolean)) val = false;
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }

        // TEXT / NUMBER / OTHER
        else {
            const val = firstMatch?.response_value ?? '';
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
    });
    return map;
};