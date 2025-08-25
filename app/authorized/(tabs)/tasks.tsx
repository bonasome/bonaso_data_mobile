import StyledScroll from "@/components/styledScroll";
import StyledText from "@/components/styledText";
import { useConnection } from "@/context/ConnectionContext";
import { Task } from "@/database/ORM/tables/tasks";
import syncTasks from '@/services/syncTasks';
import theme from "@/themes/themes";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";


function TaskCard({ task }) {
    const [expanded, setExpanded] = useState(false);
    return(
        <View style={styles.card}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                {task?.indicator && <StyledText type='subtitle' >{task.display_name}</StyledText>}
            </TouchableOpacity>

            {expanded &&  <View>
                <StyledText type="defaultSemiBold">{task.project.name}</StyledText>
                {task.indicator.prerequisites && <View>
                    <StyledText type="subtitle">Prerequisite Indicators</StyledText>
                    {task.indicator.prerequisites.map((p) => (
                        <View key={p.id} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{`${p.indicator.code}: ${p.indicator.name}`}</StyledText>
                        </View>
                    ))}
                </View>}

                {task.indicator.subcategories.length > 0 && <View>
                    <StyledText type="subtitle">Subcategories</StyledText>
                    {task.indicator.subcategories.map((cat) => (
                        <View key={cat.id} style={styles.li}>
                            <StyledText style={styles.bullet}>{'\u2022'}</StyledText> 
                            <StyledText>{cat.name}</StyledText>
                        </View>
                    ))}
                </View>}
                
                {task.indicator.require_numeric && <StyledText type="defaultSemiBold">
                    Requires number
                </StyledText>}

            </View>}
        </View>
    )
}

export default function Tasks() {
    const { isServerReachable } = useConnection();
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const loadTasks = async () => {
            if (isServerReachable){
                await syncTasks();
            }   
            const myTasks = await Task.all();
            let serialized = await Promise.all(myTasks.map(t => t.serialize()));
            console.log(serialized)
            setTasks(serialized);
        };
        loadTasks();
    }, [isServerReachable]);

    return (
        <StyledScroll>
            <StyledText type="title">Your Tasks</StyledText>
            {tasks.length > 0 && tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
            ))}
            {tasks.length === 0 && <StyledText style={styles.card} type="defaultSemiBold">No tasks yet!</StyledText>}
        </StyledScroll>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        backgroundColor: theme.colors.bonasoUberDarkAccent,
        flex: 1,
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10,
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