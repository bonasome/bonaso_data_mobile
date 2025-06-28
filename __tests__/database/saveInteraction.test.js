import { queryWriter } from '@/database/queryWriter';
import saveInteraction from '@/database/store/saveInteraction';

jest.mock('@/database/queryWriter');

describe('saveInteraction', () => {
    beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('saves a server-linked interaction with subcategories', async () => {
        queryWriter.mockResolvedValueOnce({ lastInsertRowId: 10 }); // interaction insert
        queryWriter.mockResolvedValue({}); // subcategories

        const formData = {
        doi: new Date('2024-06-01'),
        respondent: 123,
        tasks: [
            {
            task: 5,
            numeric_component: 2,
            subcategory_names: ['A', 'B'],
            },
        ],
        };

        const result = await saveInteraction(formData, false);

        expect(queryWriter).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO interactions'),
        ['2024-06-01', 123, 2, 5, 0]
        );

        expect(queryWriter).toHaveBeenCalledWith(
        'INSERT INTO interaction_subcategories (interaction, subcategory, synced) VALUES (?, ?, ?)',
        [10, 'A', 0]
        );
        expect(queryWriter).toHaveBeenCalledWith(
        'INSERT INTO interaction_subcategories (interaction, subcategory, synced) VALUES (?, ?, ?)',
        [10, 'B', 0]
        );

        expect(result).toEqual({ success: true });
    });

    it('saves a local interaction with no subcategories', async () => {
        queryWriter.mockResolvedValueOnce({ lastInsertRowId: 99 });

        const formData = {
        doi: '2024-05-05',
        respondent: 456,
        tasks: [
            {
            task: 12,
            numeric_component: null,
            },
        ],
        };

        const result = await saveInteraction(formData, true);

        expect(queryWriter).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO interactions ( date, respondent_local'),
        ['2024-05-05', 456, null, 12, 0]
        );

        expect(result).toEqual({ success: true });
    });

    it('handles multiple tasks', async () => {
        queryWriter.mockResolvedValueOnce({ lastInsertRowId: 201 });
        queryWriter.mockResolvedValueOnce({ lastInsertRowId: 202 });

        const formData = {
        doi: new Date('2024-01-01'),
        respondent: 789,
        tasks: [
            { task: 1, numeric_component: 3, subcategory_names: ['X'] },
            { task: 2, numeric_component: 5, subcategory_names: [] },
        ],
        };

        const result = await saveInteraction(formData, false);

        expect(queryWriter).toHaveBeenCalledTimes(3); // 2 inserts + 1 subcategory
        expect(result).toEqual({ success: true });
    });

    it('returns false and logs on failure', async () => {
        queryWriter.mockRejectedValueOnce(new Error('DB failure'));

        const formData = {
        doi: '2024-01-01',
        respondent: 101,
        tasks: [{ task: 8 }],
        };

        const result = await saveInteraction(formData);

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(console.error).toHaveBeenCalledWith(
        'Failed to save interaction:',
        expect.any(Error)
        );
    });
});