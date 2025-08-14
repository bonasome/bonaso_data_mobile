export default function cleanLabels(str) {
    if (typeof str !== 'string') {
        console.warn('cleanLabels requires a string, received:', str);
        return '';
    }

    str = str.replace('_id', '');
    str = str.replace(/_/g, ' ');
    str = str.replace('kp ', 'Key Population ');
    str = str.trim();

    const words = str.split(' ');
    const cleaned = words.map(w =>
        w.charAt(0).toUpperCase() + w.slice(1)
    );

    return cleaned.join(' ');
}