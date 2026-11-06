import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {CapsuleProvider} from '../src/context/CapsuleContext';
import HomeScreen from '../src/screens/HomeScreen';
import MyCapsulesScreen from '../src/screens/MyCapsulesScreen';

// Supply a test login token without accessing the device keychain.
jest.mock('../src/services/authStorage', () => ({
  getAuthToken: jest.fn(async () => 'test-token'),
}));
// Simulate opening a focused screen without mounting a navigation container.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const ReactModule = require('react');
    ReactModule.useEffect(callback, [callback]);
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
// Display the context data directly so these tests isolate API loading and member mapping.
jest.mock('../src/components/CapsuleCard', () => {
  const ReactModule = require('react');
  const {Text} = require('react-native');
  return ({capsule}: any) => ReactModule.createElement(
    Text, null, capsule.name + ': ' + capsule.friends.join(', '),
  );
});

jest.setTimeout(15000);
const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

// Verify both screens load saved friend names, exclude the creator, and send the login token.
test.each([HomeScreen, MyCapsulesScreen])(
  '%p loads saved capsules and friends when focused',
  async Component => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({capsules: [{
        id: '1', title: 'Graduation', opensAt: '2027-05-15T00:00:00',
        createdBy: '10', members: [
          {id: '10', name: 'Creator'}, {id: '20', name: 'Alex'},
        ],
      }]}),
    });
    await render(<CapsuleProvider><Component navigation={{}} /></CapsuleProvider>);
    expect(await screen.findByText('Graduation: Alex')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/capsules'),
      expect.objectContaining({headers: {Authorization: 'Bearer test-token'}}),
    );
  },
);

// Failed requests should display the server message and let the user retry.
test('shows backend errors instead of an empty capsule list', async () => {
  fetchMock.mockResolvedValue({
    ok: false, json: async () => ({error: 'Invalid or expired login session.'}),
  });
  await render(<CapsuleProvider><MyCapsulesScreen navigation={{}} /></CapsuleProvider>);
  expect(await screen.findByText('Invalid or expired login session.')).toBeTruthy();
  expect(screen.getByText('Try again')).toBeTruthy();
});
