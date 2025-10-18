import fetchWithAuth from '@/services/fetchWithAuth';
import BaseModel from '../base';
import { Indicator } from './indicators';
import { RespondentLink } from './respondents';
import { Task } from './tasks';


export class Response extends BaseModel {
    /*
    Stores data about subcategories related to an indicator (m2o through)
    */
    static table = 'responses';

    static fields = {
        interaction: {type: 'integer', relationship: {table: 'interactions', column: 'id'}},
        indicator: {type: 'integer'},
        response_date: {type: 'text', allow_null: true},
        response_location: {type: 'text', allow_null: true},
        value: {type: 'text', allow_null: true}
    }
    static relationships = [
        {model: Indicator, field: 'indicator', name: 'indicators', relCol: 'id', thisCol: 'indicator', onDelete: 'cascade', fetch: true, many: false},
    ]
}

export class Interaction extends BaseModel {
    /*
    Stores information about interactions. Must be linked to a respondent link object through the respondent
    uuid. Storing to respondent link prevents confusion about referencing local IDs versus server IDs.
    */
    static table = 'interactions'

    static fields = {
        interaction_date: {type: 'text'},
        interaction_location: { type: 'text'},
        task: {type: 'integer', relationship: {table: 'task', column: 'id'}},
        respondent_uuid: {type: 'text'},
        comments: {type: 'text', allow_null: true},
        synced: {type: 'boolean', default: 0}
    }
    static relationships = [
        {model: Response, field: 'responses', name: 'responses', relCol: 'interaction', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true},
        {model: Task, field: 'task', name: 'tasks', relCol: 'id', thisCol: 'task', onDelete: 'nothing', fetch: true, many: false}
    ]

    static async save(data, id, col = 'id') {
        const { response_data, respondent_id, task_id, ...mainData } = data;
        // Save main record first
        mainData.task = task_id;
        console.log(mainData)
        const savedId = await super.save(mainData, id, col);
        // Save related responses
        await Response.delete(savedId, 'interaction')
        for(const key in response_data){
            const response = response_data[key];
            const ind = await Indicator.find(key);
            const indicator = await ind.serialize();
            if(indicator.type == 'multi') {
                for(const o in response.value){
                    const val = response.value[o]                    
                    await Response.save({ interaction: savedId, value: val.toString(), response_date: mainData.interaction_date, response_location: mainData.interaction_location, indicator: key })
                }
            }
            else{
                await Response.save({ interaction: savedId, value: response.value.toString(), response_date: mainData.interaction_date, response_location: mainData.interaction_location, indicator: key })
            }
            
        }
        return savedId; // Return id so caller can fetch full object if needed
    }
    

    //use to sync interactions with a respondent server ID, otherwise call sync for respondent, which I haven't written yet
    static async upload() {
        const unsynced = await Interaction.all();
        if(unsynced.length === 0){
            console.log('No interactions to sync');
            return false;
        }
        let toSync = []; //array of data to upload
        for(const item of unsynced){
            let ir = await item.serialize()
            //find related respondent, even if this was created offline, respondents are uploaded first so they should have a server ID by now 
            const respondent_link = await RespondentLink.find(ir.respondent_uuid, 'uuid');
            console.log(ir.respondent_uuid);
            let server_id = respondent_link?.server_id;
            if(ir.respondent_uuid == '7247baa0-6b8d-49df-8f89-6f00e564f40d') server_id = 4
            if(!server_id){
                console.error(`No respondent found in server for interaction ${ir.id}`);
                continue;
            }
            if(ir.numeric_component == '') ir.numeric_component = null;
            //interaction object as backend expects it
            ir.interaction_date = ir.interaction_date.includes('T') ? ir.interaction_date.toString().split('T')[0] : ir.interaction_date
            let responseData = {};
            let seen = [];

            ir.responses.forEach((r) => {
                const id = r.indicator.id;

                if (r.indicator.type === 'multi') {
                    if (seen.includes(id)) {
                        responseData[id].value.push(r.value);
                    } else {
                        responseData[id] = { value: [r.value] }; // initialize object
                    }
                } 
                else {
                    if (seen.includes(id)) {
                        console.error('Duplicate responses recorded');
                        return;
                    }
                    responseData[id] = r; // store the whole response
                }
                seen.push(id);
            });
            console.log(responseData)
            toSync.push({
                local_id: ir.id,
                respondent_id: server_id,
                interaction_date: ir.interaction_date,
                interaction_location: ir.interaction_location,
                task_id: ir.task.id,
                response_data: responseData,
            })
        }
        try {
            console.log('uploading interactions');
            const response = await fetchWithAuth(`/api/record/interactions/mobile/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toSync),
            });
            const data = await response.json();
            if(response.ok){
                //if OK, get map of uploaded ids and their corresponding server ID
                const map = data.mappings;
                console.log('map', map)
                for(const instance of map){
                    const local = instance.local_id;
                    console.log('local', local)
                    await Interaction.delete(local); //delete if the server confirms it is in the server by sending the ID pair back
                };
                if(data.errors.length > 0){
                    console.error(data.errors);
                }
                return true
            }
            else {
                console.error(data);
                return false;
            }
        } 
        catch (err) {
            console.error(`Sync failed:`, err);
            return false;
            }
    }
}