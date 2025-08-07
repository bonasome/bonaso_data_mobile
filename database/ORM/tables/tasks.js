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
        project: {type: 'integer', relationship: {table: 'projects', onCol: 'id'}},
        organization: {type: 'integer', relationship: {table: 'organizations', onCol: 'id'}},
        indicator: {type: 'integer', relationship: {table: 'indicators', onCol: 'id'}}
    }
    static relationships = [
        {model: Organization, name: 'organizations', onCol: 'id', onDelete: 'cascade', fetch: true}, 
        {model: Project, name: 'projects', onCol: 'id', onDelete: 'cascade', fetch: true}, 
        {model: Indicator, name: 'indicators', onCol: 'id', onDelete: 'cascade', fetch: true}, 
    ]
}