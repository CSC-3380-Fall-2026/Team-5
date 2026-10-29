import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


const handleSignUp = async () => {
  if (!name.trim() || !email.trim() || !password || !confirmPassword) {
    Alert.alert('Missing Information', 'Please complete all fields.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    Alert.alert('Invalid Email', 'Please enter a valid email address.');
    return;
  }

  if (password.length < 8 || password.length > 72) {
    Alert.alert('Invalid Password', 'Password must be 8–72 characters.');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Password Mismatch', 'Your passwords do not match.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert('Sign Up Failed', data.error || 'Unable to create account.');
      return;
    }

    Alert.alert('Account Created', 'You can now log in.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  } catch (error) {
    console.error('Signup error:', error);
    Alert.alert('Connection Error', 'Could not connect to the server.');
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
>   
          <View style={styles.card}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>✉</Text>
            </View>

            <Text style={styles.title}>TIME CAPSULE</Text>
            <Text style={styles.subtitle}>
              Start collecting your memories.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.description}>
              Your story starts here.
            </Text>

            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9A8A7A"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9A8A7A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#9A8A7A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showText}>
                  {showPassword ? 'HIDE' : 'SHOW'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#9A8A7A"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
            />

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpButtonText}>
                CREATE ACCOUNT
              </Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
      </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8D8BE',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#F8F0E3',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderWidth: 2,
    borderColor: '#735641',
    elevation: 4,
  },
  logoCircle: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#735641',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  logoIcon: {
    fontSize: 36,
    color: '#FFF5E8',
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: '#50382B',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#806A58',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#C5AC90',
    marginVertical: 26,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#50382B',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#806A58',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4435',
    letterSpacing: 1,
    marginBottom: 9,
  },
  input: {
    height: 52,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#3D3028',
    fontSize: 15,
    marginBottom: 20,
  },
  passwordContainer: {
    height: 52,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    color: '#3D3028',
    fontSize: 15,
  },
  showText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#735641',
    paddingLeft: 10,
  },
  signUpButton: {
    backgroundColor: '#735641',
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#806A58',
    fontSize: 13,
  },
  footerLink: {
    color: '#735641',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});