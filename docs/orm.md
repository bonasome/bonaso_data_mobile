# BONASO Data Portal Mobile: ORM Overview:

---

The BONASO Data Portal Mobile application includes a lightweight custom ORM to simplify working with the local SQLite database.

---

## Models
The base ORM model can be extended by creating new models. These models take the following props:
- table: the name of the table
- fields: what columns this table should have, use the following object structure:
```js
fields: {
    columnName: {
        type: data type (lower case is fine),
        allow_null: should the column allow null values,
        relationship: { table: the related table name, column: the related table column},
        default: the default value
    }
}
```
- searchCols: An array of column names to use when searching
- relationships: An array of related models (should always at least be an empty array). See the relationships section below.
    
Depending on the model, it may be worthwhile to also extend the default save method. Respondents/Interactions also have an upload method for uploading data from the tables to the server. 

**NOTE**: If you add a new model, make sure you add it to the [**models**](/database/ORM/migrate.js) array!

For full example of field construction, click [here](/database/ORM/tables/respondents.js).

---

## Methods
The ORM has the following methods:
**Class**
- `.all()`: Fetches all records from a table.
- `.find(id, column?='id')`: Fetches one record from a table given an ID (and optionally a column to look in).
- `.filter(conditions)`: Collects records where conditions are met (using an object of {column: value}).
- `.search(term)`: Assuming that the model has specified search columns, searches those columns for a specific string.
- `.delete(id, column?='id')`: Deletes a specific record from a table given an ID (and optionally a column to look in). See more about delete relationships below. Can delete more than one record.
- `.drop()`: Drops the entire table from the database.
- `.migrate()`: Migrates the table as defined by the model, automatically updating columns/constraints as needed.
- `.save(id, column?='id')`: Saves an object given a dataset. If provided with an ID (and optionally a column to look in), it will try to find that ID and update it. If it finds an existing ID it will overwrite it. 
**Instance**
- `.serialize()` (instance): Converts a given instance into an object.
     
---

## Relationships
Relationships can be established between two tables. During class construction, a column can be assigned as a primary key. 

The following object structure is used to define relationships in more detail.
```js
static relationships = [{
    model: MyModel //class that this model is related to,
    field: 'my_model' //What to call the related field during serialization,
    name: 'my_models' //The name of the related table,
    relCol: 'model' //The column in the other table that holds the foreign key,
    thisCol: 'id' //The column in this table that relCol is referencing,
    onDelete: 'cascade' //What to do if that record is deleted (cascade: delete this record, protect: prevent deletion, nullify: set as null, nothing: do nothing),
    fetch: true //Also collect related data on serialization,many: when fetching, collect the associated data as an array of objects or as a single object,
}]
```

Relationships will take an array of these objects. 
---

For full example of relationships, click [here](/database/ORM/tables/respondents.js)

## Migrations
The ORM will currently try to migrate all tables when app loads (see [index.tsx](/app/authorized/(tabs)/index.tsx)) by running the function [here](/database/ORM/migrate.js).

Tables are auto-created/altered, not dropped.

**Note**: Devs can force-reset by using .drop() then .migrate().

