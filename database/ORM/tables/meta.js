import BaseModel from "../base";
export class District extends BaseModel {
    static table = 'districts';
    static fields = {
        value: {type: 'text'},
        label: {type: 'text'},
    }
}

export class KPType extends BaseModel {
    static table = 'kp_types';
    static fields = {
        value: {type: 'text'},
        label: {type: 'text'},
    }
}

export class DisabilityType extends BaseModel {
    static table = 'disability_types';
    static fields = {
        value: {type: 'text'},
        label: {type: 'text'},
    }
}

export class Sex extends BaseModel {
    static table = 'sexs';
    static fields = {
        value: {type: 'text'},
        label: {type: 'text'},
    }
}

export class AgeRange extends BaseModel {
    static table = 'age_ranges';
    static fields = {
        value: {type: 'text'},
        label: {type: 'text'},
    }
}
