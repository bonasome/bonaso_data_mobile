import BaseModel from "../base";

export class IndicatorSubcategory extends BaseModel {
    static table = 'indicator_subcategories';
    
    static fields = {
        indicator: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        id: {type: 'integer', primary: true},
        name: {type: 'text'},
    }
}

export class IndicatorPrerequisite extends BaseModel {
    static table = 'indicator_prerequisites';

    static fields = {
        dependent_id: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        prerequisite_id: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
    }
    static rules = [
        {rule: 'unique', col1: 'dependent_id', col2: 'prerequisite_id'}
    ]
    static get relationships() {
        const { Indicator } = require('./indicators'); // or dynamic import
        return [
             {model: Indicator, field: 'indicator', name: 'indicator', relCol: 'id', thisCol: 'prerequisite_id', onDelete: 'cascade', fetch: true, many: false}, 
        ];
  }
}

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
        {model: IndicatorPrerequisite, field: 'prerequisites', name: 'indicator_prerequisites', relCol: 'dependent_id', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true}, 
        {model: IndicatorSubcategory, field: 'subcategories', name: 'indicator_subcategories', relCol: 'indicator', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true}, 
    ]
}


