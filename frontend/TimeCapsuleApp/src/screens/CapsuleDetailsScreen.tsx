import React, { useState } from 'react';
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

import { isCapsuleLocked } from '../utils/capsuleLock';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { useCapsules } from '../context/CapsuleContext';

function CapsuleDetailsScreen({ route, navigation }: any) {
  const { capsule: routeCapsule } = route.params;
  const { capsules } = useCapsules();

  // Gets the newest version of the capsule from context
  const capsule =
    capsules.find(item => item.id === routeCapsule.id) ?? routeCapsule;

  const memories = capsule.memories ?? [];

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [deleteAfterClose, setDeleteAfterClose] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // Uses the shared capsule 
  // lock helper so every screen follows the same unlock rules
  const isUnlocked = !isCapsuleLocked(capsule.unlockDate);

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
    // Locked capsules only show how many memories were added
    if (!isUnlocked) {
      return (
        <Text style={styles.value}>
          {memories.length} memories added
        </Text>
      );
    }

    // Unlocked capsule with no memories
    if (memories.length === 0) {
      return (
        <Text style={styles.value}>
          No memories were added.
        </Text>
      );
    }

    // Unlocked capsule displays the saved memories and photos
    return memories.map(
      (memory: {
        id: string;
        text: string;
        photoUri: string;
      }) => (
        <View key={memory.id} style={styles.memory}>
          <Text style={styles.memoryText}>
            {memory.text}
          </Text>

          <Image
            source={{ uri: memory.photoUri }}
            style={styles.memoryPhoto}
          />
        </View>
      ),
    );
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
              {isUnlocked ? 'Unlocked' : 'Locked'}
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

          {/* Deletes the capsule */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteConfirmVisible(true)}
          >
            <Text style={styles.deleteButtonText}>
              DELETE CAPSULE
            </Text>
          </TouchableOpacity>
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
});

export default CapsuleDetailsScreen;