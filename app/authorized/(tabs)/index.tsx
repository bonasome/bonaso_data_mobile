import StyledLink from "@/components/styledLink";
import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
//import { useAuth } from "@/context/AuthContext";
import { useConnection } from "@/context/ConnectionContext";
import initDB from '@/database/initDB';
//import resetDB from '@/database/resetDB';
import syncRespondentMeta from '@/database/sync/syncRespondentMeta';
import syncTasks from '@/database/sync/syncTasks';
import uploadLocal from '@/database/upload/uploadLocal';
import fetchWithAuth from "@/services/fetchWithAuth";
import { useEffect } from "react";


export default function Index() {
    //const { signOut } = useAuth();
    const { isServerReachable } = useConnection();
    useEffect(() => {
        const setDB = async() => {
            //await resetDB()
            await initDB();
        }
        setDB();
    }, [])

    useEffect(() => {
        if(isServerReachable){
            const syncLocal = async() => {
                await uploadLocal();
            }
            syncLocal();
        }
    }, [isServerReachable])

    useEffect(() => {
        if(!isServerReachable) return;
        const fetchTasks = async () => {
            try {
                const response = await fetchWithAuth('/api/manage/tasks/');
                if (response.ok) {
                    const data = await response.json();
                    await syncTasks(data.results);
                } 
                else {
                    console.error('API error', response.status);
                }
            } 
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        }
        fetchTasks();
        
        const fetchMeta = async () => {
            try {
                  await syncRespondentMeta()
            }
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        }
        fetchMeta();
        
    }, [])

    return (
        <StyledScroll>
            <StyledText type='subtitle'>Title.</StyledText>
            <StyledLink href="/about">Learn More</StyledLink>
        </StyledScroll>
    );
}

