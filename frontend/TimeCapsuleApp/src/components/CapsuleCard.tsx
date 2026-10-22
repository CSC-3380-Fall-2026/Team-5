import React from 'react';
import { Text, StyleSheet } from 'react-native';

import Card from './Card';
import LockedCapsuleView from './LockedCapsuleView';
import { Capsule } from '../context/CapsuleContext';
import { isCapsuleLocked } from '../utils/capsuleLock';

type CapsuleCardProps = Readonly<{
  capsule: Capsule;
}>;

function CapsuleCard({ capsule }: CapsuleCardProps) {
  const locked = isCapsuleLocked(capsule.unlockDate);

  // Locked: hide the contents and show the locked view
  if (locked) {
    return (
      <Card>
        <LockedCapsuleView name={capsule.name} unlockDate={capsule.unlockDate} />
      </Card>
    );
  }

  // Unlocked: show the normal card
  return (
    <Card>
      {/* Display name */}
      <Text style={styles.name}>{capsule.name}</Text>

      {/* Displays date */}
      <Text>Opens: {capsule.unlockDate}</Text>

      {/* Displays friends*/}
      <Text>Friends: {capsule.friends.length}</Text>

      {/* Shows the current capsule status */}
      <Text style={styles.status}>Unlocked</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  status: {
    marginTop: 8,
    fontWeight: '600',
  },
});

export default CapsuleCard;