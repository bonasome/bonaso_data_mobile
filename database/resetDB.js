import openDB from './dbManager';

export default async function resetDatabase() {
    const db = await openDB()
    const tables = ['respondents', 'interactions', 'interaction_subcategories', 'respondent_kp_status', 'respondent_disability_status', 'indicators', 'indicator_subcategories', 'tasks']; // add all your table names here

    for (const table of tables) {
        await db.runAsync(`DROP TABLE IF EXISTS ${table};`);
    }
}