import fetchWithAuth from '@/services/fetchWithAuth';
import BaseModel from '../base';
import { IndicatorSubcategory } from './indicators';
export class InteractionSubcategory extends BaseModel {
    static table = 'interaction_subcategories';

    static fields = {
        interaction: {type: 'integer', relationship: {table: 'interactions', column: 'id'}},
        numeric_component: {type: 'integer', allow_null: true},
        subcategory: {type: 'integer', relationship: {table: 'indicator_subcategories', column: 'server_id'}},
    }
    static relationships = [
        {model: IndicatorSubcategory, field: 'subcategory', name: 'indicator_subcategories', relCol: 'id', thisCol: 'subcategory', onDelete: 'protect', fetch: true, many: false}, 
    ]
}

export class Interaction extends BaseModel {
    static table = 'interactions'

    static fields = {
        date: {type: 'text'},
        location: { type: 'text'},
        numeric_component: {type: 'integer', allow_null: true},
        task: {type: 'integer', relationship: {table: 'task', column: 'id'}},
        respondent_local: {type: 'integer', relationship: {table: 'respondent', column: 'id'}, allow_null: true},
        respondent_server: {type: 'integer', relationship: {table: 'respondent', column: 'server_id'}, allow_null: true},
        synced: {type: 'boolean', default: 0}
    }
    static relationships = [
        {model: InteractionSubcategory, field: 'subcategory_data', name: 'interaction_subcategories', relCol: 'interaction', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true}, 
    ]

    static async save(data, id, col = 'id') {
        const { subcategory_data = [],  ...mainData } = data;

        // Save main record first
        const savedId = await super.save(mainData, id, col);

        // Save related subcategories
        for (const subcat of subcategory_data) {
            await InteractionSubcategory.save({ subcategory: subcat.id, numeric_component: subcat.numeric_component, interaction: savedId });
        }
        return savedId; // Return id so caller can fetch full object if needed
    }

    //use to sync interactions with a respondent server ID, otherwise call sync for respondent, which I haven't written yet
    static async upload() {
        const unsynced = await Interaction.filter({'respondent_server': 'not_null'})
        if(unsynced.length === 0){
            console.log('No interactions to sync');
            return false;
        }
        let map = {};
        for(const item of unsynced){
            let ir = await item.serialize()
            console.log(ir);
            const subcategory_data = Array.isArray(ir.subcategory_data)
            ? ir.subcategory_data.map(cat => ({
                id: null,
                subcategory: { id: cat.subcategory.id, name: cat.subcategory.name },
                numeric_component: cat.numeric_component,
            }))
            : [];
            (map[ir.respondent_server] ??= []).push({
                interaction_date: ir.date,
                interaction_location: ir.location,
                task_id: ir.task,
                numeric_component: ir.numeric_component,
                subcategories_data: subcategory_data,
            });
        }
        const respondents = Object.keys(map)
        console.log(map);
        for(const r of respondents){
            try {
                const response = await fetchWithAuth(`/api/record/interactions/batch/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        respondent: r,
                        tasks: map[r]
                    }),
                });
                if(response.ok) return true;
                else {
                    const errorText = await response.text();
                    throw new Error(`Failed to sync interaction for respondent ${r}: ${errorText}`);
                }
            } 
            catch (err) {
                console.error(`Sync failed for respondent ${r}:`, err);
                return false;
            }
        }
    }
}