const {test} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const {registerDirectMessageRoutes, DIRECT_MESSAGES_SCHEMA} = require('./directMessages');
async function server(t, replies) {
  const calls = [];
  const app = express(); app.use(express.json());
  registerDirectMessageRoutes(app, () => ({execute: async (sql, args) => {
    calls.push({sql, args}); assert.ok(replies.length, 'Unexpected query'); return [replies.shift()];
  }}), (req, res, next) => {req.userId = '10'; next();});
  const listener = app.listen(0, '127.0.0.1');
  await new Promise(resolve => listener.once('listening', resolve));
  t.after(() => new Promise(resolve => listener.close(resolve)));
  return {calls, request: async (path, body) => {
    const response = await fetch(`http://127.0.0.1:${listener.address().port}${path}`, {
      method: body ? 'POST' : 'GET', headers: {'Content-Type': 'application/json'},
      ...(body ? {body: JSON.stringify(body)} : {}),
    });
    return {status: response.status, data: await response.json()};
  }};
}
test('inbox includes friends with no messages and non-friend conversations', async t => {
  const {request, calls} = await server(t, [[
    {id: 20, name: 'Alex', is_friend: 0, last_message: 'Hello', last_sender_id: 20, last_message_at: '2026-11-16'},
    {id: 21, name: 'Sam', is_friend: 1, last_message: null, last_sender_id: null, last_message_at: null},
  ]]);
  const result = await request('/api/dms');
  assert.equal(result.status, 200);
  assert.equal(result.data.conversations[0].lastSenderId, '20');
  assert.equal(result.data.conversations[1].isFriend, true);
  assert.equal(result.data.conversations[1].lastMessage, null);
  assert.match(calls[0].sql, /f.status = 'accepted' OR m.id IS NOT NULL/);
  assert.match(calls[0].sql, /u.role = 'user'/);
  assert.equal(calls[0].args.length, 6);
});
test('a non-friend can receive a message, which is trimmed and persisted', async t => {
  const {request, calls} = await server(t, [[{id: 20}], {}, [{created_at: '2026-11-16'}]]);
  const result = await request('/api/dms/20', {content: '  Hello!  '});
  assert.equal(result.status, 201);
  assert.equal(result.data.message.content, 'Hello!');
  assert.deepEqual(calls[1].args.slice(1), ['10', '20', 'Hello!']);
  assert.doesNotMatch(calls[0].sql, /friend_requests/);
});
test('unknown members and admins are rejected before reading history', async t => {
  const {request, calls} = await server(t, [[]]);
  assert.equal((await request('/api/dms/20')).status, 403);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /u1.role = 'user' AND u2.role = 'user'/);
});
for (const id of ['10', '010', 'bad', '9223372036854775808']) {
  test(`invalid or self recipient ${id} is rejected without querying`, async t => {
    const {request, calls} = await server(t, []);
    assert.equal((await request(`/api/dms/${id}`, {content: 'Hello'})).status, 400);
    assert.equal(calls.length, 0);
  });
}
test('blank and oversized messages are rejected before insert', async t => {
  const {request, calls} = await server(t, [[{id: 20}], [{id: 20}]]);
  assert.equal((await request('/api/dms/20', {content: ' '})).status, 400);
  assert.equal((await request('/api/dms/20', {content: 'a'.repeat(2001)})).status, 400);
  assert.equal(calls.length, 2);
});
test('history loads the latest 500, returned in chronological order', async t => {
  const {request, calls} = await server(t, [[{id: 20}], [
    {id: 2, sender_id: 20, receiver_id: 10, content: 'Reply', created_at: '2026-11-16'},
    {id: 1, sender_id: 10, receiver_id: 20, content: 'Hi', created_at: '2026-11-15'},
  ]]);
  const result = await request('/api/dms/20');
  assert.deepEqual(result.data.messages.map(m => m.id), ['1', '2']);
  assert.deepEqual(calls[1].args, ['10', '20', '20', '10']);
  assert.match(calls[1].sql, /ORDER BY created_at DESC, id DESC/);
});
test('new databases get persistent DMs without resetting other data', () => {
  assert.match(DIRECT_MESSAGES_SCHEMA, /CREATE TABLE IF NOT EXISTS direct_messages/);
  assert.match(DIRECT_MESSAGES_SCHEMA, /INDEX dm_pair/);
});
