import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MemoryMapView from '../components/MemoryMapView';
import { MapMemory } from '../utils/memoryMap';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
import { useCapsules } from '../context/CapsuleContext';

function MemoryMapScreen({ navigation }: any) {
  const { capsules } = useCapsules();
  const [memories, setMemories] = useState<MapMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      let inFlight = false;
      setMemories([]);
      setLoading(true);
      setError('');
      async function load() {
        if (inFlight) return;
        inFlight = true;
        try {
          const token = await getAuthToken();
          if (!token) throw new Error('Please log in again.');
          const response = await fetch(`${API_BASE_URL}/api/memories/map`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || 'Unable to load map memories.');
          if (!controller.signal.aborted) {
            setMemories(data.memories);
            setError('');
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            setMemories([]);
            setError(
              e instanceof Error ? e.message : 'Unable to load memories.',
            );
          }
        } finally {
          inFlight = false;
          if (!controller.signal.aborted) setLoading(false);
        }
      }
      load();
      const timer = setInterval(load, 30000);
      return () => {
        controller.abort();
        clearInterval(timer);
      };
    }, [revision]),
  );
  function openMemory(id: string) {
    const memory = memories.find(m => m.id === id);
    if (!memory) return;
    const capsule = capsules.find(c => c.id === memory.capsuleId) ?? {
      id: memory.capsuleId,
      name: memory.capsuleName,
      unlockDate: memory.opensAt,
      friends: [],
    };
    navigation.navigate('CapsuleDetails', { capsule, memoryId: id });
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.title}>MEMORY MAP</Text>
          <Text style={styles.subtitle}>
            See where your favorite memories were made.
          </Text>
        </View>
        <View style={styles.mapContainer}>
          <MemoryMapView memories={memories} onOpen={openMemory} />
        </View>
        {loading ? (
          <ActivityIndicator color="#735641" />
        ) : error ? (
          <TouchableOpacity onPress={() => setRevision(n => n + 1)}>
            <Text style={styles.emptyText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {memories.length
                ? `${memories.length} memories on the map`
                : 'No opened memories on the map yet'}
            </Text>
            <Text style={styles.emptyText}>
              {memories.length
                ? 'Tap a pin to see photos and open the linked memory.'
                : 'Add a location when saving a memory. Its photo and pin appear after the capsule opens.'}
            </Text>
          </View>
        )}
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
    marginBottom: 14,
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
});

export default MemoryMapScreen;
