import { querySelector } from "./queryWriter"; // assumes your SELECT helper

export async function searchLocalRespondents(searchValue) {
    if (!searchValue || searchValue.trim() === "") {
        return [];
    }

    const searchPattern = `%${searchValue.trim()}%`;

    try {
        const results = await querySelector(
        `SELECT * FROM respondents 
        WHERE 
            first_name LIKE ? COLLATE NOCASE OR
            last_name LIKE ? COLLATE NOCASE OR
            village LIKE ? COLLATE NOCASE OR
            id_no LIKE ? COLLATE NOCASE`,
        [searchPattern, searchPattern, searchPattern, searchPattern]
        );

        const respondents = [];
        results.forEach(row => respondents.push(row));
        return respondents;

    } catch (err) {
        console.error("Search query failed:", err);
        return [];
    }
}

export async function getInteractionsForRespondent(respondentId) {
    try {
        const results = await querySelector(
            `SELECT * FROM interactions WHERE respondent_local = ?`,
            [respondentId]
        );

        const interactions = [];
        for (const row of results) {
            const interaction = { ...row };

            // Fetch subcategories for this interaction
            const subcatResults = await querySelector(
                `SELECT * FROM interaction_subcategories WHERE interaction = ?`,
                [interaction.id]
            );
            interaction.subcategories = subcatResults;

            // Fetch the indicator for this interaction's task
            const taskRows = await querySelector(
                `SELECT indicator FROM tasks WHERE id = ?`,
                [interaction.task]
            );

            if (taskRows.length > 0 && taskRows[0].indicator != null) {
                const indicatorId = taskRows[0].indicator;

                const indicatorRows = await querySelector(
                    `SELECT * FROM indicators WHERE id = ?`,
                    [indicatorId]
                );

                if (indicatorRows.length > 0) {
                    interaction.task_detail = {
                        indicator: indicatorRows[0]
                    };
                }
            }

            interactions.push(interaction);
        }

        return interactions;
    } catch (err) {
        console.error("Failed to fetch interactions:", err);
        return [];
    }
}