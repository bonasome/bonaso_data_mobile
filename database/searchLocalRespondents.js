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
        results.forEach(row => interactions.push(row));
        return interactions;
    } catch (err) {
        console.error("Failed to fetch interactions:", err);
        return [];
    }
}