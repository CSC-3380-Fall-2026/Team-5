import React from 'react';
import { View, Text } from 'react-native';
import { daysUntilUnlock } from '../utils/capsuleLock';

type Props = { unlockDate: string; name?: string };

export default function LockedCapsuleView({ unlockDate, name }: Props) {
  const days = daysUntilUnlock(unlockDate);
  return (
    <View>
      {name ? <Text>{name}</Text> : null}
      <Text>🔒 This capsule is locked</Text>
      <Text>Opens on {unlockDate}</Text>
      <Text>{days === 1 ? '1 day to go' : `${days} days to go`}</Text>
    </View>
  );
}