import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  changePassword,
  updateEmail,
  logoutUser,
  getProfile,
  updateProfile,
} from '../services/api';

function SettingsScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Pre-fill the form with the current name and bio.
  useEffect(() => {
    getProfile()
      .then((user) => {
        setName(user.name);
        setBio(user.bio ?? '');
      })
      .catch((error: any) => setProfileError(error.message))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleUpdateProfile = async () => {
    setProfileError(null);

    if (!name.trim()) {
      return setProfileError('Name cannot be empty.');
    }
    if (name.trim().length > 100) {
      return setProfileError('Name must be 100 characters or fewer.');
    }
    if (bio.length > 500) {
      return setProfileError('Bio must be 500 characters or fewer.');
    }

    setProfileSaving(true);
    try {
      await updateProfile(name.trim(), bio.trim());
      Alert.alert('Success', 'Your profile was updated.');
    } catch (error: any) {
      setProfileError(error.message || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };
  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Update email form
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPasswordError('Please fill in all fields.');
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      return setPasswordError('New password must be 8 to 72 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match.');
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password was updated.');
    } catch (error: any) {
      setPasswordError(error.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailError(null);

    if (!newEmail.trim() || !emailPassword) {
      return setEmailError('Enter your new email and current password.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      return setEmailError('Please enter a valid email address.');
    }

    setEmailSaving(true);
    try {
      await updateEmail(newEmail.trim(), emailPassword);
      setNewEmail('');
      setEmailPassword('');
      Alert.alert('Success', 'Your email was updated.');
    } catch (error: any) {
      setEmailError(error.message || 'Unable to update email.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    // CHECK: use the same route name your Profile screen navigates to
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>SETTINGS</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          {profileLoading ? (
            <ActivityIndicator color="#735641" />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#9A8672"
                maxLength={100}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Bio"
                placeholderTextColor="#9A8672"
                multiline
                maxLength={500}
                value={bio}
                onChangeText={setBio}
              />
              <Text style={styles.counterText}>{bio.length}/500</Text>
              {profileError && (
                <Text style={styles.errorText}>{profileError}</Text>
              )}
              <TouchableOpacity
                style={[styles.button, profileSaving && styles.buttonDisabled]}
                onPress={handleUpdateProfile}
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>SAVE PROFILE</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
        {/* Change password */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor="#9A8672"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#9A8672"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#9A8672"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          <TouchableOpacity
            style={[styles.button, passwordSaving && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={passwordSaving}
          >
            {passwordSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>UPDATE PASSWORD</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Update email */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update Email</Text>
          <TextInput
            style={styles.input}
            placeholder="New email"
            placeholderTextColor="#9A8672"
            autoCapitalize="none"
            keyboardType="email-address"
            value={newEmail}
            onChangeText={setNewEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor="#9A8672"
            secureTextEntry
            value={emailPassword}
            onChangeText={setEmailPassword}
          />
          {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          <TouchableOpacity
            style={[styles.button, emailSaving && styles.buttonDisabled]}
            onPress={handleUpdateEmail}
            disabled={emailSaving}
          >
            {emailSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>UPDATE EMAIL</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 18,
  },
  backButtonText: {
    color: '#735641',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#F8F0E3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9B08F',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9B08F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#50382B',
  },
  errorText: {
    color: '#B3261E',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#735641',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#B3261E',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#B3261E',
    fontWeight: '700',
    letterSpacing: 1,
  },
   bioInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  counterText: {
    color: '#9A8672',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
});

export default SettingsScreen;