import * as SQLite from 'expo-sqlite';

let db;
//helper function that inits the database, use before running any raw SQL query
const openDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('forms.db');
    }
    return db;
};

export default openDB;