import fetchWithAuth from '@/services/fetchWithAuth';
import { randomUUID } from 'expo-crypto';
import BaseModel from '../base';


export class RespondentLink extends BaseModel {
    static table = 'respondent_links';

    static fields = {
        uuid: {type: 'text', primary: true}, //universal id that is used for linking an ID to interactions
        server_id: {type: 'integer', allow_null: true}, //corresponding server ID that interactions can pull from
    }

    static relationships = []
}

export class KPStatus extends BaseModel {
    static table = 'kp_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'local_id'}},
    }
    static relationships = []
}
export class DisabilityStatus extends BaseModel {
    static table = 'disability_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'local_id'}},
    }
    static relationships = []
}

export class Respondent extends BaseModel {
    static table = 'respondents';
    
    static fields = {
        local_id: {type: 'text', primary: true},
        is_anonymous: {type: 'INTEGER', default: 0},
        id_no: {type: 'text', allow_null: true},
        first_name: {type: 'text', allow_null: true},
        last_name: {type: 'text', allow_null: true},
        dob: {type: 'text', allow_null: true},
        age_range: {type: 'text', allow_null: true},
        sex: {type: 'text'},
        plot_no: {type: 'text', allow_null: true},
        ward: {type: 'text', allow_null: true},
        village: {type: 'text'},
        district: {type: 'text'},
        citizenship: {type: 'text'},
        email: {type: 'text', allow_null: true},
        phone_number: {type: 'text', allow_null: true},
        created_at: {type: 'text', default: new Date().toISOString()},
        hiv_positive: {type: 'integer', default: 0},
        date_positive: {type: 'text', allow_null: true},
        is_pregnant: {type: 'integer', default: 0},
        term_began: {type: 'text', allow_null: true},
        term_ended: {type: 'text', allow_null: true},
    }

    static searchCols = ['first_name', 'last_name', 'local_id', 'village', 'id_no'];

    static relationships = [
        {model: KPStatus, field: 'kp_status', name: 'kp_status', relCol: 'respondent', thisCol: 'local_id', onDelete: 'cascade', fetch: true}, 
        {model: DisabilityStatus, field: 'disability_status', name: 'disability_status', relCol: 'respondent', thisCol: 'local_id', onDelete: 'cascade', fetch: true}, 
    ]

    static async save(data, id, col = 'id') {
        const { kp_status = [], disability_status = [], ...mainData } = data;
        const newUUID = randomUUID(); //will serve as the primary key and the link key
        const link = await RespondentLink.save({ uuid: newUUID });
        mainData.local_id = newUUID
        // Save main record first
        const savedId = await super.save(mainData, id, col);
        // Save related KP statuses
        for (const kp of kp_status) {
            await KPStatus.save({ name: kp, respondent: newUUID });
        }

        // Save related disability statuses
        for (const dis of disability_status) {
            await DisabilityStatus.save({ name: dis, respondent: newUUID });
        }
        return newUUID; // Return id so caller can fetch full object if needed
    }

    static async upload() {
        const unsynced = await Respondent.all();
        if(unsynced.length === 0){
            console.log('No interactions to sync');
            return false;
        }
        let toSync = []
        for(const instance of unsynced){
            let ser = await instance.serialize();
            ser.kp_status_names = ser.kp_status.map((kp) => (kp.name));
            ser.disability_status_names = ser.disability_status.map((d) => (d.name));
            ser.hiv_status_data = {hiv_positive: ser?.hiv_positive ?? null, date_positive: ser?.date_positive ?? null};
            ser.pregnancy_data = [{term_began: ser.term_began, term_ended: ser.term_ended}]
            toSync.push(ser);
        }
        try{
            console.log('uploading respondents', toSync);
            const response = await fetchWithAuth(`/api/record/respondents/mobile/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toSync),
            });
            const data = await response.json();
            if(response.ok){
                const map = data.mappings;
                for(const instance of map){
                    const local = instance.local_id;
                    const server = instance.server_id;
                    console.log(local, server)
                    const updated = await RespondentLink.save({ 'server_id': server }, local, 'uuid');
                    await Respondent.delete(local, 'local_id');
                };
                if(data.errors){
                    console.error(data.errors);
                }
            }
            else{
                console.error(data)
            }
            
        }
        catch(err){
            console.error(err);
        }
    }
}




