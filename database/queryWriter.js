import openDB from './dbManager';

export const queryWriter = async (query, params = []) => {
    try {
        const db = await openDB();
        const result = await db.runAsync(query, params);
        return result;
    } 
    catch (err) {
        console.error('Failed to write query:', err, query, params);
        throw err;
    }
};

export const querySelector = async (query, params = []) => {
    try {
        const db = await openDB();
        const result = await db.getAllAsync(query, params);
        return result;
    } 
    catch (err) {
        console.error('Failed to get query:', err, query, params);
        throw err;
    }
};

export const loadLocalByID = async(table, column, value) => {
    try{
        console.log(`Pulling records from ${table} where ${column}=${value}`);
        const results = await querySelector(`SELECT * FROM ${table} WHERE ${column} = ?`, [value]);
        if (Array.isArray(results) && results.length > 0) {
            return results;
        } 
        else {
            console.warn(`No record found in ${table} with ${column}=${value}`);
            return null;
        }
    }
    catch(err){
        console.error(`Error fetching records from ${table}`, err)
    }
}

export const loadLocalFromArray = async(table, column, values=[]) => {
    if(!values || values.length === 0){
        console.warn('No values provided')
        return []
    }
    let clauseArray = []
    values.forEach((val) => {
        clauseArray.push(`${column} = ?`)
    })
    const clause = clauseArray.join(` OR `)
    try{
        console.log(`Pulling records from ${table} where ${column}=${values}`);
        const results = await querySelector(`SELECT * FROM ${table} WHERE ${clause}`, values);
        if (Array.isArray(results) && results.length > 0) {
            return results;
        } 
        else {
            console.warn(`No record found in ${table} with ${values} in ${column}`);
            return null;
        }
    }
    catch(err){
        console.error(`Error fetching records from ${table}`, err)
    }
}