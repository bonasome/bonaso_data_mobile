import { queryWriter } from "./queryWriter";

const queries = [
    `CREATE TABLE IF NOT EXISTS sync_record (
        field TEXT PRIMARY KEY,
        last_synced TEXT NOT NULL
    );`,

  `CREATE TABLE IF NOT EXISTS indicators (
    id INTEGER PRIMARY KEY NOT NULL,
    code TEXT,
    name TEXT,
    description TEXT,
    prerequisite INTEGER,
    require_numeric BOOLEAN,
    FOREIGN KEY (prerequisite) REFERENCES indicators(id)
  );`,

  `CREATE TABLE IF NOT EXISTS indicator_subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    linked_id INTEGER,
    name TEXT,
    indicator INTEGER NOT NULL,
    FOREIGN KEY (indicator) REFERENCES indicators(id),
    UNIQUE (name, indicator) ON CONFLICT IGNORE
  );`,

  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT,
    description TEXT,
    start TEXT,
    end TEXT,
    client TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY NOT NULL,
    project INTEGER,
    indicator INTEGER,
    FOREIGN KEY (project) REFERENCES projects(id),
    FOREIGN KEY (indicator) REFERENCES indicators(id)
  );`,

  `CREATE TABLE IF NOT EXISTS respondents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    is_anonymous BOOLEAN DEFAULT 0,
    linked_id INTEGER,
    uuid TEXT,
    id_no TEXT,
    first_name TEXT,
    last_name TEXT,
    dob TEXT,
    age_range TEXT,
    sex TEXT,
    ward TEXT,
    village TEXT,
    district TEXT,
    citizenship TEXT,
    email TEXT,
    contact_no TEXT,
    created_by TEXT,
    new_hiv_positive BOOLEAN,
    new_pregnant BOOLEAN,
    synced BOOLEAN DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS respondent_kp_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    respondent INTEGER NOT NULL,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (respondent) REFERENCES respondents(id)
  );`,

  `CREATE TABLE IF NOT EXISTS respondent_disability_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    respondent INTEGER NOT NULL,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (respondent) REFERENCES respondents(id)
  );`,

  `CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    location TEXT,
    numeric_component INTEGER,
    task INTEGER NOT NULL,
    respondent_local INTEGER,
    respondent_server INTEGER,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (task) REFERENCES tasks(id),
    FOREIGN KEY (respondent_local) REFERENCES respondents(id)
  );`,

  `CREATE TABLE IF NOT EXISTS interaction_subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interaction INTEGER NOT NULL,
    linked_id INTEGER,
    numeric_component INTEGER,
    subcategory TEXT,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (interaction) REFERENCES interactions(id)
  );`,

  `CREATE TABLE IF NOT EXISTS districts (
        value TEXT PRIMARY KEY NOT NULL,
        label TEXT
  );`,
  
  `CREATE TABLE IF NOT EXISTS sex (
        value TEXT PRIMARY KEY NOT NULL,
        label TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS age_range (
        value TEXT PRIMARY KEY NOT NULL,
        label TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS kp_types (
        value TEXT PRIMARY KEY NOT NULL,
        label TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS disability_types(
        value TEXT PRIMARY KEY NOT NULL,
        label TEXT
  );`,
];

export default async function initDatabase(){
    try{
        for(const query of queries){
            await queryWriter(query, [])
        }
        console.log('Database initialized successfuly!')
    }
    catch(err){
        console.log('Database failed to initialize: ', err)
    }
}