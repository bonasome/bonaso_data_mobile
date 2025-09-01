import LoadingScreen from '@/components/Loading';
import StyledText from '@/components/styledText';
import { useAuth } from '@/context/AuthContext';
import checkServerConnection from '@/services/checkServerConnection';
import { saveSecureItem } from '@/services/secureStorage';
import theme from '@/themes/themes';
import bcrypt from "bcryptjs";
import * as ExpoCrypto from 'expo-crypto';
import { randomUUID } from 'expo-crypto';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import offlineLogin from '../../services/offlineLogin';

// Fallback random generator for bcryptjs
bcrypt.setRandomFallback((len) => {
    const randomBytes = ExpoCrypto.getRandomBytes(len);
    return Array.from(randomBytes); // bcryptjs expects an array of integers
});

async function hashPassword(password) {
    //helper function that hashes a password with 10 salt rounds, returns the hashed password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

export default function Login(){
    /*
    Default component that loads when opening the app and allows a user to login/access the authorized section
    of the app. 
    */
   const router = useRouter();
   //sign in functions from auth context
    const { signIn, offlineSignIn } = useAuth();
    const [response, setResponse] = useState(''); //response after logging in
    const [loading, setLoading] = useState(false); //loading state while attempting login
    
    const today = new Date();

    const onSubmit = async (data) => {
        /*
        Takes data from the form provider (username/password) and attempts to log the user in
        */
        setLoading(true);
        const dn = process.env.EXPO_PUBLIC_API_URL //get domain name
    
        const username = data.username
        const password = data.password

        //check connection to determine what to do next
        const connected = await checkServerConnection(`${dn}/api/users/test-connection/`);
        //if connected, contact the server to get login tokens for auth
        if(connected){
            try{
                console.log('hacking the mainframe: ', data)
                const response = await fetch(`${dn}/api/users/mobile/request-token/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 'username':username, 'password':password }),
                })
                const loginResponse = await response.json();
                if(response.ok){
                    await signIn(loginResponse) //run local sign in function to store tokens
                    
                    //secure store the entered username/password so the user can use it again when logging in
                    //do this each time in case login information changes
                    const hashed = await hashPassword(password)
                    const offlineCredentials = {
                        'username': username.toString(),
                        'password': hashed.toString(),
                        'created_on': today.toISOString()
                    }
                    await saveSecureItem('user_credentials', JSON.stringify(offlineCredentials))
                    router.replace('/authorized/(tabs)');
                }
                //show fail message
                else{
                    setResponse(loginResponse.detail)
                }
                
            }
            catch(err){
                console.error('Failed to log in: ', err);
                alert('Failed to log in. Please check your connection and try again.')
            }
            finally{
                setLoading(false);
            }
        }
        //if not connected, try offline login
        else{
            try{
                //try running offlineLogin to see if the credentials match any potential offline credentials
                const checkCred = await offlineLogin(username, password)
                //if lofin is successful
                if(checkCred?.success === true){
                    console.log('Found offline credentials...')
                    const userSessionId = randomUUID();
                    await offlineSignIn(userSessionId); //generate random session token
                    //redirect user with param to let the index component know to display a warning message the user is offline
                    router.replace({pathname: '/authorized/(tabs)', params: { showInfo: true}});
                }
                else{
                    //otherwise display specific error message 
                    setResponse(checkCred?.message || 'Offline login failed. Please try again later.');
                }
            }
            catch(err){
                //uh-oh
                setResponse('Offline login failed. Please try again later.');
                console.log('Offline login failed: ', err)
            }
            finally{
                setLoading(false);
            }
            
        }
    }

    //form managers
    const methods = useForm();
    const { control, handleSubmit, formState: { errors } } = methods;

    if(loading) return <LoadingScreen />
    return(
          <KeyboardAvoidingView
                style={styles.bg}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView style={{ backgroundColor: theme.colors.bonasoDarkAccent }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <Image style={styles.loginImg} source={require('../../assets/images/bonasoWhite.png')} />
            
            <FormProvider {...methods}>
                <View style={styles.loginContainer}>
                    <StyledText type="title" style={styles.title}>Welcome Back!</StyledText>
                    <StyledText type="defaultSemiBold">Username</StyledText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="Type your username here..."
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                        )}
                        name="username"
                    />
                    {errors.username && <StyledText style={styles.errorText}>This field is required!</StyledText>}

                    <StyledText type="defaultSemiBold" >Password</StyledText>
                    <Controller control={control} rules={{ required: true, maxLength: 255 }}
                        render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password here..."
                            placeholderTextColor={theme.colors.lightGrey}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry={true}
                        />
                        )}
                        name="password"
                    />
                    {errors.password && <StyledText style={styles.errorText}>This field is required!</StyledText>}
                    
                    <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.button}>
                        <StyledText style={styles.buttonText} >LOG IN</StyledText>
                    </TouchableOpacity>
                    {response && <StyledText style={styles.errorText}>{response}</StyledText>}
                </View>
            </FormProvider>
            <View style={styles.spacer}></View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

//styles
const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: theme.colors.bonasoDarkAccent,
    },
    loginImg:{
        height: 200,
        width: 200,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: 100,
    },
    title:{
        textAlign: 'center',
        height: 50,
        marginBottom: 10,
    },
    loginContainer: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingTop: 50,
        marginHorizontal: 40,
    },
    input: {
        backgroundColor: '#fff',
        marginTop: 7,
        color: theme.colors.bonasoDarkAccent,
        height: 40,
        marginBottom: 10,
        padding: 12,
    },
    errorText: {
        marginTop: 6,
        padding: 2,
        borderWidth: 4,
        borderStyle: 'solid',
        borderColor: 'darkred',
        backgroundColor: 'lightcoral',
        color: 'red',
    },
    spacer:{
        padding: 30,
        backgroundColor: theme.colors.bonasoDarkAccent,
    },
    button: {
        backgroundColor: theme.colors.bonasoLightAccent,
        padding: 12,
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});