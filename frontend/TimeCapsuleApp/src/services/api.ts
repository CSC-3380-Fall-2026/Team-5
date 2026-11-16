import { Platform } from 'react-native';
import { getAuthToken, clearAuthToken } from './authStorage';

export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';

// Reads the saved login token from secure storage.
// CHECK: if LoginScreen saves with a `service` option, use
// Keychain.getGenericPassword({ service: 'same-name' }) instead.
async function getToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('You are not logged in. Please log in again.');
  }
  return token;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/users/me/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unable to change password.');
  }
  return data;
}

export async function updateEmail(newEmail: string, currentPassword: string) {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/users/me/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newEmail, currentPassword }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unable to update email.');
  }
  return data;
}

// Clears the saved login token.
// CHECK: if ProfileScreen's Log Out passes a `service`, pass it here too.
export async function logoutUser() {
  await clearAuthToken();
}

export async function getProfile() {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unable to load profile.');
  }
  return data.user as { name: string; bio: string | null; email: string };
}

export async function updateProfile(name: string, bio: string) {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, bio }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unable to update profile.');
  }
  return data;
}