export default function checkDate(value) {
    if(!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    if (typeof value === "string" && !isNaN(Date.parse(value))) {
        return new Date(value).toISOString().split("T")[0]; // normalize
    }

    return null;
}