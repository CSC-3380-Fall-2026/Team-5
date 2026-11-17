import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react-native';
import FriendsListScreen from '../src/screens/FriendsListScreen';

// Keep authentication and navigation local while exercising the real directory UI.
jest.mock('../src/services/authStorage', () => ({
  getAuthToken: jest.fn(async () => 'test-token'),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const ReactModule = require('react');
    ReactModule.useEffect(callback, [callback]);
  },
}));

jest.setTimeout(15000);
const fetchMock = jest.fn();
const alex = {id: '20', name: 'Alex Rivera', bio: 'Photographer', relationship: 'none'};
const sam = {id: '30', name: 'Sam Taylor', bio: null, relationship: 'incoming'};
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  fetchMock.mockResolvedValueOnce({ok: true, json: async () => ({users: [alex, sam]})});
});

test('explains when an older backend returns an HTML 404 page', async () => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValueOnce({
    ok: false, status: 404,
    headers: {get: () => 'text/html; charset=utf-8'},
    json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected character: <')),
  });
  await render(<FriendsListScreen />);
  expect(await screen.findByText('The running server does not have the Friends feature. Restart the backend, then tap Try again.')).toBeTruthy();
});

test('searches the loaded directory by name or bio', async () => {
  await render(<FriendsListScreen />);
  await screen.findByLabelText('Send friend request to Alex Rivera');
  await fireEvent.changeText(screen.getByPlaceholderText('Search people...'), 'photographer');
  expect(screen.getByLabelText('Send friend request to Alex Rivera')).toBeTruthy();
  expect(screen.queryByLabelText('Accept request from Sam Taylor')).toBeNull();
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/friends/users'),
    expect.objectContaining({headers: expect.objectContaining({Authorization: 'Bearer test-token'})}));
});

test('sends a request and shows the confirmed outgoing state', async () => {
  fetchMock.mockResolvedValueOnce({ok: true, json: async () => ({relationship: 'outgoing'})});
  await render(<FriendsListScreen />);
  await fireEvent.press(await screen.findByLabelText('Send friend request to Alex Rivera'));
  expect(await screen.findByText('Request sent')).toBeTruthy();
  expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/requests/20'),
    expect.objectContaining({method: 'POST'}));
});

test.each(['accept', 'decline'] as const)('recipient can %s an incoming request', async action => {
  fetchMock.mockResolvedValueOnce({ok: true, json: async () => ({relationship: action === 'accept' ? 'friends' : 'none'})});
  await render(<FriendsListScreen />);
  const label = action === 'accept' ? 'Accept' : 'Decline';
  await fireEvent.press(await screen.findByLabelText(label + ' request from Sam Taylor'));
  await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/requests/30'),
    expect.objectContaining({method: 'PATCH', body: JSON.stringify({action})})));
  if (action === 'accept') expect(await screen.findByText('Friends')).toBeTruthy();
  else expect(await screen.findByLabelText('Send friend request to Sam Taylor')).toBeTruthy();
});

test('failed sends show an error and leave the request retryable', async () => {
  fetchMock.mockResolvedValueOnce({ok: false, json: async () => ({error: 'Unable to send friend request.'})});
  await render(<FriendsListScreen />);
  await fireEvent.press(await screen.findByLabelText('Send friend request to Alex Rivera'));
  expect(await screen.findByText('Unable to send friend request.')).toBeTruthy();
  expect(screen.getByLabelText('Send friend request to Alex Rivera')).toBeTruthy();
  expect(screen.queryByText('Request sent')).toBeNull();
});
