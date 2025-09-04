import openDB from './dbManager';

export default async function resetDatabase() {
    /*
    Dev function that will wipe some potentially troublesome tables form the cv. 
    Useful if you're like me and you mess up your db a lot with crappy code and then have stale values
    messing up your uploads.
    */
    const db = await openDB()
    const tables = ['respondents', 'interactions', 'interaction_subcategories', 'respondent_kp_status', 'respondent_disability_status', 'indicators', 'indicator_subcategories', 'tasks']; // add all your table names here

    for (const table of tables) {
        await db.runAsync(`DROP TABLE IF EXISTS ${table};`);
    }
}