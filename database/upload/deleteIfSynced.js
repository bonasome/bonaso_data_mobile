import { queryWriter } from '@/database/queryWriter';

export default async function deleteIfSynced() {
    // First, delete related kp_status and disability_status rows
    await queryWriter(`
        DELETE FROM respondent_kp_status 
        WHERE respondent IN (SELECT id FROM respondents WHERE synced = ?)`, 
        [1]
    );

    await queryWriter(`
        DELETE FROM respondent_disability_status 
        WHERE respondent IN (SELECT id FROM respondents WHERE synced = ?)`, 
        [1]
    );
    const interesult = await queryWriter(`DELETE FROM interactions WHERE synced = ?`, [1]);
    console.log(`Deleted ${interesult.rowsAffected || 0} synced interactions`);

    // Then delete the respondents
    const result = await queryWriter(`DELETE FROM respondents WHERE synced = ?`, [1]);
    console.log(`Deleted ${result.rowsAffected || 0} synced respondents and their related statuses`);
}