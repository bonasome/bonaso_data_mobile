import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import checkLastSynced from '@/database/sync/checkLastSynced';
import mapTasks from '@/database/sync/mapTasks';
import syncTasks from '@/database/sync/syncTasks';
import compTime from '@/services/compTime';
import fetchWithAuth from "@/services/fetchWithAuth";
import theme from "@/themes/themes";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

function TaskCard({ task }) {
    useEffect(() => {

    }, [])
    const [expanded, setExpanded] = useState(false);

    return(
        <View style={styles.card}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                {task?.indicator && <StyledText type='subtitle' >{task.indicator.code}: {task.indicator.name}</StyledText>}
            </TouchableOpacity>

            {expanded && 

                <View>

                    <StyledText type="defaultSemiBold" >{task.project.name}</StyledText>

                    {task.indicator.prerequisite && 
                        <StyledText type="defaultSemiBold" >{task.indicator.prerequisite.name}</StyledText>
                    }

                    {task.indicator.subcategories.length > 0 && 
                        <View>
                            <StyledText type="subtitle">Subcategories</StyledText>
                            {task.indicator.subcategories.map((cat) => (
                                <View key={cat.name} style={styles.li}>
                                    <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                                    <StyledText >{cat.name}</StyledText>
                                </View>
                            ))}
                        </View>
                    }
                    {task.indicator.require_numeric && 
                        <StyledText type="defaultSemiBold" >Requires number</StyledText>
                    }
                </View>
            }
        </View>
    )
    
}



export default function Tasks() {
    const { isServerReachable } = useConnection();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if (!isServerReachable) return;
        const maybeSync = async () => {
            const lastSynced = await checkLastSynced('tasks');
            const shouldSkip = compTime(lastSynced, 15);
            if (shouldSkip) return;

            try {
                const response = await fetchWithAuth('/api/manage/tasks/');
                if (response.ok) {
                    const data = await response.json();
                    await syncTasks(data.results);
                    const myTasks = await mapTasks(); // reload after syncing
                    setTasks(myTasks);
                } else {
                    console.error('API error', response.status);
                }
            } 
            catch (err) {
                console.error('Auth error, user should login again', err);
            }
        };

        maybeSync();
    }, [isServerReachable]);

    useEffect(() => {
        const loadTasks = async() => {
            const myTasks = await mapTasks();
            setTasks(myTasks);
        }
        loadTasks();
    }, [])

    return (
        <StyledScroll>
            {tasks.length > 0 && tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
            ))}
        </StyledScroll>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        flex: 1,
        justifyContent: 'center',
        marginBottom: 15,
    },
    ul: {
    paddingLeft: 20, // indent like <ul>
  },
  li: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 22,
    marginRight: 6,
  },

});