import openDB from '@/database/dbManager';
import { Indicator, IndicatorPrerequisite, IndicatorSubcategory, RequiredAttribute } from './tables/indicators';
import { Organization, Project, Task } from './tables/tasks';

async function clearTables(){
    /*
    Helper function that clears all existing task data for keepin it fresh. 
    */
    const db = await openDB();
    //cascade might take care of all of these but play it safe
    const tables = ['tasks', 'projects', 'organizations', 'indicator_subcategories', 'indicators']
    for(const table of tables){
        await db.runAsync(`DELETE FROM ${table}`);
    }
}

export default async function saveTasks(data){
    /*
    Takes data recieved from the server and converts saves it locally. Task data includes project, indicator,
    and some organization info that we will also save locally. 
    - data (object): task data from the server to save. 
    */

    if(!data) return;
    await clearTables(); //start by clearning existing tasks (this should only be called when data is already in memory)
    for (const item of data){
        //parse out and save task data
        const task = {
            id: item.id,
            display_name: item.display_name,
            organization: item.organization.id,
            project: item.project.id,
            indicator: item.indicator.id
        };
        await Task.save(task);
        
        //parse out and save project data
        const project = {
            id: item.project.id,
            name: item.project.name,
            description: item.project.description,
            start: item.project.start,
            end: item.project.end,
        };
        await Project.save(project);
        //parse out and save org data
        const organization = {
            id: item.organization.id,
            name: item.organization.name
        }
        await Organization.save(organization);

        //parse out and save indicator data
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

        //parse out and save indicaotr subcategory data (unless matched, in which case serialization will handle it)
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
        //parse out and save indicator prerequisite data
        if(item.indicator.prerequisites.length > 0){
            for(const prereq of item.indicator.prerequisites){
                const ip = {
                    dependent_id: item.indicator.id,
                    prerequisite_id: prereq.id
                }
                await IndicatorPrerequisite.save(ip)
            }
        }

        if(item.indicator.required_attributes.length > 0){
            for(const attr of item.indicator.required_attributes){
                const data = {
                    indicator: item.indicator.id,
                    name: attr.name,
                }
                await RequiredAttribute.save(data);
            }
        }
    }
}