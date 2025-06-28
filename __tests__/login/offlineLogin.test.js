import offlineLogin from '@/services/offlineLogin';
import { deleteSecureItem, getSecureItem } from '@/services/secureStorage';
import bcrypt from 'bcryptjs';

jest.mock('@/services/secureStorage');
jest.mock('bcryptjs');

global.alert = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
console.log = jest.fn();

describe('offlineLogin', () => {
    const username = 'testuser';
    const password = 'password123';
    const hashedPassword = 'hashed-password';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns true when credentials match and are within 30 days', async () => {
        const created_on = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
        getSecureItem.mockResolvedValue(JSON.stringify({
        username,
        password: hashedPassword,
        created_on,
        }));
        bcrypt.compare.mockResolvedValue(true);

        const result = await offlineLogin(username, password);
        expect(result).toBe(true);
        expect(console.log).toHaveBeenCalledWith('credentials met');
    });

    it('returns false when password does not match', async () => {
        const created_on = new Date().toISOString();
        getSecureItem.mockResolvedValue(JSON.stringify({
        username,
        password: hashedPassword,
        created_on,
        }));
        bcrypt.compare.mockResolvedValue(false);

        const result = await offlineLogin(username, password);
        expect(result).toBe(false);
        expect(console.log).toHaveBeenCalledWith('Incorrect password.');
    });

    it('returns false when username does not match', async () => {
        const created_on = new Date().toISOString();
        getSecureItem.mockResolvedValue(JSON.stringify({
        username: 'otheruser',
        password: hashedPassword,
        created_on,
        }));

        const result = await offlineLogin(username, password);
        expect(result).toBe(false);
        expect(console.log).toHaveBeenCalledWith('Incorrect username or password. Please try again.');
    });

    it('returns false when credentials are older than 30 days', async () => {
        const created_on = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(); // 40 days ago
        getSecureItem.mockResolvedValue(JSON.stringify({
        username,
        password: hashedPassword,
        created_on,
        }));

        const result = await offlineLogin(username, password);
        expect(result).toBe(false);
        expect(alert).toHaveBeenCalledWith('Offline login expired. You must connect to login.');
    });

    it('returns false when no credentials are stored', async () => {
        getSecureItem.mockResolvedValue(null);

        const result = await offlineLogin(username, password);
        expect(result).toBe(false);
        expect(alert).toHaveBeenCalledWith('Offline login is not available. You must connect to login.');
    });

    it('returns false and deletes credentials if JSON parsing fails', async () => {
        getSecureItem.mockResolvedValue('this is not json');

        const result = await offlineLogin(username, password);
        expect(result).toBe(false);
        expect(deleteSecureItem).toHaveBeenCalledWith('user_credentials');
        expect(alert).toHaveBeenCalledWith('Offline login is not available. You must connect to login.');
        expect(console.error).toHaveBeenCalled();
    });
});