export default class BaseModel {
    static table;

    static async all() {
        const results = await db.getAllAsync(`SELECT * FROM ${this.table}`);
        return results.map(r => new this(r));
    }

    static async find(id, col = 'id') {
        const result = await db.getFirstAsync(`SELECT * FROM ${this.table} WHERE ${col} = ?`, [id]);
        return result ? new this(result) : null;
    }

    static async filter(params) {
        const vals = Object.values(params);
        const clause = Object.keys(params).map(p => `${p} = ?`).join(' AND ');
        const results = await db.getAllAsync(`SELECT * FROM ${this.table} WHERE ${clause}`, vals);
        return results.map(r => new this(r));
    }

    static async delete(id, col = 'id', relationships=[]) {
        //relationships = [{name: table_name, onCol: related_column, onDelete: protect/cascade/nullify}]
        const protect = relationships.filter(r => r.onDelete =='protect');
        if(protect.length > 0){
            for (const table of protect){
                const conflicts = await db.getFirstAsync(`SELECT ${table.onCol} FROM ${table.name} WHERE ${table.onCol} = ?`, [id])
                if(conflicts) throw new Error(`Cannot delete model instance ${id} as it has protected relationships to table ${table.name}.`)
            }
        }
        const cascade = relationships.filter(r => r.onDelete =='cascade')
        if(cascade.length > 0){
            for(const table of cascade){
                await db.runAsync(`DELETE FROM ${table.name} WHERE ${table.onCol} = ?`, [id])
            }
        }
        const setNull = relationships.filter(r => r.onDelete =='nullify')
        if(setNull.length > 0){
            for(const table of setNull){
                await db.runAsync(`UPDATE ${table.name}  SET ${table.onCol}=NULL WHERE ${table.onCol} = ?`, [id])
            }
        }
        await db.runAsync(`DELETE FROM ${this.table} WHERE ${col} = ?`, [id]);
    }

    static async drop() {
        await db.runAsync(`DROP TABLE IF EXISTS ${this.table}`);
    }

    static async migrate(map) {
        //map {name: type: TYPE, DEFAULT: null, RELATIONSHIP: {table: table_name, column: column_name} }
        const colNames = Object.keys(map);
        
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
            await db.runAsync(`ALTER TABLE ${this.table} RENAME TO ${this.table}__old`);
        }

        let primaryKeyCol = null
        // Build CREATE TABLE query
        let colsArray = colNames.map(col => {
            //set as parimary if specified
            const primaryValue = map[col]?.primary;
            //confirm multiple pk cols are not provided
            if(primaryValue && primaryKeyCol) throw new Error('Cannot have multiple primary key columns.');
            //note the column
            if(primaryValue && !primaryKeyCol) primaryKeyCol = col;
            const primaryClause = primaryValue == true ? ' PRIMARY KEY ' : '';
            //set not null if specified
            const allowNullValue = map[col]?.allow_null;
            const allowNullClause = allowNullValue  == true ? '' : 'NOT NULL';
            //set default if provided
            const defaultValue = map[col]?.default;
            const defaultClause = defaultValue !== undefined ? ` DEFAULT ${JSON.stringify(defaultValue)}` : '';
            return `${col} ${map[col].type.toUpperCase()}${primaryClause}${allowNullClause}${defaultClause}`
        });
        //if no primary key is provided automatically insert an autoincrement column
        if(!primaryKeyCol) colsArray.push(', id INTEGER PRIMARY KEY AUTOINCREMENT');
        const colsStatement = colsArray.join(', ');
        const rels = Object.keys(map).map(col => {
            const rel = map[col]?.relationship;
            if (rel?.table && rel?.column) {
                return `FOREIGN KEY (${col}) REFERENCES ${rel.table}(${rel.column})`;
            }
            return null;
        }).filter(Boolean);

        const relsClause = rels.length ? `, ${rels.join(', ')}` : '';

        const createQuery = `CREATE TABLE ${this.table} (${colsStatement}${relsClause})`;
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
            const related = await rel.model.filter({ [rel.onCol]: obj.id });
            obj[rel.name] = await Promise.all(related.map(r => r.serialize()));
        }

        return obj;
    }

    async save(map, id, col = 'id') {
        const exists = await db.getFirstAsync(
            `SELECT ${col} FROM ${this.constructor.table} WHERE ${col} = ?`,
            [id]
        );

        const cols = Object.keys(map);
        const vals = Object.values(map);

        if (exists) {
            const setClause = cols.map(c => `${c} = ?`).join(', ');
            await db.runAsync(
                `UPDATE ${this.constructor.table} SET ${setClause} WHERE ${col} = ?`,
                [...vals, id]
            );
        } 
        else {
            const columns = cols.join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            await db.runAsync(
                `INSERT INTO ${this.constructor.table} (${columns}) VALUES (${placeholders})`,
                vals
            );
        }

        return true;
    }
}