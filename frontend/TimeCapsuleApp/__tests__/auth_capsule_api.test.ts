describe('Auth & Capsule API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/login returns 200 and token', async () => {
    // Simulate a mocked fetch response for login
    const mockFetch = jest.fn().mockResolvedValueOnce({
      status: 200,
      json: async () => ({ token: 'mock-jwt-token-12345' }),
    });

    const response = await mockFetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@lsu.edu', password: 'password123' })
    });
    
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token', 'mock-jwt-token-12345');
  });

  test('GET /api/capsules returns 200 and capsule list', async () => {
    // Simulate a mocked fetch response for capsules
    const mockFetch = jest.fn().mockResolvedValueOnce({
      status: 200,
      json: async () => [{ id: 'capsule-1', title: 'Junior Year' }],
    });

    const response = await mockFetch('http://localhost:8080/api/capsules');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].title).toBe('Junior Year');
  });
});