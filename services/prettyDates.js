export default function prettyDates(uglyDate, time=false, monthOnly=false, long=false, ){
    /*
    Function that takes an ISO date or datetime and converts it to a more readable string.
    - uglyDate: ISO date
    - time (boolean): include a time component
    - monthOnly (boolean): do not include the day
    - long: return the weekday as well.
    */
    try{
        const dateObject = new Date(uglyDate)
        if(long){
            return dateObject.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        else if(time){
            return dateObject.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        else if(monthOnly){
            return dateObject.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
            });
        }
        else{
            return dateObject.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
    catch(err){
        console.warn('Not a valid date!')
        return;
    }
}
