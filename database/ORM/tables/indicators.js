import BaseModel from "../base";

export class Indicator extends BaseModel {
    static table = 'indicators';
    
    static fields = {
        id: {type: 'integer', primary: true},
        code: {type: 'text'},
        name: {type: 'text'},
        description: {type: 'text'},
        require_numeric: {type: 'boolean'}
    }

    static relationships = [
        {model: IndicatorPrerequisite, name: 'indicator_prerequisites', onCol: 'indicator', onDelete: 'cascade', fetch: true}, 
        {model: IndicatorSubcategory, name: 'indicator_subcategories', onCol: 'indicator', onDelete: 'cascade', fetch: true}, 
    ]
}

export class IndicatorSubcategory extends BaseModel {
    static table = 'indicator_subcategories';
    
    static fields = {
        indicator: {type: 'integer', relationship: {table: 'indicators', column: id}},
        server_id: {type: 'integer'},
        name: {type: 'text'},
    }
}

export class IndicatorPrerequisite extends BaseModel {
    static table = 'indicator_prerequisites';

    static fields = {
        dependent_id: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        prerequisite_id: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
    }
}
