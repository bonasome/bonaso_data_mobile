import saveTasks from '@/database/ORM/saveTasks';
import fetchWithAuth from './fetchWithAuth';

export default async function syncTasks(){
    try {
        const response = await fetchWithAuth('/api/manage/tasks/?indicator_type=respondent');
        const data = await response.json();
        if (response.ok) {
            await saveTasks(data.results);
        }
        else {
            console.error('API error', data);
        }
    } 
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}