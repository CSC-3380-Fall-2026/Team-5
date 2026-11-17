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
import MemoryLocationPicker from '../components/MemoryLocationPicker';
import {
  MapMemory,
  MemoryLocation,
  validCoordinates,
} from '../utils/memoryMap';
import { useCapsules } from '../context/CapsuleContext';
import { getAuthToken } from '../services/authStorage';
import { API_BASE_URL } from '../services/api';

function MemoryMapScreen({ navigation, route }: any) {
  const isSelectingLocation = route?.params?.mode === 'select';

  const { capsules } = useCapsules();

  const [memories, setMemories] = useState<MapMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void revision;
      if (isSelectingLocation) {
        return;
      }

      let active = true;

      async function loadMemories() {
        setLoading(true);
        setError('');

        try {
          const token = await getAuthToken();

          if (!token) {
            throw new Error(
              'Please log in again to view your memories.',
            );
          }

          const response = await fetch(
            `${API_BASE_URL}/api/memories/map`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.error || 'Unable to load the Memory Map.',
            );
          }

          const loadedMemories: MapMemory[] = Array.isArray(
            data.memories,
          )
            ? data.memories.filter(validCoordinates)
            : [];

          if (active) {
            setMemories(loadedMemories);
          }
        } catch (err) {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load the Memory Map.',
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

  loadMemories().catch(err => {
    if (active) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the Memory Map.',
      );
      setLoading(false);
    }
  });
      return () => {
        active = false;
      };
    }, [isSelectingLocation, revision]),
  );

  // Use the existing searchable location picker
  // when adding a location to a memory.
  if (isSelectingLocation) {
    return (
      <MemoryLocationPicker
        initial={null}
        onClose={() => navigation.goBack()}
        onSave={(location: MemoryLocation) => {
          route.params?.onSelectLocation?.(location);
          navigation.goBack();
        }}
      />
    );
  }

  function openMemory(memoryId: string) {
    const memory = memories.find(item => item.id === memoryId);

    if (!memory) {
      return;
    }

    const capsule = capsules.find(
      item => item.id === memory.capsuleId,
    );

    if (capsule) {
      navigation.navigate('CapsuleDetails', {
        capsule,
        memoryId,
      });
    } else {
      setError(
        'Could not find this capsule. Return to My Capsules and refresh.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            ← Back
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            MEMORY MAP
          </Text>

          <Text style={styles.subtitle}>
            See where your favorite memories were made.
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <MemoryMapView
            memories={memories}
            onOpen={openMemory}
          />
        </View>

        {loading ? (
          <View style={styles.statusCard}>
            <ActivityIndicator color="#735641" />
            <Text style={styles.emptyText}>
              Loading your memories...
            </Text>
          </View>
        ) : error ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => setRevision(n => n + 1)}
          >
            <Text style={styles.emptyTitle}>
              Unable to load memories
            </Text>
            <Text style={styles.emptyText}>
              {error}
            </Text>
            <Text style={styles.retryText}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {memories.length > 0
                ? `${memories.length} memories on the map`
                : 'No opened memories on the map yet'}
            </Text>

            <Text style={styles.emptyText}>
              {memories.length > 0
                ? 'Tap a pin to view photos and open the linked memory.'
                : 'Add a location when saving a memory. Its pin will appear after the capsule unlocks.'}
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
    minHeight: 260,
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#F8F0E3',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#806A58',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#735641',
    fontWeight: '700',
    marginTop: 10,
  },
});

export default MemoryMapScreen;
