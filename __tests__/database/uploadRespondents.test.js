import { querySelector, queryWriter } from '@/database/queryWriter';
import organizeRespondentPayload from '@/database/upload/organizeRespondentPayload';
import fetchWithAuth from '@/services/fetchWithAuth';
import syncRespondents from '../../database/upload/uploadRespondents';

jest.mock('@/database/queryWriter', () => ({
    querySelector: jest.fn(),
    queryWriter: jest.fn(),
}));

jest.mock('@/services/fetchWithAuth', () => jest.fn());

jest.mock('@/database/upload/organizeRespondentPayload', () => jest.fn());


describe('syncRespondents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should do nothing if no unsynced respondents', async () => {
        querySelector.mockResolvedValueOnce([]); // No rows
        const result = await syncRespondents();

        expect(querySelector).toHaveBeenCalledWith(
            'SELECT id FROM respondents WHERE synced = 0'
        );
        expect(result).toEqual([]);
    });

    it('should sync one respondent and mark as synced', async () => {
        querySelector.mockResolvedValueOnce([{ id: 1 }]); // unsynced respondent

        organizeRespondentPayload.mockResolvedValue({
            respondentData: { uuid: 'abc', first_name: 'Jane' },
            sensitiveInfoData: { hiv_positive: true },
        });

        fetchWithAuth
        // First call to sync respondent
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 100 }), // remote ID
        })
        // Second call to sync sensitive info
        .mockResolvedValueOnce({ ok: true });

        const result = await syncRespondents();

        expect(organizeRespondentPayload).toHaveBeenCalledWith(1);
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/record/respondents/', expect.any(Object));
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/record/respondents/100/sensitive-info/', expect.any(Object));

        expect(queryWriter).toHaveBeenCalledWith('UPDATE respondents SET synced = 1 WHERE id = ?', [1]);
        expect(queryWriter).toHaveBeenCalledWith('UPDATE respondent_kp_status SET synced = 1 WHERE respondent = ?', [1]);
        expect(queryWriter).toHaveBeenCalledWith('UPDATE respondent_disability_status SET synced = 1 WHERE respondent = ?', [1]);

        expect(result).toEqual([100]);
    });

    it('should continue syncing others if one fails', async () => {
        querySelector.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

        organizeRespondentPayload
        .mockResolvedValueOnce({
            respondentData: { uuid: 'abc' },
            sensitiveInfoData: { hiv_positive: false },
        })

        .mockResolvedValueOnce({
            respondentData: { uuid: 'def' },
            sensitiveInfoData: { hiv_positive: true },
        });

        // First fetch fails
        fetchWithAuth
        .mockResolvedValueOnce({ ok: false }) // fail respondent POST
        // Respondent 2 passes
        .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 200 }),
        })
        .mockResolvedValueOnce({ ok: true });

        const result = await syncRespondents();

        expect(result).toEqual([200]);
        expect(fetchWithAuth).toHaveBeenCalledTimes(3); // 1 fail + 2 success
        expect(queryWriter).toHaveBeenCalledTimes(3); // Only for id 2
    });

    it('should catch and log any thrown errors', async () => {
        querySelector.mockResolvedValueOnce([{ id: 5 }]);
        const mockError = new Error('Unexpected DB error');
        organizeRespondentPayload.mockRejectedValueOnce(mockError);

        const result = await syncRespondents();

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Sync failed for respondent 5:', mockError);
    });
});
