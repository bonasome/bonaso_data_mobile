import { AgeRange, DisabilityType, District, KPType, Sex } from "./tables/meta";

async function clearTables(){
    const db = await openDB();
    //cascade might take care of all of these but play it safe
    const tables = ['age_ranges', 'sexs', 'disability_types', 'kp_types', 'districts']
    for(const table of tables){
        await db.runAsync(`DELETE FROM ${table}`);
    }
}

export default async function saveMeta(data){
    const groups = Object.keys(data);
    await clearTables();
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