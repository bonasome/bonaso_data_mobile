import BaseModel from "../base";

export class SyncRecord extends BaseModel {
    static table = 'sync_record';
    static fields = {
        table_updated: {type: 'text',  primary: true},
        updated_at: {type: 'text', allow_null: true}
    }

    static async updatedAt(value){
        if(!value) return null;
        const record = await SyncRecord.find(value, 'table_updated');
        if(!record) await SyncRecord.save({table_updated: value, updated_at: null });
        return record.updated_at;
    }
}

export class District extends BaseModel {
    static table = 'districts';
    static fields = {
        value: {type: 'text', primary: true},
        label: {type: 'text'},
    }
    static async getLabel(value){
        if(!value) return null;
        const district = await District.find(value, 'value');
        return district.label;
    }
}

export class KPType extends BaseModel {
    static table = 'kp_types';
    static fields = {
        value: {type: 'text', primary: true},
        label: {type: 'text'},
    }
    static async getLabel(value){
        if(!value) return null;
        const kp = await KPType.find(value, 'value');
        return kp.label;
    }
}

export class DisabilityType extends BaseModel {
    static table = 'disability_types';
    static fields = {
        value: {type: 'text', primary: true},
        label: {type: 'text'},
    }
    static async getLabel(value){
        if(!value) return null;
        const dis = await DisabilityType.find(value, 'value');
        return dis.label;
    }
}

export class Sex extends BaseModel {
    static table = 'sexs';
    static fields = {
        value: {type: 'text', primary: true},
        label: {type: 'text'},
    }
    static async getLabel(value){
        if(!value) return null;
        const sex = await Sex.find(value, 'value');
        return sex.label;
    }
}

export class AgeRange extends BaseModel {
    static table = 'age_ranges';
    static fields = {
        value: {type: 'text', primary: true},
        label: {type: 'text'},
    }
    static async getLabel(value){
        if(!value) return null;
        const ar = await AgeRange.find(value, 'value');
        return ar.label;
    }
}
