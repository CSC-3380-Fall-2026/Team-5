import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../components/Card';

function CapsuleDetailsScreen({ route }: any) {
  // Gets the capsule that was sent to this screen
    const { capsule } = route.params;
    const memories = capsule.memories ?? [];
    const [month, day, year] = capsule.unlockDate.split('/').map(Number);
    const unlockDate = new Date(year, month - 1, day);

    //Checks whether the capsule has reached its unlock date
    const isUnlocked = new Date() >= unlockDate;

    //what is shown in memory section; locked = number; unlocked = lost of mems
    function renderMemories() {
        if (!isUnlocked) {
            return (
            <Text style={styles.value}>
                {memories.length} memories added
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
    </Card>
    
  </View>
);
}


//styles;  update later
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