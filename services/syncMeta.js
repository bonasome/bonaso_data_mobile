import saveMeta from '@/database/ORM/saveMeta';
import { SyncRecord } from '@/database/ORM/tables/meta';
import fetchWithAuth from './fetchWithAuth';


export default async function syncMeta(forceUpdate = false){
    /*
    Helper function that syncs the respondent meta from the server
    - forceUpdate (boolean, optional): force a refresh regardless of when table was last updated
    */
    try {
        const now = new Date(); //current date time
        //if not forceUpdate, check when items were last updated. By defualt wait 12 hours before updating again 

        if(!forceUpdate){
            console.log('checking update history');
            const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            const lastUpdated = SyncRecord.updatedAt('respondents_meta');
            if(lastUpdated){
                const updatedDate = new Date(lastUpdated);
                if(updatedDate < twelveHoursAgo) return; //if recent enough, do nothing
            }
        }
        //if values are too old, fetch the meta again and update
        console.log('fetching respondents meta...');
        const response = await fetchWithAuth('/api/record/respondents/meta/');
        const data = await response.json();
        if(response.ok){
            await saveMeta(data); //save the data to the database
            await SyncRecord.save({table_updated: 'respondents_meta', updated_at: now.toISOString()}); //update the sync record
        }
        else {
            console.error('API error', data);
        }
    }
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}