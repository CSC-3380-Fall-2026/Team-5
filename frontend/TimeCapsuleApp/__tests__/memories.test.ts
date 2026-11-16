import { loadCapsuleMemories } from '../src/services/memories';
jest.mock('../src/services/api', () => ({ API_BASE_URL: 'http://test' }));
jest.mock('../src/services/authStorage', () => ({
  getAuthToken: async () => 'token',
}));
afterEach(() => jest.restoreAllMocks());
test('locked response hides content; repeated loads after unlock restore the same photo and coordinates', async () => {
  const memory = {
    id: 7,
    content: 'Still here',
    photoData: 'data:image/png;base64,YQ==',
    latitude: 0,
    longitude: -91,
    locationName: 'Park',
  };
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({ status: 423 } as Response)
    .mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ memories: [memory] }),
    } as Response);
  expect(await loadCapsuleMemories('c1')).toEqual({
    locked: true,
    memories: [],
  });
  const opened = await loadCapsuleMemories('c1');
  const refreshed = await loadCapsuleMemories('c1');
  expect(refreshed).toEqual(opened);
  expect(opened.memories[0]).toEqual({
    id: '7',
    text: 'Still here',
    photoUri: memory.photoData,
    latitude: 0,
    longitude: -91,
    locationName: 'Park',
  });
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
test('network/backend failure is not mistaken for an empty capsule', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({
      status: 500,
      ok: false,
      json: async () => ({ error: 'Try again' }),
    } as Response);
  await expect(loadCapsuleMemories('c1')).rejects.toThrow('Try again');
});
