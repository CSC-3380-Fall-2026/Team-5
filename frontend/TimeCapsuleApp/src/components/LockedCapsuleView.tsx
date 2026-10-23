import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { daysUntilUnlock } from '../utils/capsuleLock';

type Props = Readonly<{
  unlockDate: string;
  name?: string;
  memoryCount: number;
}>;

export default function LockedCapsuleView({
  unlockDate,
  name,
  memoryCount,
}: Props) {
  // Calculates how many days remain before the capsule unlocks
  const days = daysUntilUnlock(unlockDate);

  return (
    <View>
      {/* Displays the capsule name */}
      {name ? <Text style={styles.name}>{name}</Text> : null}

      {/* Shows that the capsule is still locked */}
      <Text style={styles.status}>🔒 This capsule is locked</Text>

      {/* Displays the unlock date */}
      <Text>Opens on {unlockDate}</Text>

      {/* Shows how many memories have been added without revealing them */}
      <Text>
        {memoryCount === 1
          ? '1 memory added'
          : `${memoryCount} memories added`}
      </Text>

      {/* Displays the countdown until the unlock date */}
      <Text>
        {days === 1 ? '1 day to go' : `${days} days to go`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },

  status: {
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '600',
  },
});