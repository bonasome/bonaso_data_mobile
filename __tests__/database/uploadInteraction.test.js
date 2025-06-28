import { querySelector, queryWriter } from '@/database/queryWriter';
import syncInteractions from '@/database/upload/uploadInteraction';
import fetchWithAuth from '@/services/fetchWithAuth';

jest.mock('@/database/queryWriter', () => ({
  querySelector: jest.fn(),
  queryWriter: jest.fn(),
}));

jest.mock('@/services/fetchWithAuth');

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('syncInteractions', () => {
    it('returns true and logs when there are no interactions to sync', async () => {
        querySelector.mockResolvedValueOnce([]); // for initial interaction check

        const result = await syncInteractions();
        expect(result).toBe(true);
        expect(console.log).toHaveBeenCalledWith('No interactions to sync');
    });

    it('syncs interactions and updates them as synced', async () => {
        // First query: list of unsynced interactions
        querySelector.mockResolvedValueOnce([
        {
            id: 1,
            respondent_server: 10,
            task: 100,
            numeric_component: 5,
            date: '2025-06-01',
        },
        {
            id: 2,
            respondent_server: 10,
            task: 200,
            numeric_component: null,
            date: '2025-06-02',
        }
        ]);

        // Second query: get subcategories for interaction 1
        querySelector.mockResolvedValueOnce([{ subcategory: 'A' }]);
        // Third query: get subcategories for interaction 2
        querySelector.mockResolvedValueOnce([{ subcategory: 'B' }, { subcategory: 'C' }]);

        fetchWithAuth.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        });

        const result = await syncInteractions();

        expect(result).toBe(true);
        expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/record/interactions/batch/',
        expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
            respondent: 10,
            tasks: [
                {
                id: 1,
                task: 100,
                numeric_component: 5,
                interaction_date: '2025-06-01',
                subcategory_names: ['A'],
                },
                {
                id: 2,
                task: 200,
                numeric_component: null,
                interaction_date: '2025-06-02',
                subcategory_names: ['B', 'C'],
                },
            ],
            }),
        })
        );

        expect(queryWriter).toHaveBeenCalledWith(
        'UPDATE interactions SET synced = 1 WHERE id = ?',
        [1]
        );
        expect(queryWriter).toHaveBeenCalledWith(
        'UPDATE interactions SET synced = 1 WHERE id = ?',
        [2]
        );
    });

    it('handles failed sync and logs the error', async () => {
        querySelector.mockResolvedValueOnce([
        { id: 5, respondent_server: 99, task: 123, numeric_component: 1, date: '2025-01-01' }
        ]);
        querySelector.mockResolvedValueOnce([{ subcategory: 'X' }]);

        fetchWithAuth.mockResolvedValue({
        ok: false,
        text: async () => 'Bad Request',
        });

        const result = await syncInteractions();

        expect(result).toBe(true); // still returns true
        expect(console.error).toHaveBeenCalledWith(
        'Sync failed for respondent 99:',
        expect.any(Error)
        );
    });
});