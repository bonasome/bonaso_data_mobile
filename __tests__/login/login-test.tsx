import { useAuth } from '@/context/AuthContext';
import { useConnection } from '@/context/ConnectionContext';
import checkServerConnection from '@/services/checkServerConnection';
import offlineLogin from '@/services/offlineLogin';
import { saveSecureItem } from '@/services/secureStorage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Login from '../../app/login/index';

// Mock all dependencies
jest.mock('@/context/AuthContext');
jest.mock('@/context/ConnectionContext');
jest.mock('@/services/checkServerConnection');
jest.mock('@/services/secureStorage');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('expo-image', () => ({
  Image: () => null,
}));
jest.mock('@/services/offlineLogin');

// Mock bcryptjs and hashing
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('salt')),
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  setRandomFallback: jest.fn(),
}));

describe('Login Component', () => {
  const mockSignIn = jest.fn();
  const mockOfflineSignIn = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue({
      signIn: mockSignIn,
      offlineSignIn: mockOfflineSignIn,
    });

    useConnection.mockReturnValue({
      isServerReachable: true,
    });

    useRouter.mockReturnValue({
      replace: mockReplace,
    });

    checkServerConnection.mockResolvedValue(true);
    fetch.resetMocks?.(); // if you're using jest-fetch-mock
  });

  it('logs in online successfully', async () => {
    const mockUser = { token: 'abc', user: { username: 'test' } };

    // Mock fetch token response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
    );

    const { getByPlaceholderText, getByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText(/username/i), 'testuser');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'password123');

    fireEvent.press(getByText(/log in/i));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(mockUser);
      expect(saveSecureItem).toHaveBeenCalledWith(
        'user_credentials',
        expect.stringContaining('testuser')
      );
      expect(mockReplace).toHaveBeenCalledWith('/authorized/(tabs)');
    });
  });

  it('shows error when login fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: 'Invalid credentials' }),
      })
    );

    const { getByPlaceholderText, getByText, findByText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText(/username/i), 'wronguser');
    fireEvent.changeText(getByPlaceholderText(/password/i), 'wrongpass');
    fireEvent.press(getByText(/log in/i));

    const errorText = await findByText('Invalid credentials');
    expect(errorText).toBeTruthy();
  });
    it('logs in offline when credentials are valid', async () => {
        useConnection.mockReturnValue({ isServerReachable: false });
        offlineLogin.mockResolvedValue(true);
        checkServerConnection.mockResolvedValue(false);
        
        mockOfflineSignIn.mockResolvedValue(true);

        const { getByPlaceholderText, getByText } = render(<Login />);

        fireEvent.changeText(getByPlaceholderText(/username/i), 'offlineuser');
        fireEvent.changeText(getByPlaceholderText(/password/i), 'offlinepass');
        fireEvent.press(getByText(/log in/i));

        await waitFor(() => {
            expect(offlineLogin).toHaveBeenCalledWith('offlineuser', 'offlinepass');
            expect(mockOfflineSignIn).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith('/authorized/(tabs)');
        });
    });
});