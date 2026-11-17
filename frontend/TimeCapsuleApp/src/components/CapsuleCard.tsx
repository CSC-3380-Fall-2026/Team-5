import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';

import Card from './Card';
import LockedCapsuleView from './LockedCapsuleView';
import { Capsule } from '../context/CapsuleContext';
import { isCapsuleLocked } from '../utils/capsuleLock';

type CapsuleCardProps = Readonly<{
  capsule: Capsule;
  onPress?: () => void;
}>;

function CapsuleCard({ capsule, onPress }: CapsuleCardProps) {
  // Checks whether this capsule is still locked
  const locked = isCapsuleLocked(capsule.unlockDate);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed && styles.cardPressed,
      ]}
    >
      <Card>
        {locked ? (
          <LockedCapsuleView
            name={capsule.name}
            unlockDate={capsule.unlockDate}
            memoryCount={
              capsule.memoryCount ?? capsule.memories?.length ?? 0
            
          }
          />
        ) : (
          <>
            {/* Capsule name */}
            <Text style={styles.name}>{capsule.name}</Text>

            {/* Unlock date */}
            <Text style={styles.detailText}>
              Opens: {capsule.unlockDate}
            </Text>

            {/* Capsule status */}
            <Text style={styles.status}>Unlocked</Text>
          </>
        )}
        {/* Show friend names for both locked and unlocked capsules. */}
        <Text style={styles.detailText}>
          {capsule.friends.length > 0
            ? 'Friends: ' + capsule.friends.join(', ')
            : 'No friends added'}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 6,
  },

  detailText: {
    fontSize: 14,
    color: '#806A58',
    marginBottom: 4,
  },

  status: {
    marginTop: 8,
    fontWeight: '700',
    color: '#735641',
  },

  cardPressed: {
    opacity: 0.75,
  },
});

export default CapsuleCard;