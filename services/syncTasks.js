import saveTasks from '@/database/ORM/saveTasks';
import { SyncRecord } from '@/database/ORM/tables/meta';
import fetchWithAuth from './fetchWithAuth';


export default async function syncTasks(forceUpdate=false){
    /*
    Helper function that syncs tasks from the server
    - forceUpdate (boolean, optional): force a refresh regardless of when table was last updated
    */
    try {
        const now = new Date();
        //if not forceUpdate, check when items were last updated. By defualt wait 12 hours before updating again 
       if (!forceUpdate) {
            const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            const lastUpdated = await SyncRecord.updatedAt('tasks');
            if (lastUpdated) {
                const updatedDate = new Date(lastUpdated);
                console.log(updatedDate, twelveHoursAgo);
                if (updatedDate > twelveHoursAgo) return; // skip if recent
            }
        }
        //if values are too old, fetch them again to keep things fresh
        console.log('fetching tasks...')
        const response = await fetchWithAuth('/api/manage/tasks/mobile/');
        const data = await response.json();
        if (response.ok) {
            await saveTasks(data); //call helper to save task data to the correct tables
            await SyncRecord.save({table_updated: 'tasks', updated_at: now.toISOString()}); //update when last synced
        }
        else {
            console.error('API error', data);
        }
    } 
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}