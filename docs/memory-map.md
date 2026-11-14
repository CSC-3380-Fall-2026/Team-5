# Memory Map

The Add Memory screen can attach an address/place search result or a dropped,
draggable pin. Location is optional. Coordinates, location label, text and photo
are stored together in `messages`; old memories without coordinates remain in
their capsules but do not appear on the map.

Memory Map fetches only the logged-in user's opened capsules. Tap a pin for the
photo and text, then **Open memory** to open its capsule with that memory listed
first and labeled. Memories sharing a location are grouped into one popup so
none is hidden beneath another marker. Locked capsule contents are also blocked
by the memory-details endpoint (HTTP 423), not just hidden on the screen.

The details screen reads memories on focus, after test-unlock, and periodically
while visible. It replaces the list from the server instead of suppressing IDs
that it previously loaded. A capsule-list refresh therefore no longer prevents
saved memories from being displayed again. Failed loads show a retry message,
not an empty-capsule message. Unlocking changes the capsule date only.

## Setup

1. Run `npm ci` in `backend` and `frontend/TimeCapsuleApp`.
2. Restart the backend. Startup adds missing `photo_data`, `latitude`,
   `longitude`, and `location_name` columns without dropping or resetting data.
   The database account needs ALTER permission on `messages`. New databases get
   these columns from `backend/db/schema.sql`.
3. Rebuild Android with `npm run android`. This installs the added native
   `react-native-webview` dependency; a Metro refresh alone is not enough.
   For iOS, install CocoaPods dependencies on macOS before rebuilding.
4. Keep existing database connection settings and JWT secret.

OpenStreetMap tiles and pinned Leaflet 1.9.4 assets require internet access.
The WebView keeps normal caching and visible OSM attribution, identifies the app,
and does not prefetch tiles for offline use.

Address search uses the Photon public demo by default, through the authenticated
backend. Search happens only on explicit submission, with a bounded cache,
a global per-process rate limit and an eight-second timeout. No API key is needed
for a small classroom demo. For larger deployments or multiple backend workers,
set `GEOCODING_URL` to your own Photon-compatible endpoint. The public demo has no
availability guarantee and may throttle use. Pin placement remains usable when
search is down. Search queries are sent to the configured geocoding service;
photos, memory text and capsule contents are not sent there.

- Photon usage: https://github.com/komoot/photon#demo-server
- Tile policy: https://operations.osmfoundation.org/policies/tiles/

## Checks

- Backend: `cd backend && npm test`
- Frontend: `cd frontend/TimeCapsuleApp && npm test -- --runInBand`
- TypeScript: `cd frontend/TimeCapsuleApp && npx tsc --noEmit`

Backend tests exercise real HTTP handlers with a controlled database adapter,
including save/lock/unlock/reload/map, membership filtering, invalid coordinates,
repeatable additive migrations, and geocoder caching/rate limiting/failure.
Frontend tests execute the generated map JavaScript with a controlled Leaflet/DOM
adapter, verify exact memory links and shared-location popups, safe text handling,
photo previews, pin placement/dragging and repeated memory reloads.

## Device check

1. Create a future capsule. Add two photo memories, using search for one and a
   dropped pin for the other. Try the same location for both as well.
2. Reopen the capsule: it should show its saved count while locked. Neither photo
   should appear on Memory Map yet.
3. Use **Unlock now for testing**, then check both memories and photos.
4. Open Memory Map, tap the pin, and open each linked memory. Verify the selected
   memory label in Capsule Details.
5. Navigate away/back and restart the app; verify memories and pins remain.
6. A different user who is not a capsule member must not see its memories.
7. Disable internet or return an API error; verify the retry messages and that
   the app does not report a failed load as an empty capsule.

Automated checks do not replace the Android/iOS WebView and live MySQL device
check above. No installer, friends-list changes, or account-settings restoration
are included in this feature branch.
