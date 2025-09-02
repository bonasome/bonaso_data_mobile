import openDB from '@/database/dbManager';
import { Indicator, IndicatorPrerequisite, IndicatorSubcategory } from './tables/indicators';
import { Organization, Project, Task } from './tables/tasks';

async function clearTables(){
    const db = await openDB();
    //cascade might take care of all of these but play it safe
    const tables = ['tasks', 'projects', 'organizations', 'indicator_subcategories', 'indicators']
    for(const table of tables){
        await db.runAsync(`DELETE FROM ${table}`);
    }
}

export default async function saveTasks(data){
    if(!data) return;
    await clearTables();
    for (const item of data){
        const task = {
            id: item.id,
            display_name: item.display_name,
            organization: item.organization.id,
            project: item.project.id,
            indicator: item.indicator.id
        };
        await Task.save(task);
        
        const project = {
            id: item.project.id,
            name: item.project.name,
            description: item.project.description,
            start: item.project.start,
            end: item.project.end,
        };
        await Project.save(project);

        const organization = {
            id: item.organization.id,
            name: item.organization.name
        }
        await Organization.save(organization);

        const indicator = {
            id: item.indicator.id,
            code: item.indicator.code,
            name: item.indicator.name,
            description: item.indicator.description,
            require_numeric: item.indicator.require_numeric,
            allow_repeat: item.indicator.allow_repeat,
            match_subcategories_to: item.indicator.match_subcategories_to,
        }
        await Indicator.save(indicator);

        if(item.indicator.subcategories.length > 0 && !item.indicator.match_subcategories_to){
            for(const subcat of item.indicator.subcategories){
                const is = {
                    indicator: item.indicator.id,
                    id: subcat.id,
                    name: subcat.name
                }
                await IndicatorSubcategory.save(is)
            }
        }

        if(item.indicator.prerequisites.length > 0){
            for(const prereq of item.indicator.prerequisites){
                const ip = {
                    dependent_id: item.indicator.id,
                    prerequisite_id: prereq.id
                }
                await IndicatorPrerequisite.save(ip)
            }
        }
    }
}