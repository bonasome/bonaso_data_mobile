import { AgeRange, DisabilityType, District, KPType, Sex } from "./tables/meta";

export async function storeMeta(data){
    const groups = Object.keys(data);
    for(const group of groups){
        console.log(group)
        let model = null;
        switch(group){
            case 'age_ranges':
                model = AgeRange;
                break;
            case 'sexs':
                model=Sex;
                break;
            case 'kp_types':
                model=KPType;
                break;
            case 'disability_types':
                model= DisabilityType;
                break;
            case 'districts':
                model= District;
                break;
        }
        if(model){
            const pairs = data[group]
            for(const pair of pairs){
                await model.save(pair)
            }
        }
    }
}

export async function getMeta(){
    const ar = await AgeRange.all()
    const sexs = await Sex.all();
    const districts = await District.all()
    const dts = await DisabilityType.all();
    const kps = await KPType.all()
    return {
        'age_ranges': ar,
        'sexs': sexs,
        'districts': districts,
        'kp_types': kps,
        'disability_types': dts,
    }   
}