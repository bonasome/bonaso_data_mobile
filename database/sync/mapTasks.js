import { querySelector } from "../queryWriter";

export default async function mapTasks() {
    console.log('loading tasks...')
    const projects = await loadProjects();
    const indicators = await loadIndicators();
    const subcategories = await loadIndicatorSubcategories();
    const tasks = await loadTasks();

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));
    const indicatorMap = Object.fromEntries(indicators.map(i => [i.id, i]));

    // Group subcategories by indicator_id
    const subcategoryMap = {};
    for (const sub of subcategories) {
    if (!subcategoryMap[sub.indicator]) {
        subcategoryMap[sub.indicator] = [];
    }
    subcategoryMap[sub.indicator].push(sub);
    }
    const enrichedTasks = tasks.map(task => {
        const indicator = { ...indicatorMap[task.indicator], subcategories: subcategoryMap[task.indicator] || [] };

        return {
            ...task,
            project: projectMap[task.project],
            indicator: indicator,
        };
    });
    return enrichedTasks
}

export const loadTasks = async () => {
    try{
        console.log('loading from local storage')
        const results = await querySelector('SELECT * FROM tasks', []);
        let tasks = [];
        results.forEach((row) => tasks.push(row))
        return tasks
    }
    catch(err){
        console.error('Failed to fetch local data: ', err)
        return []
    }
}

export const loadProjects = async () => {
    try{
        console.log('loading from local storage')
        const results = await querySelector('SELECT * FROM projects', []);
        let projects = [];
        results.forEach((row) => projects.push(row))
        return projects
    }
    catch(err){
        console.error('Failed to fetch local data: ', err)
        return []
    }
}

export const loadIndicators = async () => {
    try{
        console.log('loading from local storage')
        const results = await querySelector('SELECT * FROM indicators', []);
        let indicators = [];
        results.forEach((row) => indicators.push(row))
        return indicators
    }
    catch(err){
        console.error('Failed to fetch local data: ', err)
        return []
    }
}

export const loadIndicatorSubcategories = async () => {
    try{
        console.log('loading from local storage')
        const results = await querySelector('SELECT * FROM indicator_subcategories', []);
        let subcats = [];
        results.forEach((row) => subcats.push(row))
        return subcats
    }
    catch(err){
        console.error('Failed to fetch local data: ', err)
        return []
    }
}