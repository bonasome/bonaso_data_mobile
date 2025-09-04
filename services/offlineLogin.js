import { deleteSecureItem, getSecureItem } from '@/services/secureStorage';
import bcrypt from "bcryptjs";

export default async function offlineLogin(username, password){
    /*
    Takes a username and password and attempts to match it with offline credentials stored on the device. 
    Returns an object containing a success boolean and a message for displaying if the login fails.
    */
   
    const storedCredentials = await getSecureItem('user_credentials'); //check if credentials are available
    if(storedCredentials){
        try{
            const cred = JSON.parse(storedCredentials);

            //check if credentials are older than 30 days, in which case they are no longer valid
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const now = new Date();
            const createdOn = new Date(cred.created_on);
            if (now - createdOn > THIRTY_DAYS_MS) {
                return {success: false, message: 'Your offline credentials are expired. You must connect to the internet to login again.'}
            }
            //check if credentials match
            if(username === cred.username){
                const match = await bcrypt.compare(password, cred.password);
                if(match){
                    return {success: true, message: 'Login successfu!.'}
                }
                else{
                    return {success: false, message: 'Incorrect username or password.'}
                }
            }
            else{
                return {success: false, message: 'Incorrect username or password.'}
            }
        }
        //in case item is corrupted
        catch(err){
            await deleteSecureItem('user_credentials');
            alert('Offline login is not available. You must connect to login.')
            console.error('Offline credentials corrupted: ', err)
            return {success: false, message: 'Offline credentials are corrupted. You must connect to the internet to login again.'}
        }
    }
    //if not, let the user know they need to login online first
    else{
        return {'success': false, 'message': 'Offline login is not available. You must login at least once online first.'}
    }
}