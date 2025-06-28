import { queryWriter } from "@/database/queryWriter";
import uuid from 'react-native-uuid';
export default async function saveRespondent(formData) {
    try {
        const uuidVal = uuid.v4(); // optional if you're using a uuid field

        // Format date if needed
        const dob = formData.dob instanceof Date
        ? formData.dob.toISOString().split("T")[0]
        : formData.dob;

        // 1. Insert into `respondents` table
        const insertQuery = `
        INSERT OR REPLACE INTO respondents (
            is_anonymous, uuid, id_no, first_name, last_name,
            dob, age_range, sex, ward, village, district,
            citizenship, email, contact_no, created_by,
            new_hiv_positive, new_pregnant, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const insertParams = [
            formData.is_anonymous, // is_anonymous
            uuidVal, // uuid
            formData.id_no || null,
            formData.first_name || null,
            formData.last_name || null,
            dob || null,
            formData.age_range || null,
            formData.sex || null,
            formData.ward || null,
            formData.village || null,
            formData.district || null,
            formData.citizenship || null,
            formData.email || null,
            formData.phone_number || null,
            null, // created_by
            formData.hiv_positive, // new_hiv_positive
            formData.is_pregnant, // new_pregnant
            0 // synced
        ];

        const result = await queryWriter(insertQuery, insertParams);
        const respondentId = result.lastInsertRowId;

        // 2. Insert KP statuses
        for (const kp of formData.kp_status_names || []) {
            await queryWriter(
                `INSERT INTO respondent_kp_status (name, respondent, synced) VALUES (?, ?, ?)`,
                [kp, respondentId, 0]
            );
        }

        // 3. Insert Disability statuses
        for (const dis of formData.disability_status_names || []) {
            await queryWriter(
                `INSERT INTO respondent_disability_status (name, respondent, synced) VALUES (?, ?, ?)`,
                [dis, respondentId, 0]
            );
        }

        console.log("Respondent saved locally.");
        return { success: true, id: respondentId };
    } catch (err) {
        console.error("Failed to save respondent:", err);
        return { success: false, error: err };
    }
}