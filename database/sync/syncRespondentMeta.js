import fetchWithAuth from "@/services/fetchWithAuth";
import { queryWriter } from "../queryWriter";

export default async function syncRespondentMeta() {
    try {
        const response = await fetchWithAuth('/api/record/respondents/meta/');
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        const data = await response.json();

        const pairs = [
            { values: data.districts, labels: data.district_labels, table: "districts" },
            { values: data.sexs, labels: data.sex_labels, table: "sex" },
            { values: data.age_ranges, labels: data.age_range_labels, table: "age_range" },
            { values: data.kp_types, labels: data.kp_type_labels, table: "kp_types" },
            { values: data.disability_types, labels: data.disability_type_labels, table: "disability_types" },
        ];

        for (const { values, labels, table } of pairs) {
            for (let i = 0; i < values.length; i++) {
                await queryWriter(
                    `INSERT OR REPLACE INTO ${table} (value, label) VALUES (?, ?)`,
                    [values[i], labels[i]]
                );
            }
        }

        console.log("Respondent metadata synced.");
    } 
    catch (err) {
        console.error("Failed to sync respondent meta:", err);
    }
}