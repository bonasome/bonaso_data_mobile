import { AgeRange, DisabilityType, District, KPType, Sex } from "./tables/meta";

export default async function getMeta(){
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