import { getErrorMessage } from '../src/utils/errorMessage';

describe('getErrorMessage', () => {
  test('explains network failures', () => {
    expect(getErrorMessage(new TypeError('Network request failed'))).toMatch(/reach the server/);
  });

  test('uses the message of a normal error', () => {
    expect(getErrorMessage(new Error('Request failed (500)'))).toBe('Request failed (500)');
  });

  test('falls back to a generic message', () => {
    expect(getErrorMessage('???')).toBe('Something went wrong. Please try again.');
  });
});