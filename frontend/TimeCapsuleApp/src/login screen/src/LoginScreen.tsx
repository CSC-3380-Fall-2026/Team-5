
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleLogin = () => {
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>✉</Text>
            </View>

            <Text style={styles.title}>TIME CAPSULE</Text>
            <Text style={styles.subtitle}>
              Memories worth keeping.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.welcome}>Welcome Back!</Text>
            <Text style={styles.description}>
              Sign in to revisit your memories.
            </Text>

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
                placeholder="Enter your password"
                placeholderTextColor="#9A8A7A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="current-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                <Text style={styles.showPassword}>
                  {showPassword ? 'HIDE' : 'SHOW'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
  style={styles.loginButton}
  onPress={handleLogin}
  activeOpacity={0.8}
>
  <Text style={styles.loginButtonText}>LOG IN</Text>
</TouchableOpacity>

{/* Sign Up Link */}
<View
  style={{
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  }}
>
  <Text style={{ color: '#806A58', fontSize: 13 }}>
    Don't have an account?{' '}
  </Text>

  <TouchableOpacity
    onPress={() => navigation.navigate('SignUp')}
  >
    <Text
      style={{
        color: '#735641',
        fontSize: 13,
        fontWeight: '800',
        textDecorationLine: 'underline',
      }}
    >
      Sign Up
    </Text>
  </TouchableOpacity>
</View>

<Text style={styles.footerText}>
  Your memories. Your story. Your time.
</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
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
  welcome: {
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
    marginBottom: 22,
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
    marginBottom: 30,
  },
  passwordInput: {
    flex: 1,
    color: '#3D3028',
    fontSize: 15,
  },
  showPassword: {
    fontSize: 12,
    fontWeight: '700',
    color: '#735641',
    paddingLeft: 10,
  },
  loginButton: {
    backgroundColor: '#735641',
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 12,
    color: '#8D7763',
    fontStyle: 'italic',
  },
});
