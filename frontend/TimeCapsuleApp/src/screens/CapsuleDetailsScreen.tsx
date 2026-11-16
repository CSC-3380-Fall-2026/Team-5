import React, { useCallback, useState } from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {loadCapsuleMemories} from '../services/memories';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
    Modal as ReactNativeModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
import Modal from '../components/Modal';
import Card from '../components/Card';
import {
  Capsule,
  Memory,
  useCapsules,
} from '../context/CapsuleContext';

function CapsuleDetailsScreen({ route, navigation }: any) {
  const { capsule: routeCapsule } = route.params;
  const { capsules, reload } = useCapsules();
  
  // Gets the newest version of the capsule from context
  const capsule: Capsule =
  capsules.find(item => item.id === routeCapsule.id) ?? routeCapsule;

  const [memories, setMemories] = useState<Memory[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [memoryError, setMemoryError] = useState('');
  const [refresh, setRefresh] = useState(0);

  // Replace from the server on focus/unlock; never keep a permanent "already loaded" ID set.
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    let inFlight = false;
    setMemories([]);
    setIsUnlocked(false);
    setLoadingMemories(true);
    setMemoryError('');
    async function load() {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await loadCapsuleMemories(capsule.id, controller.signal);
        if (controller.signal.aborted) return;
        setMemories(result.memories);
        setIsUnlocked(!result.locked);
        setMemoryError('');
      } catch (error) {
        if (!controller.signal.aborted) setMemoryError(error instanceof Error ? error.message : 'Unable to load memories.');
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setLoadingMemories(false);
      }
    }
    load();
    const timer = setInterval(load, 15000);
    return () => {controller.abort(); clearInterval(timer);};
  }, [capsule.id, refresh]));

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [deleteAfterClose, setDeleteAfterClose] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  // Deletes this capsule from the backend
  async function deleteCapsule() {
    try {
      const token = await getAuthToken();

      if (!token) {
        setModalTitle('Login Required');
        setModalMessage(
          'Please log in again before deleting this capsule.',
        );
        setModalVisible(true);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/capsules/${capsule.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setModalTitle('Delete Failed');
        setModalMessage(
          data.error || 'Unable to delete capsule.',
        );
        setModalVisible(true);
        return;
      }

      setModalTitle('Capsule Deleted');
      setModalMessage('This capsule has been deleted.');
      setDeleteAfterClose(true);
      setModalVisible(true);
    } catch (error) {
      console.error('Capsule deletion error:', error);

      setModalTitle('Connection Error');
      setModalMessage(
        'Could not connect to the Time Capsule server.',
      );
      setModalVisible(true);
    }
  }

  // Controls what is shown in the memories section
  function renderMemories() {
    if (loadingMemories) return <Text style={styles.value}>Loading memories...</Text>;
    if (memoryError) return <TouchableOpacity onPress={() => setRefresh(n => n + 1)}><Text style={styles.value}>{memoryError} Tap to retry.</Text></TouchableOpacity>;
    if (!isUnlocked) {
      return (
        <Text style={styles.value}>
          {capsule.memoryCount ?? memories.length} memories added
        </Text>
      );
    }

    if (memories.length === 0) {
      return (
        <Text style={styles.value}>
          No memories were added.
        </Text>
      );
    }

    const ordered = [...memories].sort((a, b) => Number(b.id === route.params.memoryId) - Number(a.id === route.params.memoryId));
    return ordered.map(memory => (
      <View key={memory.id} style={styles.memory}>
        {memory.id === route.params.memoryId && <Text style={styles.label}>SELECTED MAP MEMORY</Text>}
        {!!memory.locationName && <Text style={styles.value}>{memory.locationName}</Text>}
        <Text style={styles.memoryText}>
          {memory.text}
        </Text>

        {memory.photoUri ? (
          <Image
            source={{ uri: memory.photoUri }}
            style={styles.memoryPhoto}
          />
        ) : null}
      </View>
    ));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('MyCapsules')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Page heading */}
        <View style={styles.header}>
          <Text style={styles.title}>
            CAPSULE DETAILS
          </Text>

          <Text style={styles.subtitle}>
            A look inside your saved memory.
          </Text>
        </View>

        <Card>
          {/* Capsule name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              CAPSULE NAME
            </Text>

            <Text style={styles.value}>
              {capsule.name}
            </Text>
          </View>

          {/* Unlock date */}
          <View style={styles.section}>
            <Text style={styles.label}>
              UNLOCK DATE
            </Text>

            <Text style={styles.value}>
              {capsule.unlockDate}
            </Text>
          </View>

          {/* Capsule status */}
          <View style={styles.section}>
            <Text style={styles.label}>
              STATUS
            </Text>

            <Text
              style={[
                styles.value,
                styles.statusText,
              ]}
            >
              {loadingMemories ? 'Checking...' : isUnlocked ? 'Unlocked' : 'Locked'}
            </Text>
          </View>

          {/* Friends */}
          <View style={styles.section}>
            <Text style={styles.label}>
              FRIENDS
            </Text>

            {capsule.friends.length === 0 ? (
              <Text style={styles.value}>
                No friends added
              </Text>
            ) : (
              <View style={styles.friendList}>
                {capsule.friends.map(
                  (friend: string) => (
                    <View
                      key={friend}
                      style={styles.friendChip}
                    >
                      <Text style={styles.friendText}>
                        {friend}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            )}
          </View>

          {/* Memories */}
          <View style={styles.section}>
            <Text style={styles.label}>
              MEMORIES
            </Text>

            {renderMemories()}
          </View>
          

          {/* Opens Add Memory */}
          {!loadingMemories && !memoryError && !isUnlocked && (
            <TouchableOpacity
              style={styles.addMemoryButton}
              onPress={() =>
                navigation.navigate('AddMemory', {
                  capsule,
                })
              }
            >
              <Text style={styles.addMemoryButtonText}>
                ADD MEMORY
              </Text>
            </TouchableOpacity>
          )}

          {/* Deletes the capsule */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteConfirmVisible(true)}
          >
            <Text style={styles.deleteButtonText}>
              DELETE CAPSULE
            </Text>
          </TouchableOpacity>
          {!loadingMemories && !memoryError && !isUnlocked && (
      <TouchableOpacity
        style={styles.testUnlockLink}
        onPress={async () => {
          try {
            const token = await getAuthToken();

            if (!token) {
              return;
            }

            const response = await fetch(
              `${API_BASE_URL}/api/capsules/${capsule.id}/unlock-now`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            const data = await response.json();

            if (!response.ok) {
              console.error(
                'Unable to unlock capsule:',
                data.error,
              );
              return;
            }

            await reload();
            setRefresh(n => n + 1);
          } catch (error) {
            console.error(
              'Unlock capsule error:',
              error,
            );
          }
        }}
      >
    <Text style={styles.testUnlockLinkText}>
      Unlock now for testing
    </Text>
  </TouchableOpacity>
)}
        </Card>

        <Modal
          visible={modalVisible}
          title={modalTitle}
          onClose={() => {
            setModalVisible(false);

            if (deleteAfterClose) {
              setDeleteAfterClose(false);
              navigation.navigate('MyCapsules');
            }
          }}
        >
          <Text style={styles.modalMessage}>
            {modalMessage}
          </Text>
        </Modal>
        <ReactNativeModal
  visible={deleteConfirmVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setDeleteConfirmVisible(false)}
>
  <View style={styles.confirmOverlay}>
    <View style={styles.confirmBox}>
      <Text style={styles.confirmTitle}>
        Delete Capsule
      </Text>

      <Text style={styles.confirmMessage}>
        Are you sure you want to delete this capsule?
      </Text>

      <View style={styles.confirmButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setDeleteConfirmVisible(false)}
        >
          <Text style={styles.cancelButtonText}>
            CANCEL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmDeleteButton}
          onPress={() => {
            setDeleteConfirmVisible(false);
            deleteCapsule();
          }}
        >
          <Text style={styles.confirmDeleteButtonText}>
            DELETE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</ReactNativeModal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main page
  safeArea: {
    flex: 1,
    backgroundColor: '#E8D8BE',
  },

  container: {
    flex: 1,
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  // Back navigation
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

  // Page heading
  header: {
    alignItems: 'center',
    marginBottom: 26,
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

  // Information sections
  section: {
    marginBottom: 22,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4435',
    letterSpacing: 1,
    marginBottom: 7,
  },

  value: {
    fontSize: 16,
    color: '#806A58',
  },

  statusText: {
    fontWeight: '700',
    color: '#735641',
  },

  // Friend chips
  friendList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  friendChip: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  friendText: {
    color: '#50382B',
    fontSize: 14,
    fontWeight: '600',
  },

  // Memories
  memory: {
    marginBottom: 20,
  },

  memoryText: {
    fontSize: 16,
    color: '#806A58',
    marginBottom: 8,
  },

  memoryPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },

  // Add memory button
  addMemoryButton: {
    backgroundColor: '#735641',
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  addMemoryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Delete capsule button
  deleteButton: {
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A66A5A',
    backgroundColor: '#FFF9F0',
  },

  deleteButtonText: {
    color: '#A64B3C',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  modalMessage: {
    fontSize: 15,
    color: '#806A58',
    lineHeight: 22,
  },
  confirmOverlay: {
  flex: 1,
  backgroundColor: 'rgba(61, 48, 40, 0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
},

confirmBox: {
  width: '85%',
  backgroundColor: '#F8F0E3',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#BFA88D',
  padding: 24,
},

confirmTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: '#50382B',
  marginBottom: 12,
  textAlign: 'center',
},

confirmMessage: {
  fontSize: 15,
  color: '#806A58',
  lineHeight: 22,
  textAlign: 'center',
  marginBottom: 22,
},

confirmButtons: {
  flexDirection: 'row',
  gap: 12,
},

cancelButton: {
  flex: 1,
  height: 48,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#BFA88D',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFF9F0',
},

cancelButtonText: {
  color: '#735641',
  fontSize: 14,
  fontWeight: '800',
},

confirmDeleteButton: {
  flex: 1,
  height: 48,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#A64B3C',
},

confirmDeleteButtonText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '800',
},
testUnlockButton: {
  height: 48,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#BFA88D',
  backgroundColor: '#FFF9F0',
},

testUnlockButtonText: {
  color: '#735641',
  fontSize: 14,
  fontWeight: '800',
  letterSpacing: 1,
},
testUnlockLink: {
  alignSelf: 'center',
  marginTop: 10,
  paddingVertical: 4,
},

testUnlockLinkText: {
  color: '#806A58',
  fontSize: 12,
  textDecorationLine: 'underline',
},
});

export default CapsuleDetailsScreen;