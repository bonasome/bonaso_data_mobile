import { queryWriter } from "@/database/queryWriter";

export default async function saveInteraction(formData, wasLocal=false) {
    try {
        const doi = formData.doi instanceof Date
            ? formData.doi.toISOString().split("T")[0]
            : formData.doi;

        const respondent = formData.respondent;

        const insertQuery = wasLocal ?  
        `INSERT INTO interactions ( date, respondent_local, numeric_component, task, synced) VALUES 
        (?, ?, ?, ?, ?)`
        :
            `INSERT INTO interactions (
                date, respondent_server, numeric_component, task, synced
            ) VALUES (?, ?, ?, ?, ?)`
        ;

        for (const task of formData.tasks) {
            const insertParams = [
                doi,
                respondent,
                task.numeric_component || null,
                task.task, // or task.id depending on your structure
                0
            ];

            const result = await queryWriter(insertQuery, insertParams);
            console.log(result)
            const interactionId = result.lastInsertRowId;

            if (task.subcategories_data && task.subcategories_data.length > 0) {
                for (const subcat of task.subcategories_data) {
                    await queryWriter(
                        `INSERT INTO interaction_subcategories (interaction, subcategory, linked_id, numeric_component, synced) VALUES (?, ?, ?, ?, ?)`,
                        [interactionId, subcat.name, subcat.linked_id, subcat?.numeric_component || null,  0]
                    );
                }
            }
        }

        console.log("Interaction saved locally.");
        return { success: true };
    } 
    catch (err) {
        console.error("Failed to save interaction:", err);
        return { success: false, error: err };
    }
}