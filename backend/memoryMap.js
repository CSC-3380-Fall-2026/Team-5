// Optional columns are added without resetting existing memories.
async function ensureMemoryLocationSchema(pool) {
  const columns = {
    photo_data: "LONGTEXT NULL",
    latitude: "DOUBLE NULL",
    longitude: "DOUBLE NULL",
    location_name: "VARCHAR(500) NULL",
  };
  for (const [name, type] of Object.entries(columns)) {
    const [rows] = await pool.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      ["messages", name]
    );
    if (!rows.length) {
      try {
        await pool.query(`ALTER TABLE messages ADD COLUMN ${name} ${type}`);
      } catch (error) {
        if (error.code !== "ER_DUP_FIELDNAME") throw error;
      }
    }
  }
}
function validLocation(latitude, longitude) {
  return (
    (latitude == null && longitude == null) ||
    (typeof latitude === "number" &&
      Number.isFinite(latitude) &&
      Math.abs(latitude) <= 90 &&
      typeof longitude === "number" &&
      Number.isFinite(longitude) &&
      Math.abs(longitude) <= 180)
  );
}
function registerMemoryMapRoutes(
  app,
  getPool,
  authenticateUser,
  { fetchImpl = fetch, now = Date.now } = {}
) {
  app.get("/api/memories/map", authenticateUser, async (req, res) => {
    try {
      const [rows] = await getPool().execute(
        `SELECT m.*, c.title AS capsule_title, c.opens_at
        FROM messages m JOIN capsules c ON c.id = m.capsule_id
        WHERE c.opens_at <= NOW() AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
        AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = c.group_id AND gm.user_id = ?)
        ORDER BY m.created_at DESC`,
        [req.userId]
      );
      res.json({
        memories: rows.map((m) => ({
          id: String(m.id),
          capsuleId: String(m.capsule_id),
          capsuleName: m.capsule_title,
          opensAt: m.opens_at,
          text: m.content,
          photoUri: m.photo_data || "",
          latitude: Number(m.latitude),
          longitude: Number(m.longitude),
          locationName: m.location_name || "",
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to load the memory map." });
    }
  });
  const cache = new Map();
  let nextSearch = 0;
  app.get("/api/locations/search", authenticateUser, async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query.length < 3 || query.length > 200)
      return res
        .status(400)
        .json({ error: "Enter a place or address (3–200 characters)." });
    const endpoint =
      process.env.GEOCODING_URL || "https://photon.komoot.io/api/";
    const key = query.toLowerCase();
    if (cache.has(key)) return res.json({ places: cache.get(key) });
    if (now() < nextSearch)
      return res
        .status(429)
        .json({ error: "Please wait a moment and search again." });
    nextSearch = now() + 1100;
    try {
      const url = new URL(endpoint);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "5");
      const response = await fetchImpl(url, {
        headers: {
          "User-Agent":
            "TimeCapsule-Team5/1.0 (+https://github.com/CSC-3380-Fall-2026/Team-5)",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Geocoder unavailable");
      const data = await response.json();
      if (!Array.isArray(data.features))
        throw new Error("Invalid geocoder response");
      const places = data.features
        .slice(0, 5)
        .map((feature) => {
          const p = feature.properties || {};
          return {
            latitude: feature.geometry?.coordinates?.[1],
            longitude: feature.geometry?.coordinates?.[0],
            locationName: [
              ...new Set(
                [
                  p.name,
                  [p.housenumber, p.street].filter(Boolean).join(" "),
                  p.city,
                  p.state,
                  p.country,
                ].filter(Boolean)
              ),
            ]
              .join(", ")
              .slice(0, 500),
          };
        })
        .filter(
          (p) =>
            p.latitude != null &&
            p.longitude != null &&
            validLocation(p.latitude, p.longitude)
        );
      if (cache.size >= 500) cache.delete(cache.keys().next().value);
      cache.set(key, places);
      res.json({ places });
    } catch (error) {
      res
        .status(502)
        .json({
          error: "Place search is unavailable. Try again or tap the map.",
        });
    }
  });
}
module.exports = {
  ensureMemoryLocationSchema,
  validLocation,
  registerMemoryMapRoutes,
};
