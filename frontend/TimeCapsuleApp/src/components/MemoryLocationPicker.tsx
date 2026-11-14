import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
import { MemoryLocation, validCoordinates } from '../utils/memoryMap';
import MemoryMapView from './MemoryMapView';
type Props = {
  initial: MemoryLocation | null;
  onSave: (location: MemoryLocation) => void;
  onClose: () => void;
};
export default function MemoryLocationPicker({
  initial,
  onSave,
  onClose,
}: Props) {
  const [point, setPoint] = useState(initial);
  // Only recenter after a search; a dropped/dragged pin stays in its current map.
  const [center, setCenter] = useState(initial);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<MemoryLocation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  async function search() {
    const id = ++requestId.current;
    setBusy(true);
    setError('');
    setPlaces([]);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Please log in again.');
      const response = await fetch(
        `${API_BASE_URL}/api/locations/search?q=${encodeURIComponent(
          query.trim(),
        )}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search failed.');
      if (id !== requestId.current) return;
      const results = data.places.filter(validCoordinates);
      setPlaces(results);
      if (!results.length)
        setError('No matching places. Try a nearby place or drop a pin.');
    } catch (e) {
      if (id === requestId.current)
        setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.link}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>PLACE YOUR MEMORY</Text>
        <Text style={styles.hint}>
          Search an address or place, or tap the map and drag the pin.
        </Text>
        <View style={styles.row}>
          <TextInput
            accessibilityLabel="Address or place"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Address or place"
            onSubmitEditing={search}
          />
          <TouchableOpacity
            disabled={busy || query.trim().length < 3}
            onPress={search}
            style={styles.button}
          >
            <Text style={styles.white}>Search</Text>
          </TouchableOpacity>
        </View>
        {busy && <ActivityIndicator />}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.hint}>
            {error}
          </Text>
        )}
        {!!places.length && (
          <ScrollView style={styles.results}>
            {places.map((p, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setPoint(p);
                  setCenter(p);
                  setPlaces([]);
                }}
              >
                <Text style={styles.link}>{p.locationName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <MemoryMapView picking location={center} onLocation={setPoint} />
        <Text style={styles.hint}>
          {point
            ? point.locationName ||
              `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
            : 'No pin selected yet.'}
        </Text>
        <TouchableOpacity
          disabled={!point}
          style={[styles.button, !point && styles.disabled]}
          onPress={() => point && onSave(point)}
        >
          <Text style={styles.white}>USE THIS LOCATION</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: '#E8D8BE' },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#50382B',
    marginVertical: 12,
  },
  hint: { color: '#735641', marginVertical: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFF9F0',
    borderRadius: 8,
    padding: 12,
    color: '#50382B',
  },
  button: {
    backgroundColor: '#735641',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  white: { color: '#fff', fontWeight: '700' },
  link: { color: '#735641', paddingVertical: 12 },
  results: { maxHeight: 150 },
  disabled: { opacity: 0.5 },
});
