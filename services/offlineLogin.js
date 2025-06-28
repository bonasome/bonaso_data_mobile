import { deleteSecureItem, getSecureItem } from '@/services/secureStorage';
import bcrypt from "bcryptjs";

export default async function offlineLogin(username, password){
    const storedCredentials = await getSecureItem('user_credentials')
    if(storedCredentials){
        try{
            const cred = JSON.parse(storedCredentials)
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const now = new Date();
            const createdOn = new Date(cred.created_on);

            if (now - createdOn > THIRTY_DAYS_MS) {
                console.warn('Offline credentials expired. You must connect to the internet to log in.')
                alert('Offline login expired. You must connect to login.')
                return false
            }
            if(username === cred.username){
                const match = await bcrypt.compare(password, cred.password);
                if(match){
                    console.log('credentials met')
                    return match
                }
                else{
                    console.log('Incorrect password.')
                    return false
                }
            }
            else{
                console.log('Incorrect username or password. Please try again.')
                return false
            }
        }
        catch(err){
            await deleteSecureItem('user_credentials');
            alert('Offline login is not available. You must connect to login.')
            console.error('Offline credentials corrupted: ', err)
            return false
        }
    }
    else{
        alert('Offline login is not available. You must connect to login.')
        console.warn('Offline login not available. You must connect to the internet to access your account.')
        return false
    }
}