import { querySelector } from "../queryWriter";

export async function mapMeta() {
    const tables = [
        "districts",
        "sex",
        "age_range",
        "kp_types",
        "disability_types",
    ];

    const meta = {};

    for (const table of tables) {
        try {
        const rows = await querySelector(`SELECT value, label FROM ${table}`, []);
        // Format as array of { value, label }
        meta[table] = rows.map(row => ({
            value: row.value,
            label: row.label,
        }));
        } catch (err) {
        console.error(`Failed to load from ${table}:`, err);
        meta[table] = [];
        }
    }
    console.log(meta)
    return meta;
}