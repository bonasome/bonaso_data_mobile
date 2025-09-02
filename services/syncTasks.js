import saveTasks from '@/database/ORM/saveTasks';
import { SyncRecord } from '@/database/ORM/tables/meta';
import fetchWithAuth from './fetchWithAuth';
export default async function syncTasks(forceUpdate=false){
    try {
        const now = new Date();
       if (!forceUpdate) {
            const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            const lastUpdated = await SyncRecord.updatedAt('tasks');
            if (lastUpdated) {
                const updatedDate = new Date(lastUpdated);
                console.log(updatedDate, twelveHoursAgo);
                if (updatedDate > twelveHoursAgo) return; // skip if recent
            }
        }
        console.log('fetching tasks...')
        const response = await fetchWithAuth('/api/manage/tasks/mobile/');
        const data = await response.json();
        if (response.ok) {
            await saveTasks(data);
            await SyncRecord.save({table_updated: 'tasks', updated_at: now.toISOString()});
        }
        else {
            console.error('API error', data);
        }
    } 
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}