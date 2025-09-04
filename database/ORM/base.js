import openDB from '../dbManager';


export default class BaseModel {
    /*
    Base ORM model that can be expanded on to create models that can interact with the database. 
    */
    static table; //name of the table as it will appear in the database
    
    //function that fetches all records
    static async all() {
        const db = await openDB();
        const results = await db.getAllAsync(`SELECT * FROM ${this.table}`);
        return results.map(r => new this(r));
    }

    static async find(id, col = 'id') {
        /*
        fetches a single record based on an ID and returns it as a model instance
        if value provided is not a primary key, it will return only the first one found
        - id: value to find
        - col (string, optional): column to find value in (in case primary key column is not named ID)
        */
        const db = await openDB();
        const result = await db.getFirstAsync(`SELECT * FROM ${this.table} WHERE ${col} = ?`, [id]);
        return result ? new this(result) : null;
    }

    static async filter(params) {
        /*
        Takes params in an object like {column: value, column2: value2} and filters the table. 
        Can pass null to get values that are null and 'not_null' to get any not null values. 
        - params (object): column/value pairs to find. 
        */
        const db = await openDB();
        const clauses = [];
        const vals = [];

        for (const [key, value] of Object.entries(params)) {
            if (value === null) {
                clauses.push(`${key} IS NULL`);
            } 
            else if (value === 'not_null') {
                clauses.push(`${key} IS NOT NULL`);
            } 
            else {
                clauses.push(`${key} = ?`);
                vals.push(value);
            }
        }

        const clause = clauses.join(' AND ');
        const sql = `SELECT * FROM ${this.table}${clause ? ` WHERE ${clause}` : ''}`;
        const results = await db.getAllAsync(sql, vals);
        return results?.map(r => new this(r)) ?? [];
    }


    static async search(term) {
        /*
        Accepts a string and searches a number of columns as configured in the model instance 
        (array of column names). Returns any rows where one of the columns includes the search term. 
        - term (string): search term columns must include
        */
        const db = await openDB();
        if (!this.searchCols) {
            console.warn('Cannot search this table');
            return [];
        }

        // Build WHERE clause
        const clauseStr = this.searchCols
            .map(col => `${col} LIKE ? COLLATE NOCASE`)
            .join(' OR ');

        // Build parameter list with wildcards for each search column
        const params = this.searchCols.map(() => `%${term}%`);

        const sql = `SELECT * FROM ${this.table} WHERE ${clauseStr}`;
        const results = await db.getAllAsync(sql, params);

        return results?.map(r => new this(r)) ?? [];
    }

    static async delete(id, col = 'id') {
        /*
        Function that deletes values where an provided value is matched in a given column. Deletion
        may affect other tables if relationships are defined
        ( [{name: table_name, onCol: related_column, onDelete: protect/cascade/nullify/nothing}]).
        Thee be warned, if the column is not a primary key, it will delete every instance with the provided value. 
        - id: value to delete
        - col (string, optional): column to find value in (default id)
        */
        const db = await openDB();
        //if protected values exist in another table, throw an error 
        const protect = this.relationships.filter(r => r.onDelete =='protect');
        if(protect.length > 0){
            for (const table of protect){
                const conflicts = await db.getFirstAsync(`SELECT ${table.relCol} FROM ${table.name} WHERE ${table.relCol} = ?`, [id])
                if(conflicts) throw new Error(`Cannot delete model instance ${id} from table ${this.table} as it has protected relationships to table ${table.name}.`)
            }
        }
        //if cascade, delete any value in another table that has this value in the defined column
        const cascade = this.relationships.filter(r => r.onDelete =='cascade')
        if(cascade.length > 0){
            for(const table of cascade){
                await db.runAsync(`DELETE FROM ${table.name} WHERE ${table.relCol} = ?`, [id])
            }
        }
        //if set null, set the foreign key value as null
        const setNull = this.relationships.filter(r => r.onDelete =='nullify')
        if(setNull.length > 0){
            for(const table of setNull){
                await db.runAsync(`UPDATE ${table.name}  SET ${table.relCol}=NULL WHERE ${table.relCol} = ?`, [id])
            }
        }
        await db.runAsync(`DELETE FROM ${this.table} WHERE ${col} = ?`, [id]);
    }

    //drops the model table from the database. Will be recreated on migration
    static async drop() {
        const db = await openDB();
        await db.runAsync(`DROP TABLE IF EXISTS ${this.table}`);
    }

    static async migrate() {
        /*
        builds this table in the database. If data exists, it will be preserved (ideally), even if 
        columns are added and removed. Uses the fields attribute in the model to construct the table
        */
        const fields = this.fields
        const db = await openDB();
        const colNames = Object.keys(fields);
        
        // Validate column names to prevent injection
        colNames.forEach(col => {
            if (!/^[a-zA-Z0-9_]+$/.test(col)) throw new Error(`Invalid column name: ${col}`);
        });

        // Check if table exists
        const exists = await db.getFirstAsync(
            `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
            [this.table]
        );

        // If table exists, rename it temporarily so that data can be transferred
        if (exists) {
            await db.runAsync(`DROP TABLE IF EXISTS ${this.table}__old`);
            await db.runAsync(`ALTER TABLE ${this.table} RENAME TO ${this.table}__old`);
        }

        let primaryKeyCol = null
        // Build CREATE TABLE query
        let colsArray = colNames.map(col => {
            //set as primary if specified
            const primaryValue = this.fields[col]?.primary;
            //confirm multiple pk cols are not provided
            if(primaryValue && primaryKeyCol) throw new Error('Cannot have multiple primary key columns.');
            //note the column
            if(primaryValue && !primaryKeyCol) primaryKeyCol = col;
            const primaryClause = primaryValue == true ? ' PRIMARY KEY ' : '';
            //set not null if specified
            const allowNullValue = this.fields[col]?.allow_null;
            const allowNullClause = allowNullValue  == true ? '' : ' NOT NULL ';
            //set default if provided
            const defaultValue = this.fields[col]?.default;
            const defaultClause = defaultValue !== undefined ? ` DEFAULT ${JSON.stringify(defaultValue)}` : '';
            return `${col} ${this.fields[col].type.toUpperCase()}${primaryClause}${allowNullClause}${defaultClause}`
        });

        //if no primary key is provided automatically insert an autoincrement column
        if(!primaryKeyCol) colsArray.push('id INTEGER PRIMARY KEY AUTOINCREMENT');
        const colsStatement = colsArray.join(', ');
        const rels = Object.keys(fields).map(col => {
            const rel = this.fields[col]?.relationship;
            if (rel?.table && rel?.column) {
                return `FOREIGN KEY (${col}) REFERENCES ${rel.table}(${rel.column})`;
            }
            return null;
        }).filter(Boolean);

        //create relations and rules clauses
        const relsClause = rels.length > 0 ? `, ${rels.join(', ')}` : '';
        const rulesClause = this?.rules?.map((r) => {
            if(r.rule == 'unique') return `, UNIQUE (${r.col1}, ${r.col2})`
        }) ?? '';
        const createQuery = `CREATE TABLE ${this.table} (${colsStatement}${relsClause}${rulesClause})`;
        await db.runAsync(createQuery);

        // If old table existed, copy shared columns and drop it
        if (exists) {
            const oldCols = await db.getAllAsync(`PRAGMA table_info(${this.table}__old)`);
            const existingCols = oldCols.map(col => col.name).filter(name => colNames.includes(name));

            const colList = existingCols.join(', ');
            const copyQuery = `INSERT INTO ${this.table} (${colList}) SELECT ${colList} FROM ${this.table}__old`;
            await db.runAsync(copyQuery);

            await db.runAsync(`DROP TABLE IF EXISTS ${this.table}__old`);
        }
    }
    //?
    constructor(data) {
        Object.assign(this, data);
    }

    async serialize() {
        /*
        function that converts model instance to an object. If specified in relationships in the model, 
        it will also pull related instances (either as an object or array of objects)
        */
        const obj = { ...this };
        const toFetch = this.constructor.relationships?.filter(r => r.fetch) ?? [];

        //if related values should be fetched, recursively call serialize
        for (const rel of toFetch) {
            const related = await rel.model.filter({ [rel.relCol]: obj[rel.thisCol] });
            const serializedRelated = await Promise.all(related.map(r => r.serialize()));

            if (rel.many === false) {
                obj[rel.field] = serializedRelated[0] ?? null;  // null if none found
            } else {
                obj[rel.field] = serializedRelated;  // empty array if none found
            }
        }
        return obj;
    }

    static async save(data, id=null, col = 'id') {
        /*
        Save an object to the database. If primary key value already exists, will automatically
        update that record. 
        - data (object): data to save
        - id (optional): id value to save over
        - col (string, optional): column to find id in 
        */
        const db = await openDB();

        const cols = Object.keys(data);
        const vals = Object.values(data);
        let exists = null;

        if(id){
            exists = await db.getFirstAsync(
                `SELECT ${col} FROM ${this.table} WHERE ${col} = ?`,
                [id]
            );
        }

        if (exists) {
            const setClause = cols.map(c => `${c} = ?`).join(', ');
            await db.runAsync(
                `UPDATE ${this.table} SET ${setClause} WHERE ${col} = ?`,
                [...vals, id]
            );
            return id;
        } 
        else {
            const columns = cols.join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            const result = await db.runAsync(
                `INSERT OR REPLACE INTO ${this.table} (${columns}) VALUES (${placeholders})`,
                vals
            );
            return result.lastInsertRowid ?? (await db.getFirstAsync(`SELECT last_insert_rowid() AS id`)).id;
        }
    }
}