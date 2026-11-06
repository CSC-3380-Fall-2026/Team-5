import { http, HttpResponse } from 'msw';

export const BASE_URL = 'http://localhost:8080/api';

export const handlers = [
  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body: any = await request.json();
    if (!body.email || !body.password) {
      return HttpResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    return HttpResponse.json(
      { id: 1, email: body.email, username: body.username },
      { status: 201 }
    );
  }),

  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body: any = await request.json();
    if (body.email === 'test@lsu.edu' && body.password === 'password123') {
      return HttpResponse.json({ token: 'fake-jwt-token', userId: 1 }, { status: 200 });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  http.get(`${BASE_URL}/capsules`, ({ request }) => {
    if (request.headers.get('Authorization') !== 'Bearer fake-jwt-token') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json(
      [{ id: 1, name: 'Junior Year', openDate: '2027-05-15', memberCount: 4 }],
      { status: 200 }
    );
  }),

  http.post(`${BASE_URL}/capsules`, async ({ request }) => {
    if (request.headers.get('Authorization') !== 'Bearer fake-jwt-token') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body: any = await request.json();
    if (!body.name || !body.openDate) {
      return HttpResponse.json({ error: 'name and openDate required' }, { status: 400 });
    }
    return HttpResponse.json({ id: 2, ...body }, { status: 201 });
  }),

  http.get(`${BASE_URL}/capsules/:id`, ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ error: 'Capsule not found' }, { status: 404 });
    }
    return HttpResponse.json({ id: Number(params.id), name: 'Junior Year' }, { status: 200 });
  }),
];