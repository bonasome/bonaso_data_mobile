import openDB from '@/database/dbManager';
import { Assessment, Indicator, LogicCondition, LogicGroup, Option } from './tables/indicators';
import { Organization, Project, Task } from './tables/tasks';

async function clearTables(){
    /*
    Helper function that clears all existing task data for keepin it fresh. 
    */
    const db = await openDB();
    //cascade might take care of all of these but play it safe
    const tables = ['tasks', 'projects', 'organizations', 'assessments', 'indicators', 'options', 'logic_groups', 'logic_conditions']
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
            assessment: item.assessment.id
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

        const ass = item.assessment;

        //parse out and save assessment data
        const assessment= {
            id: ass.id,
            name: ass.name,
        }
        await Assessment.save(assessment);
        
        for(const ind of ass.indicators){
            //save each indicaotr
            const indicator = {
                id: ind.id,
                name: ind.name,
                required: ind.required,
                type: ind.type,
                match_options: ind.match_options,
                allow_none: ind.allow_none,
                indicator_order: ind.order,
                assessment: ass.id,
            }
            await Indicator.save(indicator)
            //save options if applicable
            if(['multi', 'single', 'multint'].includes(ind.type) && ind.options?.length > 0 && !ind.match_options){
                for(const o of ind.options){
                    const option = {
                        id: o.id,
                        name: o.name,
                        indicator: ind.id
                    }
                    await Option.save(option)
                }
            }

            //save logic information if applicable
            if(ind?.logic?.group_operator && ind?.logic?.conditions?.length > 0){
                const  logic_group = {
                    id: ind.logic.id,
                    indicator: ind.id,
                    group_operator: ind.logic.group_operator
                }
                await LogicGroup.save(logic_group);

                for(const c of ind.logic.conditions){
                    const condition = {
                        logic_group: ind.logic.id,
                        source_type: c.source_type,
                        source_indicator: c.source_indicator,
                        respondent_field: c.respondent_field,
                        operator: c.operator,
                        value_text: c.value_text,
                        value_option: c.value_option,
                        value_boolean: c.value_boolean ? 1 : 0,
                        condition_type: c.condition_type,
                    }
                    await LogicCondition.save(condition);
                }
            }
        }
    }
}