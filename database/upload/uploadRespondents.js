import { querySelector, queryWriter } from '@/database/queryWriter';
import fetchWithAuth from '../../services/fetchWithAuth';
import organizeRespondentPayload from './organizeRespondentPayload';
export default async function syncRespondents() {
    const result = await querySelector(
        `SELECT id FROM respondents WHERE synced = 0`
    );
    console.log(result)
    if (!result.length){
        console.log('No respondents to sync.')
        return [];
    } 
    let syncedIds = []
    for (const { id } of result) {
        try {
        const { respondentData, sensitiveInfoData } = await organizeRespondentPayload(id);

        // POST respondent
        const res1 = await fetchWithAuth(`/api/record/respondents/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(respondentData),
        });

        if (!res1.ok) throw new Error(`Failed to sync respondent ${id}`);

        const created = await res1.json();
        console.log('returned', created)
        const remoteId = created.id;
        syncedIds.push(remoteId)
        // POST sensitive info
        const res2 = await fetchWithAuth(`/api/record/respondents/${remoteId}/sensitive-info/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(sensitiveInfoData),
        });

        if (!res2.ok) throw new Error(`Failed to sync sensitive info for ${remoteId}`);

        // Mark as synced locally
        await queryWriter(`UPDATE respondents SET synced = 1 WHERE id = ?`, [id]);
        await queryWriter(`UPDATE respondent_kp_status SET synced = 1 WHERE respondent = ?`, [id]);
        await queryWriter(`UPDATE respondent_disability_status SET synced = 1 WHERE respondent = ?`, [id]);

        console.log(`Synced respondent ${id} successfully.`);

        } 
        catch (err) {
            console.error(`Sync failed for respondent ${id}:`, err);
        continue;
        }
    }
    return syncedIds
}