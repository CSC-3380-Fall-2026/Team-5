import React from 'react';
import {View,Text,StyleSheet, TouchableOpacity,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { AndroidWebViewProps } from 'react-native-webview/lib/WebViewTypes';
import type { ComponentType } from 'react';
const AndroidMapWebView = WebView as unknown as ComponentType<AndroidWebViewProps>;

const mapHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0" />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
    }

    #map {
      height: 100%;
      width: 100%;
      background: #F8F0E3;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    const map = L.map('map').setView(
      [30.4515, -91.1871],
      12
    );

    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(map);
    let selectedMarker = null;

  map.on('click', function (event) {
    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;

  if (selectedMarker) {
    map.removeLayer(selectedMarker);
  }

  selectedMarker = L.marker([latitude, longitude])
    .addTo(map)
    .bindPopup('Selected location')
    .openPopup();

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: 'LOCATION_SELECTED',
      latitude,
      longitude,
    })
  );
});
  </script>
</body>
</html>
`;

function MemoryMapScreen({ navigation, route }: any) {
  const isSelectingLocation = route?.params?.mode === 'select';
  const [selectedLocation, setSelectedLocation] = React.useState<{
  latitude: number;
  longitude: number;
} | null>(null);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Page heading */}
        <View style={styles.header}>
          <Text style={styles.title}>MEMORY MAP</Text>

          <Text style={styles.subtitle}>
            See where your favorite memories were made.
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <AndroidMapWebView
            originWhitelist={['*']}
            source={{ html: mapHTML }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(event: WebViewMessageEvent): void => {
          if (!isSelectingLocation) return;

          try {
            const data = JSON.parse(event.nativeEvent.data);


          if (data.type === 'LOCATION_SELECTED') {
            setSelectedLocation({
              latitude: data.latitude,
              longitude: data.longitude,
          });
        }
      } catch (error) {
        console.log('Map message error:', error);
      }
    }}
  />
    </View>
    {isSelectingLocation && (
  <TouchableOpacity
    style={[
      styles.confirmButton,
      !selectedLocation && { opacity: 0.5 },
    ]}
    disabled={!selectedLocation}
    onPress={() => {
      if (!selectedLocation) return;

      route.params?.onSelectLocation?.(selectedLocation);

      navigation.goBack();
    }}
  >
    <Text style={styles.confirmButtonText}>
      CONFIRM LOCATION
    </Text>
  </TouchableOpacity>
)}

        {/* Placeholder content */}
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No memories on the map yet
          </Text>

          <Text style={styles.emptyText}>
            Locations connected to your memories will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8D8BE',
  },

  container: {
    flex: 1,
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },

  backButtonText: {
    color: '#735641',
    fontSize: 16,
    fontWeight: '700',
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#806A58',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  mapContainer: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFA88D',
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F8F0E3',
  },

  map: {
    flex: 1,
  },

  emptyCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#806A58',
    textAlign: 'center',
  },
  confirmButton: {
  backgroundColor: '#735641',
  height: 54,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 16,
},

confirmButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '800',
  letterSpacing: 1,
},
});

export default MemoryMapScreen;