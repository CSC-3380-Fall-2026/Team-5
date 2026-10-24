import React from 'react';
import { Text, StyleSheet } from 'react-native';

import Card from './Card';
import { Capsule } from '../context/CapsuleContext';

type CapsuleCardProps = Readonly<{
  capsule: Capsule;
}>;

function CapsuleCard({ capsule }: CapsuleCardProps) {
  return (
    <Card>
      {/* Display name */}
      <Text style={styles.name}>{capsule.name}</Text>

      {/* Displays date */}
      <Text>Opens: {capsule.unlockDate}</Text>

      {/* Displays friends*/}
      <Text>Friends: {capsule.friends.length}</Text>

      {/* Shows the current capsule status */}
      <Text style={styles.status}>Locked</Text>
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