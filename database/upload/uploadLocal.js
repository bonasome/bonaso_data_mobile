import { querySelector, queryWriter } from '@/database/queryWriter';
import fetchWithAuth from '../../services/fetchWithAuth';
import organizeRespondentPayload from './organizeRespondentPayload';

// Get all subcategory names for a given interaction
async function getSubcats(interactionId) {
    const rows = await querySelector(
        `SELECT subcategory, numeric_component, linked_id FROM interaction_subcategories WHERE interaction = ?`,
        [interactionId]
    );

    const subcats = rows.map(row => ({'id': row.linked_id, 'name': row.subcategory, 'numeric_component': row.numeric_component}))
    return subcats 
}

export default async function syncRespondents() {
    console.log('syncing')
    const result = await querySelector(`SELECT id FROM respondents WHERE synced = 0`);
    if (!result.length) {
        console.log("No respondents to sync");
        return {'more': false, 'status': 'success'}
    };

    let more = result.length > 20;
    const respondents = [];
    let ids = []
    for (let i = 0; i < Math.min(20, result.length); i++) {
        const id = result[i].id;
        try {
            const { respondentData, sensitiveInfoData } = await organizeRespondentPayload(id);

            // collect any linked interactions
            const inter = await querySelector(`SELECT id FROM interactions WHERE respondent_local = ?`, [id]);
            const interactions = [];
            for (const { id: interactionId } of inter) {
                const rows = await querySelector(`SELECT * FROM interactions WHERE id = ?`, [interactionId]);
                if (!rows.length) throw new Error("Interaction not found");

                const interaction = rows[0];
                interactions.push({
                    task: interaction.task,
                    subcategories_data: await getSubcats(interaction.id),
                    numeric_component: interaction.numeric_component,
                    interaction_date: interaction.date,
                });
            }

            respondentData.interactions = interactions;
            respondentData.sensitive_info = sensitiveInfoData;

            respondents.push(respondentData);
            ids.push(id)
        } 
        catch (err) {
            console.error(`Error preparing respondent ${id}:`, err);
        }
    }
    try {
        const res = await fetchWithAuth(`/api/record/respondents/bulk/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(respondents),
        });

        if (!res.ok) throw new Error(`Failed to sync respondents`);
        const created = await res.json(); // optional use

        for (const id of created.local_ids) {
            await queryWriter(`UPDATE respondents SET synced = 1 WHERE id = ?`, [id]);
            await queryWriter(`UPDATE respondent_kp_status SET synced = 1 WHERE respondent = ?`, [id]);
            await queryWriter(`UPDATE respondent_disability_status SET synced = 1 WHERE respondent = ?`, [id]);
            await queryWriter(`UPDATE interactions SET synced = 1 WHERE respondent_local = ?`, [id]);
            console.log(`Synced respondent ${id}`);
        }
    } catch (err) {
        console.error(`Bulk sync failed:`, err);
    }

    return { status: 'success', more };
}