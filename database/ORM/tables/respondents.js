import fetchWithAuth from '@/services/fetchWithAuth';
import { randomUUID } from 'expo-crypto';
import BaseModel from '../base';


export class RespondentLink extends BaseModel {
    /*
    Link table that stores a custom local uuid alongside a server ID. Every time a user views or creates a 
    respondent, a local ID is created, and if applicable, it is paired with a server ID. This way, 
    when a user creates an interaction (linked to a respondent), it can always go to this table, which 
    will have the local ID and once the respondent is in the server, also the server ID. 
    */
    static table = 'respondent_links';

    static fields = {
        uuid: {type: 'text', primary: true}, //universal id that is used for linking an ID to interactions
        server_id: {type: 'integer', allow_null: true}, //corresponding server ID that interactions can pull from
    }

    static relationships = [];
}

export class SpecialAttribute extends BaseModel {
    /*
    stores a respondent's special attributes (m2o through)
    */
    static table = 'special_attributes';

    static fields = {
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'local_id'}},
        name: {type: 'text'},
    }

    static relationships = [];
}

export class KPStatus extends BaseModel {
    /*
    stores a respondent's kp statuses (m2o through)
    */
    static table = 'kp_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'local_id'}},
    }
    static relationships = [];
}
export class DisabilityStatus extends BaseModel {
    /*
    stores a respondent's disability statuses (m2o through)
    */
    static table = 'disability_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'local_id'}},
    }
    static relationships = [];
}

export class Pregnancy extends BaseModel {
    /*
    stores a respondent's pregnancy history (term began/term ended) (m2o through)
    */
    static table = 'pregnancies';

    static fields = {
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'local_id'}},
        term_began: {type: 'text'},
        term_ended: {type: 'text', allow_null: true}
    }

    static relationships = [];
}

export class Respondent extends BaseModel {
    /*
    Stores basic information about a respondent. Ideally this table should only live on the device
    while the user is offline and should be deleted once uploaded to the server to prevent proliferation
    of sensitive data. 
    */
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
    }

    //allow searching with these cols
    static searchCols = ['first_name', 'last_name', 'local_id', 'village', 'id_no'];

    static relationships = [
        {model: KPStatus, field: 'kp_status', name: 'kp_status', relCol: 'respondent', thisCol: 'local_id', onDelete: 'cascade', fetch: true}, 
        {model: DisabilityStatus, field: 'disability_status', name: 'disability_status', relCol: 'respondent', thisCol: 'local_id', onDelete: 'cascade', fetch: true}, 
        {model: SpecialAttribute, field: 'special_attribute', name: 'special_attributes', relCol: 'respondent', thisCol: 'local_id', onDelete: 'cascade', fetch: true},
        {model: Pregnancy, field: 'pregnancies', name: 'pregnancies', relCol: 'respondent', thisCol: 'local_id', onDelete: 'cascade', fetch: true}
    ]

    //extend serializer since the server sends hiv data as an object
    async serialize() {
        let baseSerialized = await super.serialize();
        baseSerialized.hiv_status = {hiv_positive: baseSerialized.hiv_positive, date_positive: baseSerialized.date_positive};
        return baseSerialized;
    }

    //custom save method that parses out m2o fields and saves them in the correct table
    static async save(data, id, col = 'id') {
        const { special_attribute=[], kp_status = [], disability_status = [], ...mainData } = data;
        const newUUID = data?.local_id ? data.local_id : randomUUID(); //will serve as the primary key and the link key
        const link = await RespondentLink.save({ uuid: newUUID });
        mainData.local_id = newUUID
        // Save main record first
        const savedId = await super.save(mainData, id, col);
        console.log(newUUID)
        // Save related KP statuses
        await KPStatus.delete(newUUID, 'respondent');
        for (const kp of kp_status) {
            const results = await KPStatus.filter({name: kp, respondent: newUUID});
            if(!results || results.length == 0) await KPStatus.save({ name: kp, respondent: newUUID });
        }
        await DisabilityStatus.delete(newUUID, 'respondent');
        // Save related disability statuses
        for (const dis of disability_status) {
            const results = await DisabilityStatus.filter({name: dis, respondent: newUUID});
            if(!results || results.length == 0) await DisabilityStatus.save({ name: dis, respondent: newUUID });
        }
        await SpecialAttribute.delete(newUUID, 'respondent');
        // Save related special attributes
        for (const attr of special_attribute) {
            const results = await SpecialAttribute.filter({name: attr, respondent: newUUID});
            if(!results || results.length == 0) await SpecialAttribute.save({ name: attr, respondent: newUUID });
        }
        return newUUID; // Return id so caller can fetch full object if needed
    }

    //custom function to upload all local respondents to the server
    static async upload() {
        const unsynced = await Respondent.all();
        if(unsynced.length === 0){
            console.log('No interactions to sync');
            return false;
        }
        let toSync = []; //array of data to upload
        for(const instance of unsynced){
            //get serialized data and convert a few field names to how the backend expects the data
            let ser = await instance.serialize();
            ser.kp_status_names = ser.kp_status.map((kp) => (kp.name));
            ser.disability_status_names = ser.disability_status.map((d) => (d.name));
            ser.special_attribute_names = ser.special_attribute.map((d) => (d.name));
            ser.hiv_status_data = {hiv_positive: ser?.hiv_positive ?? null, date_positive: ser?.date_positive ?? null};
            ser.pregnancy_data = ser.pregnancies
            toSync.push(ser);
        }
        console.log(toSync)
        try{
            console.log('uploading respondents', toSync);
            const response = await fetchWithAuth(`/api/record/respondents/mobile/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toSync),
            });
            const data = await response.json();
            if(response.ok){
                const map = data.mappings; //server will return a map of local IDs that were uploaded and their server ID
                for(const instance of map){
                    const local = instance.local_id;
                    const server = instance.server_id;
                    const updated = await RespondentLink.save({ 'server_id': server, 'uuid': local }); //if server confirmed this was uploaded, save the server ID in the links table
                    await Respondent.delete(local, 'local_id'); //then delete from device
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




