const {test} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const {registerFriendRoutes} = require('./friends');

// Exercise the real HTTP middleware and handlers with controlled database responses.
async function server(t, replies) {
  const calls = [];
  const pool = {execute: async (sql, args) => {
    calls.push({sql, args});
    assert.ok(replies.length, 'Unexpected database query');
    return [replies.shift()];
  }};
  const app = express();
  app.use(express.json());
  registerFriendRoutes(app, () => pool, (req, res, next) => {
    req.userId = '10'; next();
  });
  const listener = app.listen(0, '127.0.0.1');
  await new Promise(resolve => listener.once('listening', resolve));
  t.after(() => new Promise(resolve => listener.close(resolve)));
  return {calls, request: async (path, method = 'GET', body) => {
    const response = await fetch('http://127.0.0.1:' + listener.address().port + path, {
      method, headers: {'Content-Type': 'application/json'},
      ...(body ? {body: JSON.stringify(body)} : {}),
    });
    return {status: response.status, data: await response.json()};
  }};
}

test('directory maps every relationship and filters admins and self in SQL', async t => {
  const {request, calls} = await server(t, [[{id: 10}], [
    {id: 20, name: 'Alex', bio: null, status: null, sender_id: null},
    {id: 21, name: 'Sam', bio: null, status: 'pending', sender_id: 10},
    {id: 22, name: 'Kim', bio: null, status: 'pending', sender_id: 22},
    {id: 23, name: 'Jo', bio: null, status: 'accepted', sender_id: 23},
  ]]);
  const result = await request('/api/friends/users');
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.users.map(u => u.relationship), ['none', 'outgoing', 'incoming', 'friends']);
  assert.match(calls[1].sql, /u.role = 'user'/);
  assert.match(calls[1].sql, /u.id <> ?/);
  assert.doesNotMatch(calls[1].sql, /LIMIT/);
});

test('admin accounts cannot send friend requests', async t => {
  const {request, calls} = await server(t, [[]]);
  assert.equal((await request('/api/friends/requests/20', 'POST')).status, 403);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /role = 'user'/);
});

test('admins and missing users cannot receive requests', async t => {
  const {request, calls} = await server(t, [[{id: 10}], []]);
  assert.equal((await request('/api/friends/requests/20', 'POST')).status, 404);
  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /role = 'user'/);
});

test('self requests are rejected before any write', async t => {
  const {request, calls} = await server(t, [[{id: 10}]]);
  assert.equal((await request('/api/friends/requests/10', 'POST')).status, 400);
  assert.equal(calls.length, 1);
});

test('sending persists a canonical pair and safely handles duplicate requests', async t => {
  const {request, calls} = await server(t, [[{id: 10}], [{id: 2}], {}, [{sender_id: 10, status: 'pending'}]]);
  const result = await request('/api/friends/requests/2', 'POST');
  assert.equal(result.data.relationship, 'outgoing');
  assert.deepEqual(calls[2].args, ['2', '10', '10', '10']);
  assert.match(calls[2].sql, /ON DUPLICATE KEY UPDATE/);
});

test('a crossed request remains incoming until explicitly accepted', async t => {
  const {request} = await server(t, [[{id: 10}], [{id: 20}], {}, [{sender_id: 20, status: 'pending'}]]);
  assert.equal((await request('/api/friends/requests/20', 'POST')).data.relationship, 'incoming');
});

for (const action of ['accept', 'decline']) {
  test('recipient can ' + action + ' a pending request', async t => {
    const {request, calls} = await server(t, [[{id: 10}], [{id: 20}], {affectedRows: 1}]);
    const result = await request('/api/friends/requests/20', 'PATCH', {action});
    assert.equal(result.status, 200);
    assert.equal(result.data.relationship, action === 'accept' ? 'friends' : 'none');
    assert.deepEqual(calls[2].args, [action === 'accept' ? 'accepted' : 'declined', '10', '20', '20']);
    assert.ok(calls[2].sql.includes("sender_id = ? AND status = 'pending'"));
  });
}

test('sender cannot accept their own outgoing request', async t => {
  const {request} = await server(t, [[{id: 10}], [{id: 20}], {affectedRows: 0}]);
  assert.equal((await request('/api/friends/requests/20', 'PATCH', {action: 'accept'})).status, 409);
});
