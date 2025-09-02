import saveMeta from '@/database/ORM/saveMeta';
import { SyncRecord } from '@/database/ORM/tables/meta';
import fetchWithAuth from './fetchWithAuth';
export default async function syncMeta(forceUpdate = false){
    try {
        const now = new Date();
        if(!forceUpdate){
            console.log('checking update history')
            const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
            const lastUpdated = SyncRecord.updatedAt('respondents_meta');
            if(lastUpdated){
                const updatedDate = new Date(lastUpdated);
                if(updatedDate < twelveHoursAgo) return;
            }
        }
        console.log('fetching respondents meta...')
        const response = await fetchWithAuth('/api/record/respondents/meta/');
        const data = await response.json();
        if(response.ok){
            await saveMeta(data);
            await SyncRecord.save({table_updated: 'respondents_meta', updated_at: now.toISOString()});
        }
        else {
            console.error('API error', data);
        }
    }
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}