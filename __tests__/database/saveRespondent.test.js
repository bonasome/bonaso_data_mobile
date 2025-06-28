import { queryWriter } from '@/database/queryWriter';
import saveRespondent from '@/database/store/saveRespondent';
import uuid from 'react-native-uuid';

jest.mock('@/database/queryWriter');
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(),
}));

describe('saveRespondent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('saves respondent with kp and disability statuses', async () => {
        const mockUUID = 'test-uuid-123';
        uuid.v4.mockReturnValue(mockUUID);

        queryWriter.mockResolvedValueOnce({ lastInsertRowId: 42 }); // respondent insert
        queryWriter.mockResolvedValue({}); // other inserts don't need row id

        const formData = {
        is_anonymous: false,
        id_no: '123',
        first_name: 'Test',
        last_name: 'User',
        dob: new Date('1990-01-01'),
        age_range: '25-34',
        sex: 'M',
        ward: 'Ward A',
        village: 'Village A',
        district: 'District A',
        citizenship: 'Citizenland',
        email: 'test@example.com',
        phone_number: '1234567890',
        hiv_positive: true,
        is_pregnant: false,
        kp_status_names: ['MSM', 'SW'],
        disability_status_names: ['Blind', 'Deaf'],
        };

        const result = await saveRespondent(formData);

        expect(result).toEqual({ success: true, id: 42 });

        // Check main insert
        expect(queryWriter).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO respondents'),
        expect.arrayContaining([
            false,                // is_anonymous
            mockUUID,             // uuid
            '123',                // id_no
            'Test',               // first_name
            'User',               // last_name
            '1990-01-01',         // dob
            '25-34',              // age_range
            'M',                  // sex
            'Ward A',             // ward
            'Village A',          // village
            'District A',         // district
            'Citizenland',        // citizenship
            'test@example.com',   // email
            '1234567890',         // phone_number
            null,                 // created_by
            true,                 // new_hiv_positive
            false,                // new_pregnant
            0                     // synced
        ])
        );

        // Check KP status inserts
        expect(queryWriter).toHaveBeenCalledWith(
        'INSERT INTO respondent_kp_status (name, respondent, synced) VALUES (?, ?, ?)',
        ['MSM', 42, 0]
        );
        expect(queryWriter).toHaveBeenCalledWith(
        'INSERT INTO respondent_kp_status (name, respondent, synced) VALUES (?, ?, ?)',
        ['SW', 42, 0]
        );

        // Check disability status inserts
        expect(queryWriter).toHaveBeenCalledWith(
        'INSERT INTO respondent_disability_status (name, respondent, synced) VALUES (?, ?, ?)',
        ['Blind', 42, 0]
        );
        expect(queryWriter).toHaveBeenCalledWith(
        'INSERT INTO respondent_disability_status (name, respondent, synced) VALUES (?, ?, ?)',
        ['Deaf', 42, 0]
        );
    });

    it('formats dob if already a string', async () => {
        uuid.v4.mockReturnValue('uuid-456');
        queryWriter.mockResolvedValueOnce({ lastInsertRowId: 55 });

        const result = await saveRespondent({
        is_anonymous: true,
        dob: '1995-05-05',
        kp_status_names: [],
        disability_status_names: [],
        });

        expect(queryWriter).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO respondents'),
        expect.arrayContaining(['1995-05-05'])
        );
        expect(result).toEqual({ success: true, id: 55 });
    });

    it('returns failure on error', async () => {
        uuid.v4.mockReturnValue('uuid-error');
        queryWriter.mockRejectedValueOnce(new Error('Insert failed'));

        const result = await saveRespondent({
        is_anonymous: false,
        dob: '1990-01-01',
        kp_status_names: [],
        disability_status_names: [],
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(console.error).toHaveBeenCalledWith(
            'Failed to save respondent:',
            expect.any(Error)
        );
    });
});