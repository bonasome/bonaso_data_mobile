# BONASO Data Portal Mobile: ORM Overview:

---

The BONASO Data Portal Mobile application includes a lightweight custom ORM to simplify working with the local SQLite database.

---

## Models
The base ORM model can be extended by creating new models. These models take the following props:
    - table: the name of the table
    - fields: what columns this table should have, use the following object structure:
        ```
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
    - relationships: An array of related models. See the relationships section below.
    
Depending on the model, it may be worthwhile to also extend the default save method. Respondents/Interactions also have an upload method. 

**NOTE**: If you add a new model, make sure you add it to the *models* array in **[database/ORM/migrate.js]**!

For full example of field construction, view [database/ORM/tables/respondents.js]

---

## Methods
The ORM has the following methods:
**Class**
    - `.all()`: fetches all records from a table
    - `.find(id, column?='id')`: fetches one record from a table given an ID (and optionally a column to look in)
    - `.filter(conditions)`: collects records where conditions are met (using an object of {column: value})
    - `.search(term)`: assuming that the model has specified search columns, searches those columns for a specific string
    - `.delete(id, column?='id')`: deletes a specific record from a table given an ID (and optionally a column to look in). See more about delete relationships below.
    - `.drop()`: drops the entire table from the database
    - `.migrate()`: migrates the table as defined by the model, automatically updating columns/constraints as needed
    - `.save(id, column?='id')`: Saves an object given a dataset. If provided with an ID (and optionally a column to look in), it will try to find that ID and update it.
**Instance**
    - `.serialize()` (instance): Converts a given instance into an object.
     

---

## Relationships
Relationships can be established between two tables. During class construction, a column can be assigned as a primary key. 

The following object structure is used to define relationships in more detail.
```
{
    model: The model class that this model is related to,
    field: What to call the related field during serialization,
    name: The name of the related table,
    relCol: The column in the other table that holds the foreign key,
    thisCol: The column in this table that relCol is referencing,
    onDelete:What to do if that record is deleted (cascade: delete this record, protect: prevent deletion, nullify: set as null, nothing: do nothing),
    fetch: Also collect related data on serialization,
    many: when fetching, collect the associated data as an array of objects or as a single object,
}
```

Relationships will take an array of these objects. 
---

For full example of relationships, view [database/ORM/tables/respondents.js]

## Migrations
The ORM will currently try to migrate all tables when app loads (in [app/authorized/(tabs)/index.tsx]) by running the function in [database/ORM/migrate.js].

Tables are auto-created/altered, not dropped.

Devs can force-reset by using .drop() then .migrate().

