import { AgeRange, DisabilityType, District, KPType, Sex, SpecialRespondentAttribute } from "./tables/meta";

export default async function getMeta(){
    /*
    Helper function that pulls data from all the meta tables and converts it into a single object.
    */
    const ar = await AgeRange.all()
    const sexs = await Sex.all();
    const districts = await District.all()
    const dts = await DisabilityType.all();
    const kps = await KPType.all();
    const sa = await SpecialRespondentAttribute.all();
    return {
        'age_ranges': ar,
        'sexs': sexs,
        'districts': districts,
        'kp_types': kps,
        'disability_types': dts,
        'special_attributes': sa
    }   
}