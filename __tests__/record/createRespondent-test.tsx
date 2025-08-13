import CreateRespondent from '@/app/authorized/create/CreateRespondent';
import { useConnection } from '@/context/ConnectionContext';
import saveRespondent from '@/database/store/saveRespondent';
import * as metaMap from '@/database/sync/mapMeta';
import deleteIfSynced from '@/database/upload/deleteIfSynced';
import uploadRespondent from '@/database/upload/uploadRespondents';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useNavigation } from 'expo-router';
import React from 'react';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useNavigation: jest.fn(),
}));

jest.mock('@/context/ConnectionContext', () => ({
  useConnection: jest.fn(),
}));

jest.mock('@/database/store/saveRespondent', () => jest.fn());
jest.mock('@/database/upload/uploadRespondents', () => jest.fn());
jest.mock('@/database/upload/deleteIfSynced', () => jest.fn());
jest.mock('@/database/sync/mapMeta', () => ({ mapMeta: jest.fn() }));

jest.mock('@/components/checkboxes', () => 'Checkboxes');
jest.mock('@/components/simplePicker', () => 'SimplePicker');
jest.mock('@/components/styledScroll', () => 'ScrollView');
jest.mock('@/components/styledText', () => 'Text');
jest.mock('@/components/toggleCheckbox', () => 'ToggleCheckbox');

describe('CreateRespondent', () => {
    beforeEach(() => {
        useNavigation.mockReturnValue({ navigate: jest.fn() });
        useConnection.mockReturnValue({ isServerReachable: true });

        metaMap.mapMeta.mockResolvedValue({
            sex: ['Male', 'Female'],
            age_range: ['18-25', '26-35'],
            districts: ['Gaborone'],
            kp_types: ['MSM', 'FSW'],
            disability_types: ['Deaf', 'Blind']
        });

        saveRespondent.mockResolvedValue({ success: true, id: 5 });
        uploadRespondent.mockResolvedValue([5]);
        deleteIfSynced.mockResolvedValue();
    });

    it('renders and submits form for anonymous respondent', async () => {
        const { getByText, getByPlaceholderText } = render(<CreateRespondent />);

        await waitFor(() => getByText('Creating New Respondent'));

        // Mark as anonymous
        fireEvent.press(getByText('Yes'));

        // Select required fields
        fireEvent.changeText(getByPlaceholderText('Village'), 'Testville');
        fireEvent.changeText(getByPlaceholderText('Citizenship'), 'Motswana');
        fireEvent.press(getByTestId('picker-age_range'));
        fireEvent.press(getByTestId('picker-sex'));
        fireEvent.press(getByTestId('picker-district'));

        fireEvent.press(getByText('Submit'));

        await waitFor(() => {
            expect(saveRespondent).toHaveBeenCalled();
            expect(uploadRespondent).toHaveBeenCalled();
            expect(deleteIfSynced).toHaveBeenCalled();
        });
    });

    it('shows validation error if required fields are missing for non-anonymous', async () => {
        const { getByText } = render(<CreateRespondent />);

        await waitFor(() => getByText('Creating New Respondent'));
        fireEvent.press(getByText('Submit'));

        await waitFor(() => {
            expect(getByText('ID number is required')).toBeTruthy();
            expect(getByText('First name is required')).toBeTruthy();
            expect(getByText('Last name is required')).toBeTruthy();
        });
    });
});