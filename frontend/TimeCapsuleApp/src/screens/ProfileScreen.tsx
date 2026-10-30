import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { API_BASE_URL } from '../services/api';
import {
  getAuthToken,
  clearAuthToken,
} from '../services/authStorage';

// Defines the profile information returned by the backend
type Profile = {
  name: string;
  email: string;
  bio: string | null;
  role: string;
};

function ProfileScreen({ navigation }: any) {
  // Stores the logged-in user's profile information
  const [profile, setProfile] = useState<Profile | null>(null);

  // Tracks whether profile data is currently loading
  const [loading, setLoading] = useState(true);

  // Loads the user's profile whenever this screen becomes active
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        setLoading(true);

        try {
          // Gets the saved login token
          const token = await getAuthToken();

          if (!token) {
            throw new Error('No login session found.');
          }

          // Requests the logged-in user's profile from the backend
          const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Unable to retrieve profile.');
          }

          const data = await response.json();

          if (active) {
            setProfile(data.user);
          }
        } catch (error) {
          console.error('Profile error:', error);

          if (active) {
            setProfile(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadProfile().catch(error => {
      console.error('Profile load error:', error);
    });

      // Prevents state updates if the user leaves the screen
      return () => {
        active = false;
      };
    }, []),
  );

  // Creates initials from the user's full name
  const fullName = profile?.name || '';

  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials = nameParts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  // Logs the user out and returns them to the login screen
  async function handleLogout() {
    try {
      await clearAuthToken();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);

      Alert.alert(
        'Error',
        'Unable to log out. Please try again.',
      );
    }
  }

  // Controls what is displayed while loading or after loading
  function renderProfileContent() {
    if (loading) {
      return (
        <ActivityIndicator
          size="large"
          color="#735641"
          style={styles.loading}
        />
      );
    }

    if (!profile) {
      return (
        <Text style={styles.errorText}>
          Unable to load profile. Please log in again.
        </Text>
      );
    }

    return (
      <>
        {/* Main profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <Text style={styles.initials}>
              {initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {profile.name}
          </Text>

          <Text style={styles.email}>
            {profile.email}
          </Text>
        </View>

        {/* Account information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            ACCOUNT INFORMATION
          </Text>

          <Text style={styles.infoLabel}>
            EMAIL
          </Text>

          <Text style={styles.infoValue}>
            {profile.email}
          </Text>

          <Text style={styles.infoLabel}>
            BIO
          </Text>

          <Text style={styles.infoValue}>
            {profile.bio || 'No bio added yet.'}
          </Text>

          <Text style={styles.infoLabel}>
            ACCOUNT ROLE
          </Text>

          <Text style={styles.infoValue}>
            {profile.role}
          </Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Page title */}
        <Text style={styles.title}>
          PROFILE
        </Text>

        {renderProfileContent()}

        {/* Profile navigation buttons */}
        <View style={styles.buttonSection}>
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.secondaryButtonText}>SETTINGS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>LOG OUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main page
  safeArea: {
    flex: 1,
    backgroundColor: '#E8D8BE',
  },

  container: {
    flex: 1,
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
  },

  // Loading and errors
  loading: {
    marginVertical: 30,
  },

  errorText: {
    color: '#806A58',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 30,
  },

  // Main profile information
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#735641',
    borderWidth: 2,
    borderColor: '#5B4435',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  initials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF5E8',
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 6,
  },

  email: {
    fontSize: 15,
    color: '#806A58',
  },

  // Account information card
  infoSection: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 1,
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4435',
    letterSpacing: 1,
    marginTop: 14,
  },

  infoValue: {
    fontSize: 15,
    color: '#806A58',
    marginTop: 4,
  },

  // Buttons
 buttonSection: {
  marginBottom: 30,
  gap: 18,
},

  buttonSpacing: {
    height: 12,
  },

secondaryButton: {
  backgroundColor: '#F8F0E3',
  borderWidth: 1,
  borderColor: '#BFA88D',
  height: 54,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

secondaryButtonText: {
  color: '#50382B',
  fontSize: 15,
  fontWeight: '800',
  letterSpacing: 1,
},

logoutButton: {
  backgroundColor: '#735641',
  height: 54,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

logoutButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '800',
  letterSpacing: 1,
},
backButton: {
  alignSelf: 'flex-start',
  marginTop: 8,
  marginBottom: 8,
},

backButtonText: {
  color: '#735641',
  fontSize: 16,
  fontWeight: '700',
},
});

export default ProfileScreen;