import BaseModel from "../base";
import { Indicator } from "./indicators";

export class Project extends BaseModel {
    static table='projects';

    static fields = {
        id: {type: 'integer', primary: true},
        name: {type: 'text'},
        description: {type: 'text', allow_null: true},
        start: {type: 'text'},
        end: {type: 'text'},
    }
}

export class Organization extends BaseModel {
    static table = 'organizations';

    static fields = {
        id: {type: 'integer', primary: true},
        name: {type: 'text'},
    }
}


export class Task extends BaseModel {
    static table = 'tasks';

    static fields = {
        id: {type: 'integer', primary: true},
        display_name: {type: 'text'},
        project: {type: 'integer', relationship: {table: 'projects', onCol: 'id'}},
        organization: {type: 'integer', relationship: {table: 'organizations', onCol: 'id'}},
        indicator: {type: 'integer', relationship: {table: 'indicators', onCol: 'id'}}
    }
    static relationships = [
        {model: Organization, field: 'organization', name: 'organizations', thisCol: 'organization', relCol: 'id', onDelete: 'cascade', fetch: true, many: false}, 
        {model: Project, field: 'project', name: 'projects', thisCol: 'project', relCol: 'id', onDelete: 'cascade', fetch: true, many: false}, 
        {model: Indicator, field: 'indicator', name: 'indicators', thisCol: 'indicator', relCol: 'id', onDelete: 'cascade', fetch: true, many: false}, 
    ]
}