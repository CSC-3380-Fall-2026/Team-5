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
      <Text style={styles.detailText}>Opens on {unlockDate}</Text>

      {/* Shows how many memories have been added without revealing them */}
      <Text style={styles.detailText}>
        {memoryCount === 1
          ? '1 memory added'
          : `${memoryCount} memories added`}
      </Text>

      {/* Displays the countdown until the unlock date */}
      <Text style={styles.countdown}>
        {days === 1 ? '1 day to go' : `${days} days to go`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 8,
  },

  status: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#735641',
  },

  detailText: {
    fontSize: 14,
    color: '#806A58',
    marginBottom: 4,
  },

  countdown: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4435',
    marginTop: 4,
  },
});
