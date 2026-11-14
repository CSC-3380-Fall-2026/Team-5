const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const {
  validLocation,
  ensureMemoryLocationSchema,
  registerMemoryMapRoutes,
} = require("./memoryMap");
process.env.JWT_SECRET = "test-only-memory-map-secret";
const { app, setPool } = require("./server");
async function listen(t, target) {
  const server = target.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return async (path, method = "GET", body, user = "10") => {
    const token = jwt.sign({ sub: user }, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });
    const r = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(user ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, data: await r.json() };
  };
}
test("location validation accepts zero and negatives; rejects partial, infinite and out of range values", () => {
  for (const p of [
    [null, null],
    [0, 0],
    [-90, -180],
    [90, 180],
  ])
    assert.equal(validLocation(...p), true);
  for (const p of [
    [null, 1],
    [1, null],
    [91, 0],
    [0, -181],
    ["30", 1],
    [NaN, 0],
    [Infinity, 0],
  ])
    assert.equal(validLocation(...p), false);
});
test("migration adds missing columns without deleting existing data and is repeatable", async () => {
  const columns = new Set(["photo_data"]);
  const writes = [];
  const pool = {
    execute: async (sql, args) => [columns.has(args[1]) ? [{}] : []],
    query: async (sql) => {
      writes.push(sql);
      columns.add(sql.split(" ")[5]);
    },
  };
  await ensureMemoryLocationSchema(pool);
  await ensureMemoryLocationSchema(pool);
  assert.equal(writes.length, 3);
  writes.forEach((sql) =>
    assert.match(sql, /^ALTER TABLE messages ADD COLUMN/)
  );
});
test("save -> locked -> unlock -> reload -> map preserves every memory and photo", async (t) => {
  let opened = false;
  const messages = [];
  const queries = [];
  setPool({
    execute: async (sql, args) => {
      queries.push(sql);
      if (sql.includes("INSERT INTO messages")) {
        messages.push({
          id: args[0],
          capsule_id: args[1],
          user_id: args[2],
          content: args[3],
          photo_data: args[4],
          latitude: args[5],
          longitude: args[6],
          location_name: args[7],
        });
        return [{}];
      }
      if (sql.includes("UPDATE capsules")) {
        opened = true;
        return [{}];
      }
      if (sql.includes("FROM messages m JOIN capsules")) {
        assert.match(sql, /c.opens_at <= NOW\(\)/);
        assert.match(sql, /gm.user_id = \?/);
        assert.match(sql, /m.latitude IS NOT NULL/);
        return [
          opened && args[0] === "10"
            ? messages.map((m) => ({
                ...m,
                capsule_title: "Test capsule",
                opens_at: new Date(0),
              }))
            : [],
        ];
      }
      if (sql.includes("FROM messages")) return [messages];
      if (sql.includes("FROM capsules"))
        return [
          args[1] === "10"
            ? [
                {
                  id: "1",
                  opens_at: opened ? new Date(0) : new Date("2099-01-01"),
                },
              ]
            : [],
        ];
      throw new Error("Unexpected SQL: " + sql);
    },
  });
  const request = await listen(t, app);
  const memory = {
    content: "Keep this memory",
    photoData: "data:image/png;base64,aGVsbG8=",
    latitude: 0,
    longitude: -91.1,
    locationName: "Baton Rouge",
  };
  assert.equal(
    (await request("/api/capsules/1/memories", "POST", memory)).status,
    201
  );
  assert.equal(
    (
      await request("/api/capsules/1/memories", "POST", {
        ...memory,
        content: "Second memory",
      })
    ).status,
    201
  );
  assert.equal((await request("/api/capsules/1/memories")).status, 423);
  assert.deepEqual((await request("/api/memories/map")).data.memories, []);
  assert.equal(
    (await request("/api/capsules/1/unlock-now", "PATCH")).status,
    200
  );
  for (let i = 0; i < 2; i++) {
    const result = await request("/api/capsules/1/memories");
    assert.equal(result.data.memories.length, 2);
    assert.equal(result.data.memories[0].photoData, memory.photoData);
    assert.equal(result.data.memories[0].latitude, 0);
  }
  const map = await request("/api/memories/map");
  assert.equal(map.data.memories.length, 2);
  assert.equal(map.data.memories[0].capsuleId, "1");
  assert.equal(map.data.memories[0].photoUri, memory.photoData);
  assert.equal(
    (await request("/api/capsules/1/memories", "GET", null, "20")).status,
    404
  );
  assert.deepEqual(
    (await request("/api/memories/map", "GET", null, "20")).data.memories,
    []
  );
  assert.equal(
    (await request("/api/memories/map", "GET", null, "")).status,
    401
  );
  assert.ok(!queries.some((q) => /DELETE|TRUNCATE|DROP/.test(q)));
});
test("invalid location is rejected before touching MySQL", async (t) => {
  setPool({
    execute: () => {
      throw new Error("Must not query");
    },
  });
  const request = await listen(t, app);
  assert.equal(
    (
      await request("/api/capsules/1/memories", "POST", {
        content: "Hi",
        latitude: 0,
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request("/api/capsules/1/memories", "POST", {
        content: "Hi",
        latitude: 95,
        longitude: 10,
      })
    ).status,
    400
  );
});
test("geocoding validates input, caches, throttles and handles an outage", async (t) => {
  const target = express();
  let calls = 0,
    clock = 0;
  registerMemoryMapRoutes(
    target,
    () => null,
    (req, res, next) => next(),
    {
      now: () => clock,
      fetchImpl: async (url) => {
        calls++;
        assert.equal(url.searchParams.get("limit"), "5");
        if (calls > 1) throw new Error("Offline");
        return {
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: { coordinates: [-91.18, 30.41] },
                properties: { name: "LSU", city: "Baton Rouge" },
              },
            ],
          }),
        };
      },
    }
  );
  const request = await listen(t, target);
  assert.equal((await request("/api/locations/search?q=a")).status, 400);
  const result = await request("/api/locations/search?q=LSU");
  assert.equal(result.data.places[0].latitude, 30.41);
  assert.equal((await request("/api/locations/search?q=lsu")).status, 200);
  assert.equal(calls, 1);
  assert.equal((await request("/api/locations/search?q=Paris")).status, 429);
  clock = 2000;
  assert.equal((await request("/api/locations/search?q=Paris")).status, 502);
});
