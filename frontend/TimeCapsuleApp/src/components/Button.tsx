import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';

type ButtonProps = Readonly<{
  title: string;
  onPress: (event: GestureResponderEvent) => void;
}>;

function Button({ title, onPress }: ButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default Button;