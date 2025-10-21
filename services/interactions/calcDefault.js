export const calcDefault = (assessment, existing = null) => {
    if (!assessment) return {};
    let map = {};

    assessment.indicators.forEach((ind) => {
        const firstMatch = existing?.responses?.find(r => r.indicator.id == ind.id) ?? null;
        const rDate = firstMatch?.response_date ?? '';
        const rLocation = firstMatch?.response_location ?? '';

        // MULTI-SELECT
        if (ind.type === 'multi') {
            let val = existing
                ? existing.responses
                      .filter(r => r.indicator.id == ind.id)
                      .map(r => r.response_option?.id)
                : [];
            if (ind.allow_none && firstMatch && (!val || val==undefined || val.includes(undefined) || val.length === 0)) {
                console.log('here')
                val = ['none'];
            }
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }
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
                if (ind.allow_none) {
                    val = firstMatch ? firstMatch?.response_option?.id ?? 'none' : null;
                } 
                else {
                    val = firstMatch?.response_option?.id ?? null;
                }
            } else {
                val = null;
            }
            map[ind.id] = { value: val, date: rDate, location: rLocation };
        }

        // BOOLEAN
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