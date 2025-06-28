import { querySelector } from "../queryWriter";

// Helper to get associated statuses
async function getStatusNames(table, respondentId) {
    const results = await querySelector(
        `SELECT name FROM ${table} WHERE respondent = ?`,
        [respondentId]
    );
    return results.map(row => row.name);
}

export default async function organizeRespondentPayload(respondentId) {
    try {
        const result = await querySelector(
        `SELECT * FROM respondents WHERE id = ?`,
        [respondentId]
        );

        if (!result.length) throw new Error("Respondent not found");

        const respondent = result[0];
        // Prepare respondent data for RespondentSerializer (don't include id, since it was local only)
        const respondentData = {
            uuid: respondent.uuid,
            id_no: respondent.id_no,
            is_anonymous: Boolean(respondent.is_anonymous),
            first_name: respondent.first_name,
            last_name: respondent.last_name,
            sex: respondent.sex,
            ward: respondent.ward,
            village: respondent.village,
            district: respondent.district,
            citizenship: respondent.citizenship,
            comments: "", // optional: no local field?
            email: respondent.email,
            phone_number: respondent.contact_no,
            dob: respondent.dob, // should be ISO format already
            age_range: respondent.age_range,
            updated_by: null,
            local_id: respondentId
        };

        // Prepare sensitive info data for SensitiveInfoSerializer
        const sensitiveInfoData = {
            is_pregnant: Boolean(respondent.new_pregnant),
            hiv_positive: Boolean(respondent.new_hiv_positive),
            term_began: null,
            term_ended: null,
            date_positive: null,
            kp_status_names: await getStatusNames("respondent_kp_status", respondent.id) || [],
            disability_status_names: await getStatusNames("respondent_disability_status", respondent.id) || [],
        };
        return {
            respondentData,
            sensitiveInfoData,
        };
    } catch (err) {
        console.error("Error building respondent payload:", err);
        throw err;
    }
}