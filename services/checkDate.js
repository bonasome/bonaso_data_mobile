export default function checkDate(value) {
    /*
    Takes a "date" value (either a date object or an ISO string) and converts it to an ISO 
    date string (no time). Helpful for when a preloaded value may be an ISO string but an inputted
    value may be an object.
    */
    if(!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    if (typeof value === "string" && !isNaN(Date.parse(value))) {
        return new Date(value).toISOString().split("T")[0]; // normalize
    }

    return null;
}