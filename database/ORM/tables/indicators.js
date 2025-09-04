import BaseModel from "../base";

export class RequiredAttribute extends BaseModel {
    /*
    Stores an indicator's attributes (m2o through)
    */
    static table = 'required_attributes';

    static fields = {
        indicator: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        name: {type: 'text'},
    }
    static relationships = [];
}

export class IndicatorSubcategory extends BaseModel {
    /*
    Stores an indicator's subcategories (m2o through)
    */
    static table = 'indicator_subcategories';
    
    static fields = {
        indicator: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        id: {type: 'integer', primary: true},
        name: {type: 'text'},
    }
    static relationships = []
}

export class IndicatorPrerequisite extends BaseModel {
    /*
    Stores an indicator's prerequisite indicator's (m2o through)
    */
    static table = 'indicator_prerequisites';

    static fields = {
        dependent_id: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        prerequisite_id: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
    }
    static rules = [
        {rule: 'unique', col1: 'dependent_id', col2: 'prerequisite_id'}
    ]
    //on serialize, get deails about the prerequisite indicator
    static get relationships() {
        const { Indicator } = require('./indicators'); // or dynamic import
        return [
             {model: Indicator, field: 'indicator', name: 'indicator', relCol: 'id', thisCol: 'prerequisite_id', onDelete: 'cascade', fetch: true, many: false}, 
        ];
  }
}

export class Indicator extends BaseModel {
    /*
    Stores information about an indicator. On serialize, will also fetch subcateogry data, prerequisite data,
    and information about required attributes. 
    */
    static table = 'indicators';
    
    static fields = {
        id: {type: 'integer', primary: true},
        code: {type: 'text'},
        name: {type: 'text'},
        description: {type: 'text'},
        require_numeric: {type: 'boolean'},
        match_subcategories_to: {type: 'integer', allow_null: true},
        allow_repeat: {type: 'integer', default: 0, allow_null: true}
    }

    static relationships = [
        {model: IndicatorPrerequisite, field: 'prerequisites', name: 'indicator_prerequisites', relCol: 'dependent_id', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true}, 
        {model: IndicatorSubcategory, field: 'subcategories', name: 'indicator_subcategories', relCol: 'indicator', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true},
        {model: RequiredAttribute, field: 'required_attributes', name: 'required_attributes', relCol: 'indicator', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true}, 
    ]

    //extends base serializer, since some indicators may share subcategories if matched, fetch them
    async serialize() {
        let baseSerialized = await super.serialize();
        if(this.match_subcategories_to){
            const subcats = await IndicatorSubcategory.filter({indicator: this.match_subcategories_to});
            const subcatsArray = subcats.map(cat => ({id: cat.id, name: cat.name}));
            baseSerialized.subcategories = subcatsArray;
        }
        return baseSerialized;
    }
}


