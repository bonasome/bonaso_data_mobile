export default async function checkServerConnection(url, options = {}){
    console.log('Testing server connection...')
    const {timeout = 8000 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const dn = process.env.EXPO_PUBLIC_DOMAIN_NAME
    try{
        const response = await fetch(`${dn}/api/users/test-connection/`, 
            {method:'HEAD', signal: controller.signal });
        clearTimeout(timer)
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