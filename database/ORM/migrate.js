import { Indicator, IndicatorPrerequisite, IndicatorSubcategory, RequiredAttribute } from "./tables/indicators";
import { Interaction, InteractionSubcategory } from "./tables/interactions";
import { AgeRange, DisabilityType, District, KPType, Sex, SpecialRespondentAttribute, SyncRecord } from './tables/meta';
import { DisabilityStatus, KPStatus, Pregnancy, Respondent, RespondentLink, SpecialAttribute } from './tables/respondents';
import { Organization, Project, Task } from "./tables/tasks";

//if you create a new model, make sure to add it the models list. otherwise it won't exist in the db
export const models = [
    Indicator,IndicatorPrerequisite, IndicatorSubcategory, Respondent, RespondentLink, KPStatus, DisabilityStatus,
    Project, Organization, Task, Interaction, InteractionSubcategory,District, AgeRange, Sex, Pregnancy,
    KPType, DisabilityType, SyncRecord, RequiredAttribute, SpecialAttribute, SpecialRespondentAttribute
]

export async function migrate(models) {
    /*
    Helper function that builds all tables on initialization of the app. 
    */
    for (const model of models) {
        try {
            await model.migrate(model.fields); //run migrate function
            console.log(`Migrated ${model.table}`);
        } 
        catch (err) {
            console.error(`Failed to migrate ${model.table}:`, err.message);
        }
    }
    return true;
}
