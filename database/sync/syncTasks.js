//pulls data from useEffect
import { queryWriter } from "../queryWriter";


export default async function syncTasks(data) {
    try{
        const projectIDs = []
        const indicatorIDs = []
        for(const task of data){
            const projectID = task.project.id
            if(!projectIDs.includes(projectID)){
                projectIDs.push(projectID);
                const projectName = task.project.name
                const projectDesc = task.project?.description || ''
                const projectStart = task.project.start
                const projectEnd = task.project.end
                const projectClient = task?.project?.client?.name ?? 'Unknown'
                await queryWriter(`INSERT OR REPLACE INTO projects (id, name, description, start, end, client) VALUES(
                    ?, ?, ?, ?, ?, ? )`, [projectID, projectName, projectDesc, projectStart, projectEnd, projectClient] )
            }
            const indicatorID = task.indicator.id
            if(!indicatorIDs.includes(indicatorID)){
                indicatorIDs.push(indicatorID);
                const indicatorName = task.indicator.name
                const indicatorCode = task.indicator.code
                const indicatorDesc = task.indicator.description || ''
                const numeric = task.indicator.require_numeric || false
                const prereq = task.indicator.prerequisite?.id ?? null;
                await queryWriter(`INSERT OR REPLACE INTO indicators (id, code, name, description, require_numeric, prerequisite) VALUES(
                    ?, ?, ?, ?, ?, ? )`, [indicatorID, indicatorCode, indicatorName, indicatorDesc, numeric, prereq] )
                if(task?.indicator?.subcategories?.length > 0){
                    for(const cat of task.indicator.subcategories){
                        await queryWriter(`INSERT OR REPLACE INTO indicator_subcategories (linked_id, indicator, name) VALUES(
                    ?, ?, ?)`, [cat.id, indicatorID, cat.name] )
                    }
                }
            }
            await queryWriter(`INSERT OR REPLACE INTO tasks (id, project, indicator) VALUES (
                ?, ?, ?)`, [task.id, task.project.id, task.indicator.id] )
        }
        await updateSyncTime('tasks');
        await updateSyncTime('projects');
        await updateSyncTime('indicators');

    }
    catch(err){
        console.log('Error syncing tasks: ', err)
    }
    
}

const updateSyncTime = async (field) => {
    await queryWriter(
        `INSERT OR REPLACE INTO sync_record (field, last_synced) VALUES (?, ?)`,
        [field, new Date().toISOString()]
    );
}