import { AuthProvider, useAuth } from '@/context/AuthContext';
import { deleteSecureItem, saveSecureItem } from '@/services/secureStorage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Button, Text } from 'react-native';
jest.mock('expo-secure-store');
jest.mock('expo-router', () => ({
    router: { replace: jest.fn() },
}));
jest.mock('@/services/secureStorage', () => ({
    saveSecureItem: jest.fn(),
    deleteSecureItem: jest.fn(),
}));

const TestComponent = () => {
    const {
        isAuthenticated,
        isLoading,
        accessToken,
        signIn,
        signOut,
        offlineSignIn,
    } = useAuth();

    return (
        <>
        <Text testID="authStatus">{isAuthenticated ? 'auth' : 'unauth'}</Text>
        <Text testID="loading">{isLoading ? 'loading' : 'loaded'}</Text>
        <Text testID="accessToken">{accessToken ?? 'no-token'}</Text>
        <Button title="Sign In" onPress={() => signIn({ access: 'abc', refresh: 'xyz', user_id: 1 })} />
        <Button title="Sign Out" onPress={signOut} />
        <Button title="Offline Sign In" onPress={() => offlineSignIn('offline-token')} />
        </>
    );
};

describe('AuthProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads tokens on mount and sets auth state', async () => {
        SecureStore.getItemAsync = jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve('abc')) // accessToken
        .mockImplementationOnce(() => Promise.resolve('xyz')); // refreshToken

        const { getByTestId } = render(
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
        );

        expect(getByTestId('loading').children[0]).toBe('loading');

        await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('loaded');
        expect(getByTestId('authStatus').children[0]).toBe('auth');
        expect(getByTestId('accessToken').children[0]).toBe('abc');
        });
    });

    it('signs in and updates auth state', async () => {
        const { getByText, getByTestId } = render(
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
        );

        await act(async () => fireEvent.press(getByText('Sign In')));

        expect(saveSecureItem).toHaveBeenCalledWith('accessToken', 'abc');
        expect(saveSecureItem).toHaveBeenCalledWith('refreshToken', 'xyz');
        expect(saveSecureItem).toHaveBeenCalledWith('user_id', '1');

        expect(await getByTestId('authStatus').children[0]).toBe('auth');
        
        expect(getByTestId('accessToken').children[0]).toBe('abc');
    });

    it('handles offlineSignIn', async () => {
        const { getByText, getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => fireEvent.press(getByText('Offline Sign In')));

        expect(saveSecureItem).toHaveBeenCalledWith('userToken', 'offline-token');
        expect(getByTestId('accessToken').children[0]).toBe('offline-token');
    });

    it('signs out and clears tokens', async () => {
        const { getByText, getByTestId } = render(
        <AuthProvider>
            <TestComponent />
        </AuthProvider>
        );

        await act(async () => fireEvent.press(getByText('Sign Out')));

        expect(deleteSecureItem).toHaveBeenCalledWith('accessToken');
        expect(deleteSecureItem).toHaveBeenCalledWith('refreshToken');
        expect(deleteSecureItem).toHaveBeenCalledWith('user_id');

        expect(getByTestId('authStatus').children[0]).toBe('unauth');
        expect(getByTestId('accessToken').children[0]).toBe('no-token');
        expect(router.replace).toHaveBeenCalledWith('/login');
  });

    it('throws error if useAuth is used without provider', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<TestComponent />)).toThrow('useAuth requires AuthProvider');
        spy.mockRestore();
    });
});