import React, { useMemo, useState } from 'react';
import {
  Linking,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  buildMemoryMapHTML,
  MapMemory,
  MemoryLocation,
  validCoordinates,
} from '../utils/memoryMap';
const EMPTY: MapMemory[] = [];
type Props = {
  memories?: MapMemory[];
  picking?: boolean;
  location?: MemoryLocation | null;
  onLocation?: (point: MemoryLocation) => void;
  onOpen?: (id: string) => void;
};
export default function MemoryMapView({
  memories = EMPTY,
  picking = false,
  location,
  onLocation,
  onOpen,
}: Props) {
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState(false);
  const source = useMemo(
    () => ({
      html: buildMemoryMapHTML(
        memories.filter(validCoordinates),
        picking,
        location,
      ),
    }),
    [memories, picking, location],
  );
  return (
    <View style={styles.container}>
      <WebView
        key={revision}
        source={source}
        originWhitelist={['*']}
        applicationNameForUserAgent="TimeCapsule-Team5/1.0"
        javaScriptEnabled
        onError={() => setError(true)}
        onShouldStartLoadWithRequest={request => {
          if (
            request.url === 'about:blank' ||
            request.url.startsWith('data:text/html')
          )
            return true;
          if (request.url === 'https://www.openstreetmap.org/copyright')
            Linking.openURL(request.url).catch(() => {});
          return false;
        }}
        onMessage={event => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'error') setError(true);
            if (
              message.type === 'location' &&
              picking &&
              validCoordinates(message)
            )
              onLocation?.({
                latitude: message.latitude,
                longitude: message.longitude,
              });
            if (
              message.type === 'open' &&
              memories.some(m => m.id === message.id)
            )
              onOpen?.(message.id);
          } catch {
            /* Ignore malformed WebView messages. */
          }
        }}
      />
      {error && (
        <TouchableOpacity
          onPress={() => {
            setError(false);
            setRevision(n => n + 1);
          }}
        >
          <Text style={styles.retry}>Map unavailable. Tap to retry.</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 260,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFA88D',
  },
  retry: { padding: 12, color: '#735641', backgroundColor: '#FFF9F0' },
});
