
export default function wasWithinLastXMinutes(isoTimestamp, minutes=15) {
    const now = new Date();
    const timestamp = new Date(isoTimestamp);
    const FIFTEEN_MINUTES = minutes * 60 * 1000;
    return now.getTime() - timestamp.getTime() <= FIFTEEN_MINUTES;
}