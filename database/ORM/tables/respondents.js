import fetchWithAuth from '@/services/fetchWithAuth';
import BaseModel from '../base';
import { Interaction } from './interactions';


export class KPStatus extends BaseModel {
    static table = 'kp_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'id'}},
    }
}
export class DisabilityStatus extends BaseModel {
    static table = 'disability_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'id'}},
    }
}

export class Respondent extends BaseModel {
    static table = 'respondents';
    
    static fields = {
        is_anonymous: {type: 'INTEGER', default: 0},
        server_id: {type: 'integer', allow_null: true},
        uuid: {type: 'text'},
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
        hiv_positive: {type: 'integer', allow_null: true},
        date_positive: {type: 'text', allow_null: true},
        term_began: {type: 'text', allow_null: true},
        term_ended: {type: 'text', allow_null: true},
        synced: {type: 'integer', default: 0}
    }

    static searchCols = ['first_name', 'last_name', 'uuid', 'village', 'id_no'];

    static relationships = [
        {model: KPStatus, field: 'kp_status', name: 'kp_status', relCol: 'respondent', thisCol: 'id', onDelete: 'cascade', fetch: true}, 
        {model: DisabilityStatus, field: 'disability_status', name: 'disability_status', relCol: 'respondent', thisCol: 'id', onDelete: 'cascade', fetch: true}, 
        {model: Interaction, field: 'interactions', name: 'interactions', relCol: 'respondent_local', thisCol: 'id', onDelete: 'cascade', fetch: true},
    ]

    static async save(data, id, col = 'id') {
        const { kp_status = [], disability_status = [], ...mainData } = data;

        // Save main record first
        const savedId = await super.save(mainData, id, col);

        // Save related KP statuses
        for (const kp of kp_status) {
            await KPStatus.save({ name: kp, respondent: savedId });
        }

        // Save related disability statuses
        for (const dis of disability_status) {
            await DisabilityStatus.save({ name: dis, respondent: savedId });
        }

        return savedId; // Return id so caller can fetch full object if needed
    }

    static async upload(id) {
        if(!id) return;
        console.log(id)
        let instance = await Respondent.find(id)
        let ser = await instance.serialize();
        console.log(ser)
        ser.kp_status_names = ser.kp_status.map((kp) => (kp.name));
        ser.disability_status_names = ser.disability_status.map((d) => (d.name));
        try{
            console.log('uploading respondent', ser);
            const response = await fetchWithAuth(`/api/record/respondents/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ser),
            });
            const data = await response.json();
            if(response.ok){
                return data.id
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




