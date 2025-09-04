export default async function checkServerConnection( options = {}){
    /*
    Helper function that pings a lightweight unprotected endpoing to determine if the server is reachable.
    - options (object, optional): special options to pass alongside the url, if applicable 
    */
    console.log('Testing server connection...');
    //default allow 8 seconds before aborting attempt
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const dn = process.env.EXPO_PUBLIC_API_URL; //domain name
    try{
        console.log(`${dn}/api/users/test-connection/`)
        const response = await fetch(`${dn}/api/users/test-connection/`, 
            {method:'HEAD', signal: controller.signal });
        clearTimeout(timer);
        if(response.ok){
            console.log('Connected to server.')
            return true 
        }
        else{
            console.warn('Server returned error.')
            return false
        }
    }
    catch(err){
        console.warn('Could not connect to server: ', err)
        return false
    }
}