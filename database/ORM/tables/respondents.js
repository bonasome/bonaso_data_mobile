import BaseModel from "../ORM/base";

export class Respondent extends BaseModel {
    static table = 'respondents';
    
    static fields = {
        is_anonymous: {type: 'INTEGER', default: 0},
        server_id: {type: 'integer', allow_null: true},
        uuid: {type: 'text'},
        id_no: {type: 'text', allow_null: true},
        first_name: {type: 'text', allow_null: true},
        last_name: {type: 'text', allow_null: true},
        dob: {type: 'text', allow_null: true},
        age_range: {type: 'text', allow_null: true},
        sex: {type: 'text'},
        plot_no: {type: 'text', allow_null: true},
        ward: {type: 'text', allow_null: true},
        village: {type: 'text'},
        district: {type: 'text'},
        citizenship: {type: 'text'},
        email: {type: 'text', allow_null: true},
        contact_no: {type: 'text', allow_null: true},
        created_at: {type: 'text', default: new Date().toISOString()},
        hiv_positive: {type: 'boolean', allow_null: true},
        date_positive: {type: 'text', allow_null: true},
        term_began: {type: 'text', allow_null: true},
        term_ended: {type: 'text', allow_null: true},
        synced: {type: 'boolean', default: 0}
    }

    static relationships = [
        {model: KPStatus, name: 'kp_status', onCol: 'respondent', onDelete: 'cascade', fetch: true}, 
        {model: DisabilityStatus, name: 'disability_status', onCol: 'respondent', onDelete: 'cascade', fetch: true}, 
        {name: 'interactions', onCol: 'respondent', onDelete: 'protect', fetch: false}
    ]
}

export class KPStatus extends BaseModel {
    static table = 'kp_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'id'}},
        synced: {type: 'boolean', default: 0}
    }
}
export class DisabilityStatus extends BaseModel {
    static table = 'disability_status';

    static fields = {
        name: {type: 'text'},
        respondent: {type: 'text', relationship: {table: 'respondents', column: 'id'}},
        synced: {type: 'boolean', default: 0}
    }
}

export class Interaction extends BaseModel {
    static table = 'interactions'

    static fields = {
        date: {type: 'text'},
        location: { type: 'text'},
        numeric_component: {type: 'integer', allow_null: true},
        task: {type: 'integer', relationship: {table: 'task', column: 'id'}},
        respondent_local: {type: 'integer', relationship: {table: 'respondent', column: 'id'}},
        respondent_server: {type: 'integer', relationship: {table: 'respondent', column: 'server_id'}, allow_null: true},
        synced: {type: 'boolean', default: 0}
    }
    static relationships = [
        {model: InteractionSubcategory, name: 'interaction_subcategory', onCol: 'interaction', onDelete: 'cascade', fetch: true}, 
    ]
}

export class InteractionSubcategory extends BaseModel {
    static table = 'interaction_subcategories';

    static fields = {
        interaction: {type: 'integer', relationship: {table: 'interactions', column: 'id'}},
        numeric_component: {type: 'integer', allow_null: true},
        subcategory: {type: 'integer', relationship: {table: 'indicator_subcategories', column: 'server_id'}},
        synced: {type: 'boolean', default: 0}, 
    }
}


