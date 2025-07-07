import { querySelector, queryWriter } from '@/database/queryWriter';
import fetchWithAuth from '../../services/fetchWithAuth';

async function getSubcats(interactionId) {
    const rows = await querySelector(
        `SELECT subcategory, numeric_component, linked_id FROM interaction_subcategories WHERE interaction = ?`,
        [interactionId]
    );
    const subcats = rows.map(row => ({'id': row.linked_id, 'name': row.subcategory, 'numeric_component': row.numeric_component}))
    return subcats 
}

export default async function syncInteractions() {
    const interactionsToSync = await querySelector(
        `SELECT id, respondent_server, task, numeric_component, date FROM interactions WHERE synced = 0 AND respondent_server IS NOT NULL`
    );

    if (!interactionsToSync.length) {
        console.log("No interactions to sync");
        return true;
    }

    const interactionMap = {};
    const toSync = new Set();

    for (const row of interactionsToSync) {
        const subcats = await getSubcats(row.id); 
        console.log('cat', subcats) 
        const respondentId = row.respondent_server;
        const taskObject = {
            id: row.id,  // optional, for local tracking
            task: row.task,
            numeric_component: row.numeric_component,
            interaction_date: row.date,
            subcategories_data: subcats,
        };

        if (!interactionMap[respondentId]) {
            interactionMap[respondentId] = [];
        }

        interactionMap[respondentId].push(taskObject);
        toSync.add(respondentId);
    }

    // Convert into array of { respondent, tasks: [...] }
    const grouped = Object.entries(interactionMap).map(([respondentId, tasks]) => ({
        respondent: parseInt(respondentId),
        tasks,
    }));
    
    for (const id of toSync) {
        const target = grouped.find(g => g.respondent === id);
        const interactionIds = target.tasks.map(ir => ir.id);

        try {
        const res = await fetchWithAuth(`/api/record/interactions/batch/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(target),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to sync interaction group ${id}: ${errorText}`);
        }

        for (const interactionId of interactionIds) {
            await queryWriter(`UPDATE interactions SET synced = 1 WHERE id = ?`, [interactionId]);
            console.log(`Synced interaction ${interactionId} successfully.`);
        }
        } catch (err) {
        console.error(`Sync failed for respondent ${id}:`, err);
        }
  }

  return true;
}