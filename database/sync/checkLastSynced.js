import { querySelector } from "../queryWriter";

export default async function checkLastSynced(field) {
    try {
        const results = await querySelector(
            `SELECT last_synced FROM sync_record WHERE field = ? LIMIT 1`,
            [field]
        );

        if (results.length > 0) {
            return results[0].last_synced;
        } 
        else {
            return null; // No record found for that field
        }
    } 
    catch (err) {
        console.error('Failed to check last synced time:', err);
        return null;
    }
}