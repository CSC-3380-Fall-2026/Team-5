import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

type Props = { title: string; onPress?: () => void; disabled?: boolean };

export default function AppButton({ title, onPress, disabled = false }: Props) {
  return (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}