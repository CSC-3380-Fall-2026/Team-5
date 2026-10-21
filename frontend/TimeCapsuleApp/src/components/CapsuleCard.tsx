import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Card from './Card';
import { Capsule } from '../context/CapsuleContext';

type CapsuleCardProps = Readonly<{
  capsule: Capsule;
  onPress?: () => void;
}>;

function CapsuleCard({ capsule, onPress }: CapsuleCardProps) {  
  const [month, day, year] = capsule.unlockDate.split('/').map(Number);
  const unlockDate = new Date(year, month - 1, day);
  const isUnlocked = new Date() >= unlockDate;

  return (
    <Pressable onPress={onPress}>
    <Card>
      {/* Display name */}
      <Text style={styles.name}>{capsule.name}</Text>

      {/* Displays date */}
      <Text>Opens: {capsule.unlockDate}</Text>

      {/* Displays friends*/}
      <Text>Friends: {capsule.friends.length}</Text>

      {/* Shows the current capsule status */}
      <Text style={styles.status}>
        {isUnlocked ? 'Unlocked' : 'Locked'}
      </Text>   
      </Card>
    </Pressable>
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