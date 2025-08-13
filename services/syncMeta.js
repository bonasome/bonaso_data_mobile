import saveMeta from '@/database/ORM/saveMeta';
import fetchWithAuth from './fetchWithAuth';

export default async function syncMeta(){
    try {
        const response = await fetchWithAuth('/api/record/respondents/meta/');
        const data = await response.json();
        if(response.ok){
            await saveMeta(data);
        }
        else {
            console.error('API error', data);
        }
    }
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}