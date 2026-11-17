import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import DMScreen from '../src/screens/DMScreen';
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('../src/services/api', () => ({ API_BASE_URL: 'http://test' }));
jest.mock('../src/services/authStorage', () => ({
  getAuthToken: async () => 'token',
}));
const navigation = { navigate: jest.fn() };
let sent: boolean;
beforeEach(() => {
  sent = false;
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
    const path = String(url).replace('http://test', '');
    let data: any;
    if (path === '/api/users/me') {
      data = { user: { id: '10' } };
    } else if (path === '/api/dms') {
      data = { conversations: [{ id: '20', name: 'Alex', isFriend: true }] };
    } else if (path === '/api/friends/users') {
      data = { users: [{ id: '30', name: 'Sam', relationship: 'none' }] };
    } else if (options?.method === 'POST') {
      sent = true;
      data = {
        message: {
          id: '1',
          senderId: '10',
          receiverId: '30',
          content: 'Hello Sam',
          createdAt: '2026-11-16T12:00:00Z',
        },
      };
    } else {
      data = {
        messages: sent
          ? [
              {
                id: '1',
                senderId: '10',
                receiverId: '30',
                content: 'Hello Sam',
                createdAt: '2026-11-16T12:00:00Z',
              },
            ]
          : [],
      };
    }
    return { ok: true, text: async () => JSON.stringify(data) } as Response;
  });
});
afterEach(() => jest.restoreAllMocks());
test('friends automatically appear with a greeting and open an empty conversation', async () => {
  await render(<DMScreen navigation={navigation} />);
  await waitFor(() => expect(screen.getByText('Say hi to Alex')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('Message Alex'));
  await waitFor(() => expect(screen.getByLabelText('Message')).toBeTruthy());
  expect(screen.getByText('Say hi to Alex')).toBeTruthy();
});
test('search finds a non-friend, opens a chat, sends and shows the saved message', async () => {
  await render(<DMScreen navigation={navigation} />);
  await waitFor(() => expect(screen.getByText('Say hi to Alex')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Search people'), 'Sam');
  await waitFor(() =>
    expect(screen.getByLabelText('Message Sam')).toBeTruthy(),
  );
  await fireEvent.press(screen.getByLabelText('Message Sam'));
  await waitFor(() => expect(screen.getByLabelText('Message')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Message'), 'Hello Sam');
  await fireEvent.press(screen.getByLabelText('Send message'));
  await waitFor(() => expect(screen.getByText('Hello Sam')).toBeTruthy());
  expect(globalThis.fetch).toHaveBeenCalledWith(
    'http://test/api/dms/30',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ content: 'Hello Sam' }),
    }),
  );
});
test('an outdated backend shows an actionable error instead of a JSON parse error', async () => {
  jest
    .mocked(globalThis.fetch)
    .mockResolvedValue({
      ok: false,
      text: async () => '<html>Cannot GET /api/dms</html>',
    } as Response);
  await render(<DMScreen navigation={navigation} />);
  await waitFor(() =>
    expect(
      screen.getByText(
        'Messages are unavailable. Restart the updated backend and try again.',
      ),
    ).toBeTruthy(),
  );
});
