import saveTasks from '@/database/ORM/saveTasks';
import fetchWithAuth from './fetchWithAuth';

export default async function syncTasks(){
    try {
        const response = await fetchWithAuth('/api/manage/tasks/mobile/');
        const data = await response.json();
        console.log(data)
        if (response.ok) {
            await saveTasks(data);
        }
        else {
            console.error('API error', data);
        }
    } 
    catch (err) {
        console.error('Auth error, user should login again', err);
    }
}