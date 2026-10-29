import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
import { clearAuthToken } from '../services/authStorage';

/* Will all needed to be connected to backend */

function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    bio: string | null;
    role: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProfile = async () => {
        setLoading(true);

        try {
          const token = await getAuthToken();

          if (!token) {
            throw new Error('No login session found.');
          }

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
          if (active) setProfile(null);
        } finally {
          if (active) setLoading(false);
        }
      };

      loadProfile();

      return () => {
        active = false;
      };
    }, []),
  );

//no longer displays hardcoded name and email, now displays the name and email of the logged in user. If no user is logged in, it will display "Unable to load profile. Please log in again."
    const fullName = profile?.name || '';
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

    const initials = nameParts
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

  const handleLogout = async () => {
    try {
      await clearAuthToken();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Unable to log out. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : profile ? (
        <>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <Text style={styles.initials}>{initials}</Text>
            </View>

            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>

            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoValue}>
              {profile.bio || 'No bio added yet.'}
            </Text>

            <Text style={styles.infoLabel}>Account Role</Text>
            <Text style={styles.infoValue}>{profile.role}</Text>
          </View>
        </>
      ) : (
        <Text>Unable to load profile. Please log in again.</Text>
      )}

      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />

      <Button
        title="Log Out"
        onPress={handleLogout}
      />

    </ScrollView>

  );

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    },
    title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },

  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  profileImage: {
  width: 120,
  height: 120,
  borderRadius: 60,
  marginBottom: 16,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
},

  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  email: {
    fontSize: 16,
    marginBottom: 12,
  },

  username: {
  fontSize: 16,
  marginBottom: 12,
},
  initials: {
  fontSize: 36,
  fontWeight: '700',
},

infoSection: {
  marginBottom: 30,
},

infoLabel: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 12,
},

infoValue: {
  fontSize: 16,
  marginTop: 4,
},
});
export default ProfileScreen;
