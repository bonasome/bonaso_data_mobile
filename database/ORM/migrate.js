import { Indicator, IndicatorPrerequisite, IndicatorSubcategory } from "./tables/indicators";
import { Interaction, InteractionSubcategory } from "./tables/interactions";
import { AgeRange, DisabilityType, District, KPType, Sex, SyncRecord } from './tables/meta';
import { DisabilityStatus, KPStatus, Respondent, RespondentLink } from './tables/respondents';
import { Organization, Project, Task } from "./tables/tasks";

export const models = [
    Indicator,IndicatorPrerequisite, IndicatorSubcategory, Respondent, RespondentLink, KPStatus, DisabilityStatus,
    Project, Organization, Task, Interaction, InteractionSubcategory,District, AgeRange, Sex, 
    KPType, DisabilityType, SyncRecord
]

export async function migrate(models) {
    for (const model of models) {
        try {
            await model.migrate(model.fields);
            console.log(`Migrated ${model.table}`);
        } 
        catch (err) {
            console.error(`Failed to migrate ${model.table}:`, err.message);
        }
    }
    return true;
}
