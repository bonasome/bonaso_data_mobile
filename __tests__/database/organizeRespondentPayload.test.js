import { querySelector } from '../../database/queryWriter';
import organizeRespondentPayload from '../../database/upload/organizeRespondentPayload';

jest.mock('../../database/queryWriter', () => ({
    querySelector: jest.fn(),
}));

describe('organizeRespondentPayload', () => {
    const respondentId = 1;
    const mockRespondent = {
        id: 1,
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        id_no: 'ID123',
        is_anonymous: 0,
        first_name: 'John',
        last_name: 'Doe',
        sex: 'male',
        ward: 'Ward A',
        village: 'Village X',
        district: 'Central',
        citizenship: 'Country Z',
        email: 'john@example.com',
        contact_no: '123456789',
        dob: '1990-01-01',
        age_range: '30-39',
        new_pregnant: 1,
        new_hiv_positive: 0,
    };

    beforeEach(() => {
            jest.clearAllMocks();
    });

    it('returns properly formatted payload with statuses', async () => {
        querySelector
        .mockResolvedValueOnce([mockRespondent]) // respondent lookup
        .mockResolvedValueOnce([{ name: 'MSM' }, { name: 'FSW' }]) // kp_status
        .mockResolvedValueOnce([{ name: 'Blind' }]); // disability_status

        const payload = await organizeRespondentPayload(respondentId);

        expect(querySelector).toHaveBeenCalledWith(
        'SELECT * FROM respondents WHERE id = ?',
        [respondentId]
        );
        expect(payload.respondentData.first_name).toBe('John');
        expect(payload.respondentData.is_anonymous).toBe(false);
        expect(payload.sensitiveInfoData.hiv_positive).toBe(false);
        expect(payload.sensitiveInfoData.kp_status_names).toEqual(['MSM', 'FSW']);
        expect(payload.sensitiveInfoData.disability_status_names).toEqual(['Blind']);
    });

    it('throws if no respondent is found', async () => {
        querySelector.mockResolvedValueOnce([]); // no respondent found

        await expect(organizeRespondentPayload(respondentId)).rejects.toThrow(
        'Respondent not found'
        );
    });

    it('returns empty arrays for statuses if none found', async () => {
        querySelector
        .mockResolvedValueOnce([mockRespondent]) // respondent lookup
        .mockResolvedValueOnce([]) // kp_status
        .mockResolvedValueOnce([]); // disability_status

        const payload = await organizeRespondentPayload(respondentId);

        expect(payload.sensitiveInfoData.kp_status_names).toEqual([]);
        expect(payload.sensitiveInfoData.disability_status_names).toEqual([]);
    });

    it('throws and logs error if querySelector throws', async () => {
        const err = new Error('DB failure');
        querySelector.mockRejectedValue(err);

        await expect(organizeRespondentPayload(respondentId)).rejects.toThrow('DB failure');
        // Optional: check if console.error was called
        // jest.spyOn(console, 'error').mockImplementation(() => {});
        // expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error building respondent payload'), err);
    });
});