
export type MemoryLocation = {
  latitude: number;
  longitude: number;
  locationName?: string;
};

export type MapMemory = MemoryLocation & {
  id: string;
  capsuleId: string;
  capsuleName: string;
  opensAt: string;
  text: string;
  photoUri: string;
};

// Make sure a location has valid coordinates.
export function validCoordinates(
  value: unknown,
): value is MemoryLocation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const point = value as MemoryLocation;

  return (
    Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.longitude) <= 180
  );
}

// Safely insert memory data into the map's HTML.
function scriptJSON(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// Build the interactive Leaflet map.
export function buildMemoryMapHTML(
  memories: MapMemory[],
  picking = false,
  location?: MemoryLocation | null,
) {
  return `


<!DOCTYPE html>
<html lang="en">
<head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    /* MAIN MAP */

    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #F8F0E3;
    }

    body {
      font-family: Arial, sans-serif;
    }

    /* MEMORY POPUP */

    .leaflet-popup-content-wrapper {
      background: #FFF9F0;
      border-radius: 18px;
      padding: 0;
      box-shadow: 0 8px 25px rgba(80, 56, 43, 0.20);
    }

    .leaflet-popup-content {
      width: 250px !important;
      max-width: calc(100vw - 90px);
      margin: 0;
    }

    .memory-card {
      padding: 14px;
      box-sizing: border-box;
    }

    .memory-card + .memory-card {
      border-top: 1px solid #E8D8BE;
    }

    /* MEMORY PHOTO */

    .memory-photo {
      display: block;
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 14px;
    }

    /* MEMORY TITLE */

    .memory-title {
      display: block;
      font-size: 17px;
      font-weight: bold;
      color: #50382B;
      line-height: 1.3;
      margin-bottom: 8px;
      overflow-wrap: anywhere;
    }

    /* MEMORY DESCRIPTION */

    .memory-description {
      font-size: 14px;
      color: #806A58;
      line-height: 1.5;
      margin: 0 0 16px;
      overflow-wrap: anywhere;
    }

    /* OPEN MEMORY BUTTON */

    .memory-button {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: #735641;
      color: #FFFFFF;
      border: none;
      border-radius: 9px;
      padding: 13px 10px;
      font-size: 13px;
      font-weight: bold;
      line-height: 1.4;
      text-align: center;
      white-space: normal;
      cursor: pointer;
    }

    .memory-button:active {
      background: #50382B;
    }

    /* POPUP ARROW */

    .leaflet-popup-tip {
      background: #FFF9F0;
    }

    /* MAP LOADING ERROR */

    #error {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 1000;
      background: #FFF9F0;
      color: #50382B;
      padding: 10px;
      max-width: 80%;
      border-radius: 8px;
      font-size: 13px;
    }
  </style>
</head>

<body>
  <div id="map"></div>
  <div id="error" hidden></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    // Data passed from React Native.
    const memories = ${scriptJSON(memories)};
    const picking = ${picking};
    const initial = ${scriptJSON(location ?? null)};

    // Send information back to React Native.
    function send(value) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify(value)
        );
      }
    }

    // Display a map error.
    function showError(message) {
      const element = document.getElementById('error');
      element.hidden = false;
      element.textContent = message;
    }

    // Check that Leaflet loaded.
    if (typeof L === 'undefined') {
      showError('Map could not load. Check your connection.');
      send({ type: 'error' });
    } else {

      // INITIALIZE MAP

      const startingPoint = initial
        ? [initial.latitude, initial.longitude]
        : [30.4515, -91.1871];

      const map = L.map('map').setView(
        startingPoint,
        initial ? 15 : 12
      );

      L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }
      )
      .addTo(map)
      .on('tileerror', function () {
        showError('Map tiles are unavailable.');
      });

      // LOCATION SELECTION

      let draftMarker = initial
        ? L.marker(
            [initial.latitude, initial.longitude],
            { draggable: true }
          ).addTo(map)
        : null;

      function selectLocation(latitude, longitude) {
        if (longitude > 180 || longitude < -180) {
          longitude =
            ((longitude + 180) % 360 + 360) % 360 - 180;
        }

        if (latitude > 90 || latitude < -90) {
          return;
        }

        if (draftMarker) {
          draftMarker.setLatLng([latitude, longitude]);
        } else {
          draftMarker = L.marker(
            [latitude, longitude],
            { draggable: true }
          ).addTo(map);

          attachDragHandler();
        }

        send({
          type: 'location',
          latitude: latitude,
          longitude: longitude
        });
      }

      function attachDragHandler() {
        if (draftMarker) {
          draftMarker.on('dragend', function () {
            const point = draftMarker.getLatLng();

            selectLocation(point.lat, point.lng);
          });
        }
      }

      attachDragHandler();

      // Allow selecting a location by tapping the map.
      if (picking) {
        map.on('click', function (event) {
          selectLocation(
            event.latlng.lat,
            event.latlng.lng
          );
        });
      }

      // GROUP MEMORIES AT THE SAME LOCATION

      const groups = new Map();

      memories.forEach(function (memory) {
        const key =
          memory.latitude + ',' + memory.longitude;

        if (!groups.has(key)) {
          groups.set(key, []);
        }

        groups.get(key).push(memory);
      });

      // CREATE MEMORY POPUPS

      groups.forEach(function (group) {
        const firstMemory = group[0];

        const popup = document.createElement('div');

        group.forEach(function (memory) {
          const card = document.createElement('section');
          card.className = 'memory-card';

          // PHOTO FIRST
          if (
            typeof memory.photoUri === 'string' &&
            (
              /^data:image\\/(jpeg|png|webp|gif);base64,/i
                .test(memory.photoUri) ||
              memory.photoUri.startsWith('https://')
            )
          ) {
            const image = document.createElement('img');

            image.className = 'memory-photo';
            image.src = memory.photoUri;
            image.alt = 'Memory photo';

            card.appendChild(image);
          }

          // MEMORY TITLE
          const title = document.createElement('strong');

          title.className = 'memory-title';
          title.textContent =
            memory.locationName || memory.capsuleName;

          card.appendChild(title);

          // MEMORY DESCRIPTION
          const description = document.createElement('p');

          description.className = 'memory-description';
          description.textContent = memory.text;

          card.appendChild(description);

          // OPEN MEMORY BUTTON
          const button = document.createElement('button');

          button.className = 'memory-button';
          button.textContent = 'Open Memory';

          button.onclick = function () {
            send({
              type: 'open',
              id: memory.id
            });
          };

          card.appendChild(button);

          // Add this memory to the popup.
          popup.appendChild(card);
        });

        // Add the pin and popup to the map.
        L.marker([
          firstMemory.latitude,
          firstMemory.longitude
        ])
        .addTo(map)
        .bindPopup(popup, {
          maxHeight: 320,
          maxWidth: 270,
          autoPan: true,
          keepInView: true
        });
      });

      // SHOW ALL SAVED MEMORY PINS

      if (memories.length && !picking) {
        const bounds = memories.map(function (memory) {
          return [
            memory.latitude,
            memory.longitude
          ];
        });

        map.fitBounds(bounds, {
          padding: [28, 28],
          maxZoom: 15
        });
      }
    }
  </script>
</body>
</html>
`;
}
