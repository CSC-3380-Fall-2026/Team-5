import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

import Card from '../components/Card';

function CapsuleDetailsScreen({ route, navigation }: any) {
  const { capsule } = route.params;
  const memories = capsule.memories ?? [];
  const [month, day, year] = capsule.unlockDate.split('/').map(Number);
  const unlockDate = new Date(year, month - 1, day);
  const isUnlocked = new Date() >= unlockDate;

  // Controls what is shown in the memory section
  function renderMemories() {
    // If locked, only show the number of memories
    if (!isUnlocked) {
      return (
        <Text style={styles.value}>
          {memories.length} memories added
        </Text>
      );
    }

    // If unlocked but empty
    if (memories.length === 0) {
      return (
        <Text style={styles.value}>
          No memories were added.
        </Text>
      );
    }

    // If unlocked, show the actual memories
    return memories.map((memory: { id: string; text: string }) => (
      <Text key={memory.id} style={styles.value}>
        • {memory.text}
      </Text>
    ));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capsule Details</Text>

      <Card>
        {/* Displays the capsule name */}
        <View style={styles.section}>
          <Text style={styles.label}>Capsule Name</Text>
          <Text style={styles.value}>{capsule.name}</Text>
        </View>

        {/* Displays the unlock date */}
        <View style={styles.section}>
          <Text style={styles.label}>Unlock Date</Text>
          <Text style={styles.value}>{capsule.unlockDate}</Text>
        </View>

        {/* Displays whether the capsule is locked */}
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>
            {isUnlocked ? 'Unlocked' : 'Locked'}
          </Text>
        </View>

        {/* Displays friends */}
        <View style={styles.section}>
          <Text style={styles.label}>Friends</Text>

          {capsule.friends.length === 0 ? (
            <Text style={styles.value}>No friends added</Text>
          ) : (
            capsule.friends.map((friend: string) => (
              <Text key={friend} style={styles.value}>
                • {friend}
              </Text>
            ))
          )}
        </View>

        {/* Displays memory count or memories */}
        <View style={styles.section}>
          <Text style={styles.label}>Memories</Text>
          {renderMemories()}
        </View>

        {/* Opens the Add Memory screen for this capsule */}
        <Button
          title="Add Memory"
          onPress={() =>
            navigation.navigate('AddMemory', { capsule })
          }
        />
      </Card>
    </View>
  );
}

// Styles; can be updated later
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },

  section: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },

  value: {
    fontSize: 16,
  },
});

export default CapsuleDetailsScreen;