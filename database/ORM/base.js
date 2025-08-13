import openDB from '../dbManager';


export default class BaseModel {
    static table;
    
    static async all() {
        const db = await openDB();
        const results = await db.getAllAsync(`SELECT * FROM ${this.table}`);
        return results.map(r => new this(r));
    }

    static async find(id, col = 'id') {
        const db = await openDB();
        const result = await db.getFirstAsync(`SELECT * FROM ${this.table} WHERE ${col} = ?`, [id]);
        return result ? new this(result) : null;
    }

    static async filter(params) {
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
        //relationships = [{name: table_name, onCol: related_column, onDelete: protect/cascade/nullify}]
        const db = await openDB();
        const protect = this.relationships.filter(r => r.onDelete =='protect');
        if(protect.length > 0){
            for (const table of protect){
                const conflicts = await db.getFirstAsync(`SELECT ${table.relCol} FROM ${table.name} WHERE ${table.relCol} = ?`, [id])
                if(conflicts) throw new Error(`Cannot delete model instance ${id} from table ${this.table} as it has protected relationships to table ${table.name}.`)
            }
        }
        const cascade = this.relationships.filter(r => r.onDelete =='cascade')
        if(cascade.length > 0){
            for(const table of cascade){
                await db.runAsync(`DELETE FROM ${table.name} WHERE ${table.relCol} = ?`, [id])
            }
        }
        const setNull = this.relationships.filter(r => r.onDelete =='nullify')
        if(setNull.length > 0){
            for(const table of setNull){
                await db.runAsync(`UPDATE ${table.name}  SET ${table.relCol}=NULL WHERE ${table.relCol} = ?`, [id])
            }
        }
        await db.runAsync(`DELETE FROM ${this.table} WHERE ${col} = ?`, [id]);
    }

    static async drop() {
        const db = await openDB();
        await db.runAsync(`DROP TABLE IF EXISTS ${this.table}`);
    }

    static async migrate() {
        //map {name: type: TYPE, DEFAULT: null, RELATIONSHIP: {table: table_name, column: column_name} }
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

        // If table exists, rename it temporarily
        if (exists) {
            await db.runAsync(`DROP TABLE IF EXISTS ${this.table}__old`);
            await db.runAsync(`ALTER TABLE ${this.table} RENAME TO ${this.table}__old`);
        }

        let primaryKeyCol = null
        // Build CREATE TABLE query
        let colsArray = colNames.map(col => {
            //set as parimary if specified
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

    constructor(data) {
        Object.assign(this, data);
    }

    async serialize() {
        const obj = { ...this };
        const toFetch = this.constructor.relationships?.filter(r => r.fetch) ?? [];

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