import LoadingScreen from '@/components/Loading';
import StyledText from '@/components/styledText';
import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
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
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

export default function Login(){
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('')
    const { signIn, offlineSignIn, isAuthenticated } = useAuth();
    const { isServerReachable } = useConnection();
    const router = useRouter();
    const today = new Date();
    const onSubmit = async (data) => {
        const dn = process.env.EXPO_PUBLIC_API_URL
        setLoading(true);
        const connected = await checkServerConnection(`${dn}/api/users/test-connection/`);
        const username = data.username
        const password = data.password
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
                    console.log(loginResponse)
                    await signIn(loginResponse)

                    const hashed = await hashPassword(password)
                    const offlineCredentials = {
                        'username': username.toString(),
                        'password': hashed.toString(),
                        'created_on': today.toISOString()
                    }
                    await saveSecureItem('user_credentials', JSON.stringify(offlineCredentials))
                    console.log('Offline login now available!')
                    router.replace('/authorized/(tabs)');
                }
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
        else{
            try{
                setLoading(true);
                const checkCred = await offlineLogin(username, password)
                if(checkCred){
                    console.log('Found offline credentials...')
                    const userSessionId = randomUUID();
                    await offlineSignIn(userSessionId);
                    console.log('redirecting')
                    router.replace('/authorized/(tabs)');
                }
                else{
                    setResponse('No credentials found. You must connect to the internet to login.')
                }
            }
            catch(err){
                alert('Offline login failed. You may need to connect to the internet to log in.')
                console.log('Offline login failed: ', err)
            }
            finally{
                setLoading(false);
            }
            
        }
    }

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