import AddInteraction from '@/components/record/AddInteraction';
import { useConnection } from '@/context/ConnectionContext';
import saveInteraction from '@/database/store/saveInteraction';
import uploadInteraction from '@/database/upload/uploadInteraction';
import fetchWithAuth from '@/services/fetchWithAuth';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mocks
jest.mock('@/context/ConnectionContext', () => ({
  useConnection: jest.fn(),
}));
jest.mock('@/services/fetchWithAuth');
jest.mock('@/database/store/saveInteraction');
jest.mock('@/database/upload/uploadInteraction');
jest.mock('@/database/upload/deleteIfSynced', () => jest.fn());

const mockRespondent = { id: 1 };
const mockTasks = [
    {
        id: 10,
        indicator: {
        id: 100,
        name: 'Task A',
        prerequisite: null,
        require_numeric: false,
        subcategories: [],
        },
    },
    {
        id: 11,
        indicator: {
        id: 101,
        name: 'Task B (Numeric)',
        prerequisite: null,
        require_numeric: true,
        subcategories: [],
        },
    },

    {
        id: 12,
        indicator: {
        id: 103,
        name: 'Task C (Subcat Parent)',
        prerequisite: null,
        require_numeric: true,
        subcategories: [{id: 1, name:'Cat 1'}, {id: 2, name:'Cat 2'}],
        },
    },

    {
        id: 14,
        indicator: {
        id: 104,
        name: 'Task D (Subcat Child)',
        prerequisite: 103,
        require_numeric: true,
        subcategories: [{id: 1, name:'Cat 1'}, {id: 2, name:'Cat 2'}],
        },
    },
];

describe('AddInteraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    useConnection.mockReturnValue({ isServerReachable: false });
  });

    it('renders correctly and displays task list', () => {
        const { getByText } = render(
        <AddInteraction respondent={mockRespondent} tasks={mockTasks} fromLocal={true} />
        );

        expect(getByText(/Step 3/i)).toBeTruthy();
        expect(getByText(/Task A/i)).toBeTruthy();
        expect(getByText(/Task B/i)).toBeTruthy();
    });

    it('selects a task and submits successfully', async () => {
        saveInteraction.mockResolvedValue({ success: true });
        uploadInteraction.mockResolvedValue([{ id: 999 }]);

        const { getByText, queryByText } = render(
        <AddInteraction respondent={mockRespondent} tasks={mockTasks} fromLocal={true} />
        );

        const taskButton = getByText(/Task A/i);
        fireEvent.press(taskButton);

        const saveButton = getByText(/Press Here to Save/i);
        fireEvent.press(saveButton);

        await waitFor(() => {
        expect(saveInteraction).toHaveBeenCalledWith(
            expect.objectContaining({
            respondent: 1,
            tasks: [{ task: 10, numeric_component: null, subcategory_names: [] }],
            }),
            true
        );
        });

        expect(global.alert).toHaveBeenCalledWith("Saved successfully!");
    });

    it('opens and cancels numeric modal', async () => {
        const { getByText, getByPlaceholderText } = render(
        <AddInteraction respondent={mockRespondent} tasks={[mockTasks[1]]} fromLocal={true} />
        );

        const taskB = getByText(/Task B/i);
        fireEvent.press(taskB);

        await waitFor(() => {
        expect(getByText(/Please enter a number/i)).toBeTruthy();
        });

        fireEvent.changeText(getByPlaceholderText(/enter any number.../i), '42');

        fireEvent.press(getByText(/Cancel/i));

        await waitFor(() => {
            expect(getByText(/Task B/i)).toBeTruthy(); // Modal closed
        });
    });

    it('shows prerequisite warning if missing prior task', async () => {

        fetchWithAuth.mockResolvedValue({ json: async () => ({ results: [] }) });

        const { getByText } = render(
            <AddInteraction respondent={mockRespondent} tasks={mockTasks} fromLocal={false} />
        );

        const alertSpy = jest.spyOn(global, 'alert').mockImplementation(() => {});
        fireEvent.press(getByText(/Task D/i));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('requires that this respondent has been'));
        });
    });
    it('limits subcategories for prerequisite tasks', async () => {
        fetchWithAuth.mockResolvedValue({ json: async () => ({ results: [] }) });

        const { getByText, queryByText } = render(
            <AddInteraction respondent={mockRespondent} tasks={mockTasks} fromLocal={false} />
        );

        fireEvent.press(getByText(/Task C/i)); // Selects Task C (with subcats)

        await waitFor(() => {
            expect(getByText(/Cat 1/i)).toBeTruthy(); // Modal should show
        });

        fireEvent.press(getByText('Cat 1')); // Select Cat 1
        fireEvent.press(getByText(/Confirm/i)); // Save Task C subcats

        fireEvent.press(getByText(/Task D/i)); // Select Task D (depends on Task C)

        await waitFor(() => {
            expect(queryByText(/Cat 2/i)).toBeFalsy(); // Cat 2 should be excluded
        });
    });
});