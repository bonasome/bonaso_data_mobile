import BaseModel from "../base";

export class LogicCondition extends BaseModel {
    /*
    Stores an indicator's attributes (m2o through)
    */
    static table = 'logic_conditions';

    static fields = {
        logic_group: { type: 'integer'},
        source_type: {type: 'text'},
        source_indicator: {type: 'integer', allow_null: true },
        value_option: { type: 'integer', allow_null: true},
        value_text: { type: 'text', allow_null: true},
        value_boolean: { type: 'integer', allow_null: true },

        respondent_field: { type: 'text', allow_null: true },
        operator: { type: 'text' },
        condition_type: { type: 'text', allow_null: true},
    }
    static get relationships() {
        const { Indicator, Option } = require('./indicators'); // or dynamic import
        return [];
    }
}

export class LogicGroup extends BaseModel {
    /*
    Stores an indicator's subcategories (m2o through)
    */
    static table = 'logic_groups';
    
    static fields = {
        indicator: {type: 'integer', relationship: {table: 'indicators', column: 'id'}},
        id: {type: 'integer', primary: true},
        group_operator: {type: 'text'},
    }
    static relationships = [
        {model: LogicCondition, field: 'conditions', name: 'logic_conditions', relCol: 'logic_group', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true}, 
    ]
}

export class Option extends BaseModel {
    /*
    Stores an indicator's prerequisite indicator's (m2o through)
    */
    static table = 'options';

    static fields = {
        id: { type: 'integer', primary: true },
        indicator: { type: 'integer', relationship: {table: 'indicators', column: 'id'} },
        name: { type: 'text' },
    }
    //on serialize, get deails about the prerequisite indicator
    static relationships = [];
}

export class Indicator extends BaseModel {
    /*
    Stores information about an indicator. On serialize, will also fetch subcateogry data, prerequisite data,
    and information about required attributes. 
    */
    static table = 'indicators';
    
    static fields = {
        id: {type: 'integer', primary: true},
        assessment: { type: 'integer', relationship: {table: 'assessments', column: 'id'}},
        name: {type: 'text'},
        description: {type: 'text', allow_null: true},
        match_options: {type: 'integer', allow_null: true},
        allow_none: {type: 'integer', allow_null: true},
        required: {type: 'integer', default: 0, allow_null: true},
        type: {type: 'text'},
        indicator_order: { type: 'integer'},
    }

    static relationships = [
        {model: Option, field: 'options', name: 'options', relCol: 'indicator', thisCol: 'id', onDelete: 'cascade', onDelete: 'cascade', fetch: true, many: true}, 
        {model: LogicGroup, field: 'logic', name: 'logic_groups', relCol: 'indicator', thisCol: 'id', onDelete: 'cascade', onDelete: 'cascade', fetch: true, many: false}, 
    ]

    //extends base serializer, since some indicators may share subcategories if matched, fetch them
    async serialize() {
        let baseSerialized = await super.serialize();
        if(this.match_options){
            const opts = await Option.filter({indicator: this.match_options});
            const optionsArray = opts.map(o => ({id: o.id, name: o.name}));
            baseSerialized.options = optionsArray;
        }
        return baseSerialized;
    }
}

export class Assessment extends BaseModel {
    static table = 'assessments';

    static fields = {
        id: { type: 'integer', primary: true},
        name: { type: 'text'},
        description: { type: 'text', allow_null: true}
    }

    static relationships = [
        { model: Indicator, field: 'indicators', name: 'indicators', relCol: 'assessment', thisCol: 'id', onDelete: 'cascade', fetch: true, many: true }
    ]

}

