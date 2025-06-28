import { queryWriter } from '@/database/queryWriter';

export default async function resetDatabase() {
    const tables = ['respondents', 'interactions', 'interaction_subcategories', 'respondent_kp_status', 'respondent_disability_status', 'indicators', 'indicator_subcategories', 'tasks']; // add all your table names here

    for (const table of tables) {
        await queryWriter(`DROP TABLE IF EXISTS ${table};`);
    }
}