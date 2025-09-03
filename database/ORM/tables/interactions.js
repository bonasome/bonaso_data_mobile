import fetchWithAuth from '@/services/fetchWithAuth';
import BaseModel from '../base';
import { IndicatorSubcategory } from './indicators';
import { RespondentLink } from './respondents';
import { Task } from './tasks';
export class InteractionSubcategory extends BaseModel {
    static table = 'interaction_subcategories';

    static fields = {
        interaction: {type: 'integer', relationship: {table: 'interactions', column: 'id'}},
        numeric_component: {type: 'integer', allow_null: true},
        subcategory: {type: 'integer', relationship: {table: 'indicator_subcategories', column: 'server_id'}},
    }
    static relationships = [
        {model: IndicatorSubcategory, field: 'subcategory', name: 'indicator_subcategories', relCol: 'id', thisCol: 'subcategory', onDelete: 'nothing', fetch: true, many: false}, 
    ]
}

export class Interaction extends BaseModel {
    static table = 'interactions'

    static fields = {
        interaction_date: {type: 'text'},
        interaction_location: { type: 'text'},
        numeric_component: {type: 'integer', allow_null: true},
        task: {type: 'integer', relationship: {table: 'task', column: 'id'}},
        respondent_uuid: {type: 'text'},
        comments: {type: 'text', allow_null: true},
        synced: {type: 'boolean', default: 0}
    }
    static relationships = [
        {model: InteractionSubcategory, field: 'subcategories', name: 'interaction_subcategories', relCol: 'interaction', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true},
        {model: Task, field: 'task', name: 'tasks', relCol: 'id', thisCol: 'task', onDelete: 'nothing', fetch: true, many: false}
    ]

    static async save(data, id, col = 'id') {
        const { subcategory_data = [],  ...mainData } = data;
        // Save main record first
        const savedId = await super.save(mainData, id, col);
        
        //to avoid wierd duplictes, play it safe and delete any exisitng subcategory data
        if(subcategory_data.length > 0){
            await InteractionSubcategory.delete(savedId, 'interaction');
            // Save related subcategories
            for (const subcat of subcategory_data) {
                await InteractionSubcategory.save({ subcategory: subcat.subcategory.id, numeric_component: subcat.numeric_component, interaction: savedId });
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
        let toSync = [];
        for(const item of unsynced){
            let ir = await item.serialize()
            const subcategory_data = Array.isArray(ir.subcategories)
            ? ir.subcategories.map(cat => ({
                id: null,
                subcategory: { id: cat.subcategory.id, name: cat.subcategory.name },
                numeric_component: (cat.numeric_component == '' ? null : cat.numeric_component),
            }))
            : [];
            const respondent_link = await RespondentLink.find(ir.respondent_uuid, 'uuid');
            const server_id = respondent_link?.server_id;
            if(!server_id){
                console.error(`No respondent found in server for interaction ${ir.id}`);
                continue;
            }
            if(ir.numeric_component == '') ir.numeric_component = null
            toSync.push({
                local_id: ir.id,
                respondent: server_id,
                interaction_date: ir.interaction_date,
                interaction_location: ir.interaction_location,
                task_id: ir.task.id,
                numeric_component: ir.numeric_component,
                subcategories_data: subcategory_data,
                comments: ir.comments
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
                const map = data.mappings;
                console.log('map', map)
                for(const instance of map){
                    const local = instance.local_id;
                    console.log('local', local)
                    await Interaction.delete(local);
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