import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

type Props = { onSubmit: (email: string, password: string) => void };

export default function LoginForm({ onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setError('');
    onSubmit(email, password);
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text>{error}</Text> : null}
      <TouchableOpacity accessibilityRole="button" onPress={handleSubmit}>
        <Text>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}