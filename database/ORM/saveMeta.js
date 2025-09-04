import openDB from "../dbManager";
import { AgeRange, DisabilityType, District, KPType, Sex, SpecialRespondentAttribute } from "./tables/meta";



async function clearTables(){
    /*
    Helper function that removes values from all existing tables to allow for new values to be inputted.
    */
    const db = await openDB();
    //cascade might take care of all of these but play it safe
    const tables = ['age_ranges', 'sexs', 'disability_types', 'kp_types', 'districts']
    for(const table of tables){
        await db.runAsync(`DELETE FROM ${table}`);
    }
}

export default async function saveMeta(data){
    /*
    Takes a meta object as sent by the server and saves it to the correct database table for offline usage. 
    - data (object): model info sent by the server
    */
    const groups = Object.keys(data);
    await clearTables();
    for(const group of groups){
        let model = null;
        //go through each meta category and identify the correct model to use
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
            case 'special_attributes':
                model = SpecialRespondentAttribute;
                break;
        }
        //save label/value pair
        if(model){
            const pairs = data[group]
            for(const pair of pairs){
                await model.save(pair)
            }
        }
    }
}