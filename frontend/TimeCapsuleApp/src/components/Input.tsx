import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

function Input(props: Readonly<TextInputProps>) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
});

export default Input;