import { querySelector, queryWriter } from '@/database/queryWriter';
import organizeRespondentPayload from '@/database/upload/organizeRespondentPayload';
import syncRespondents from '@/database/upload/uploadLocal';
import fetchWithAuth from '@/services/fetchWithAuth';

jest.mock('@/database/queryWriter', () => ({
  querySelector: jest.fn(),
  queryWriter: jest.fn(),
}));
jest.mock('@/services/fetchWithAuth');
jest.mock('@/database/upload/organizeRespondentPayload');

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('syncRespondents (with interactions)', () => {
    it('returns early and logs when no respondents found', async () => {
        querySelector.mockResolvedValueOnce([]); // No unsynced respondents

        const result = await syncRespondents();
        expect(result).toEqual({ status: 'success', more: false });
        expect(console.log).toHaveBeenCalledWith('No respondents to sync');
    });

    it('successfully syncs a respondent with interactions and updates as synced', async () => {
        // 1. Get unsynced respondents
        querySelector.mockResolvedValueOnce([{ id: 1 }]);

        // 2. organizeRespondentPayload
        organizeRespondentPayload.mockResolvedValue({
        respondentData: {
            id: 1,
            uuid: 'abc',
            id_no: '123',
            first_name: 'Test',
            last_name: 'User',
        },
        sensitiveInfoData: {
            is_pregnant: false,
            hiv_positive: false,
            kp_status_names: [],
            disability_status_names: [],
        },
        });

        // 3. Get interactions for respondent
        querySelector.mockResolvedValueOnce([{ id: 100 }]); // SELECT id FROM interactions
        querySelector.mockResolvedValueOnce([
            {id: 100, task: 1, numeric_component: 5, date: '2024-01-01'},
            {id: 102, task: 2, numeric_component: null, date: '2024-01-01'},
            {id: 102, task: 3, numeric_component: null, date: '2024-01-01'},
        ]); // SELECT * FROM interactions WHERE id = ?

        // 4. Get subcat names
        querySelector.mockResolvedValueOnce([{ subcategory: 'X' }]);

        // 5. fetchWithAuth resolves successfully
        fetchWithAuth.mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1 }],
        });

        const result = await syncRespondents();

        expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/record/respondents/bulk/',
        expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"interactions"'),
        })
        );

        expect(queryWriter).toHaveBeenCalledWith(
        'UPDATE respondents SET synced = 1 WHERE id = ?',
        [1]
        );
        expect(queryWriter).toHaveBeenCalledWith(
        'UPDATE interactions SET synced = 1 WHERE respondent_local = ?',
        [1]
        );
        expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/record/respondents/bulk/',
        expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"sensitive_info"'),
        })
        );

        // Parse the body to check structure if needed
        const bodyArg = JSON.parse(fetchWithAuth.mock.calls[0][1].body);
        expect(Array.isArray(bodyArg)).toBe(true);
        expect(bodyArg[0]).toHaveProperty('interactions');
        expect(bodyArg[0]).toHaveProperty('sensitive_info');
        expect(bodyArg[0]).toMatchObject({
        id_no: '123',
        first_name: 'Test',
        last_name: 'User',
        });
        expect(bodyArg[0].sensitive_info).toEqual(expect.objectContaining({
        hiv_positive: false,
        is_pregnant: false
        }));
        expect(bodyArg[0].interactions[0]).toMatchObject({
        task: 1,
        numeric_component: 5,
        interaction_date: '2024-01-01',
        subcategory_names: ['X'],
        });

        expect(result).toEqual({ status: 'success', more: false });
    });

    it('logs and skips on organizeRespondentPayload failure', async () => {
        querySelector.mockResolvedValueOnce([{ id: 2 }]);

        organizeRespondentPayload.mockRejectedValue(new Error('Corrupted respondent'));

        const result = await syncRespondents();
        expect(console.error).toHaveBeenCalledWith(
        'Error preparing respondent 2:',
        expect.any(Error)
        );
        expect(result).toEqual({ status: 'success', more: false });
    });

    it('logs error if POST request fails', async () => {
        querySelector.mockResolvedValueOnce([{ id: 3 }]);

        organizeRespondentPayload.mockResolvedValue({
        respondentData: {
            id: 3,
            uuid: 'xyz',
            id_no: '333',
            first_name: 'Fail',
            last_name: 'Case',
        },
        sensitiveInfoData: {
            kp_status_names: [],
            disability_status_names: [],
        },
        });

        querySelector.mockResolvedValueOnce([]); // No interactions
        fetchWithAuth.mockResolvedValue({ ok: false });

        const result = await syncRespondents();

        expect(console.error).toHaveBeenCalledWith('Bulk sync failed:', expect.any(Error));
        expect(result).toEqual({ status: 'success', more: false });
  });

    it('sets "more" to true if more than 20 respondents exist', async () => {
        const bigList = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
        querySelector.mockResolvedValueOnce(bigList);

        organizeRespondentPayload.mockResolvedValue({
        respondentData: { id: 1, uuid: 'x', id_no: 'z' },
        sensitiveInfoData: {},
        });

        querySelector.mockResolvedValue([]); // No interactions
        fetchWithAuth.mockResolvedValue({ ok: true, json: async () => [] });

        const result = await syncRespondents();
        expect(result).toEqual({ status: 'success', more: true });
    });
});