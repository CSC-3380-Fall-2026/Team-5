import React from 'react';
import {View,Text,StyleSheet,Image,ScrollView,TouchableOpacity,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../components/Card';

function CapsuleDetailsScreen({ route, navigation }: any) {
  const { capsule } = route.params;
  const memories = capsule.memories ?? [];

  // Converts the saved unlock date into a Date object
  const [month, day, year] = capsule.unlockDate
    .split('/')
    .map(Number);

  const unlockDate = new Date(year, month - 1, day);

  // Checks whether the capsule has reached its unlock date
  const isUnlocked = new Date() >= unlockDate;

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
        </Card>
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
});

export default CapsuleDetailsScreen;