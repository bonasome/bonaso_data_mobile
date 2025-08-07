import { queryWriter } from "./queryWriter";

const queries = [
  `CREATE TABLE IF NOT EXISTS sync_record (
      field TEXT PRIMARY KEY,
      last_synced TEXT NOT NULL
  );`,

  /*
  ###===HELPER TABLES===###
    These tables exist to store supplementary information that is needed to record information offline,
    but are not meant to be edited offline
  */

  //table that stores the core of an indicator
  `CREATE TABLE IF NOT EXISTS indicators (
    id INTEGER PRIMARY KEY NOT NULL,
    code TEXT,
    name TEXT,
    description TEXT,
    prerequisite INTEGER,
    require_numeric BOOLEAN,
    FOREIGN KEY (prerequisite) REFERENCES indicators(id)
  );`,
  //helper table that stores subcategories
  `CREATE TABLE IF NOT EXISTS indicator_subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    linked_id INTEGER,
    name TEXT,
    indicator INTEGER NOT NULL,
    FOREIGN KEY (indicator) REFERENCES indicators(id),
    UNIQUE (name, indicator) ON CONFLICT IGNORE
  );`,
  
  //helper table that stores prerequisites
  `CREATE TABLE IF NOT EXISTS indicator_prerequisities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dependent_id INTEGER NOT NULL,
    prerequisite_id INTEGER NOT NULL,
    FOREIGN KEY (dependent_id) REFERENCES indicators(id),
    FOREIGN KEY (prerequisite_id) REFERENCES indicators(id)
  );`,

  //helper table that stores information about required attributes
  `CREATE TABLE IF NOT EXISTS indicator_required_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attribute_id INTEGER NOT NULL,
    indicator_id INTEGER NOT NULL,
    FOREIGN KEY (indicator_id) REFERENCES indicators(id),
  );`,

  //helper table that stores information about organizations
  `CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT
  );`,

  //helper table that stores information about organizations relationships to each other
  `CREATE TABLE IF NOT EXISTS organization_relationships(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    parent_organization_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (parent_organization_id) REFERENCES organizations(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
  );`

  //helper tble that stores information about projects
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT,
    description TEXT,
    start TEXT,
    end TEXT,
    client TEXT
  );`,

  //stores a task (junction of an indicator, org, and project), the key thing that an interaction is liked to
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY NOT NULL,
    project INTEGER,
    indicator INTEGER,
    organization INTEGER,
    FOREIGN KEY (project) REFERENCES projects(id),
    FOREIGN KEY (indicator) REFERENCES indicators(id),
    FOREIGN KEY (organization) REFERENCES organizations(id)
  );`,

  /*
    ###===STORAGE TABLES===###
      These tables store information that is recorded offline and should be synced.
      They all have a synced column to determine if the data is in the db.
  */
 //respondent, stores demographic information about a person
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
    plot_no TEXT,
    village TEXT,
    district TEXT,
    citizenship TEXT,
    email TEXT,
    contact_no TEXT,
    created_by TEXT,
    hiv_positive BOOLEAN,
    date_positive TEXT,
    term_began TEXT,
    term_ended TEXT,
    synced BOOLEAN DEFAULT 0
  );`,
  //helper table that stores the kp types for a given respondent
  `CREATE TABLE IF NOT EXISTS respondent_kp_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    respondent INTEGER NOT NULL,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (respondent) REFERENCES respondents(id)
  );`,
  //helper table that stores disability types for a given respondent
  `CREATE TABLE IF NOT EXISTS respondent_disability_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    respondent INTEGER NOT NULL,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (respondent) REFERENCES respondents(id)
  );`,

  //table that stores information about interactions, relates to a task and a respondent and also captures meta info like date/location/numeric info
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
  //helper table that stores subcategories related to an indicator, optionally accepts a number
  `CREATE TABLE IF NOT EXISTS interaction_subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interaction INTEGER NOT NULL,
    linked_id INTEGER,
    numeric_component INTEGER,
    subcategory TEXT,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (interaction) REFERENCES interactions(id)
  );`,

  /*
    ###===META TABLES===###
      These tables store meta information about models to help with building forms
  */
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