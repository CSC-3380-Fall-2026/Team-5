import React, { useEffect, useState } from 'react';import {View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCapsules } from '../context/CapsuleContext';
import Modal from '../components/Modal';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';

type RegisteredUser = {
  id: string;
  name: string;
  bio: string | null;
};

function CreateCapsuleScreen({ navigation }: any) {  const [capsuleName, setCapsuleName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState<RegisteredUser[]>([]);
  const [searchResults, setSearchResults] = useState<RegisteredUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const { addCapsule } = useCapsules();

  // allows only valid month, day, and year inputs to be entered
  function handleMonth(text: string) {
    const numbersOnly = text.replace(/\D/g, '');

    if (numbersOnly === '' || Number(numbersOnly) <= 12) {
      setMonth(numbersOnly);
    }
  }

  function handleDay(text: string) {
    const numbersOnly = text.replace(/\D/g, '');

    if (numbersOnly === '' || Number(numbersOnly) <= 31) {
      setDay(numbersOnly);
    }
  }

  function handleYear(text: string) {
    const numbersOnly = text.replace(/\D/g, '');

    if (
      numbersOnly === '' ||
      numbersOnly.length < 4 ||
      Number(numbersOnly) > 2025
    ) {
      setYear(numbersOnly);
    }
  }

// Search registered users as the user types
useEffect(() => {
  const search = friendInput.trim();

  if (!search) {
    setSearchResults([]);
    setSearching(false);
    return;
  }

  let cancelled = false;

  const timer = setTimeout(async () => {
    setSearching(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Not logged in');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/users/discover?search=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Unable to search users');
      }

      const data = await response.json();

      if (!cancelled) {
        setSearchResults(data.users ?? []);
      }
    } catch (error) {
      console.error('Friend search error:', error);

      if (!cancelled) {
        setSearchResults([]);
      }
    } finally {
      if (!cancelled) {
        setSearching(false);
      }
    }
  }, 300);

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}, [friendInput]);

// Add a registered user to the selected friends
function addFriend(user: RegisteredUser) {
  setFriends(current =>
    current.some(friend => friend.id === user.id)
      ? current
      : [...current, user],
  );

  setFriendInput('');
  setSearchResults([]);
}

// Remove a selected friend
function removeFriend(userId: string) {
  setFriends(current =>
    current.filter(friend => friend.id !== userId),
  );
}



  // Makes sure all required capsule fields are filled in
async function createCapsule() {
  // Makes sure all required capsule fields are filled in
  if (
    capsuleName.trim() === '' ||
    month === '' ||
    day === '' ||
    year === ''
  ) {
    setModalTitle('Missing Information');
    setModalMessage('Please complete all required fields.');
    setModalVisible(true);
    return;
  }

  // Makes sure the unlock date is after today
  const selectedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate <= today) {
    setModalTitle('Invalid Unlock Date');
    setModalMessage('Unlock date must be after today.');
    setModalVisible(true);
    return;
  }

  try {
    // Gets the saved login token so the backend knows which user is creating the capsule
    const token = await getAuthToken();

    // Stops creation if the user is no longer logged in
    if (!token) {
      setModalTitle('Login Required');
      setModalMessage('Please log in again before creating a capsule.');
      setModalVisible(true);
      return;
    }

    // Converts the entered month/day/year into the format MySQL expects
const opensAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;

    // Sends the new capsule information to the backend
    const response = await fetch(`${API_BASE_URL}/api/capsules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
      title: capsuleName.trim(),
      description: null,
      opensAt,
      friendIds: friends.map(friend => friend.id),
    }),
    });

    // Reads the response returned from the backend
    const data = await response.json();

    // Shows an error if the backend could not create the capsule
    if (!response.ok) {
      setModalTitle('Capsule Creation Failed');
      setModalMessage(data.error || 'Unable to create capsule.');
      setModalVisible(true);
      return;
    }

    // Creates the frontend version of the capsule using the ID from MySQL
    const newCapsule = {
      id: data.capsule.id,
      name: data.capsule.title,
      unlockDate: `${month}/${day}/${year}`,
      friends: friends.map(friend => friend.name),
    };

    // Adds the capsule to the current app state so it appears immediately
    addCapsule(newCapsule);

    // Shows a success message after the capsule is created
    setModalTitle('Capsule Created');
    setModalMessage(
      `${capsuleName}\n${month}/${day}/${year}\nFriends: ${friends.map(friend => friend.name).join(', ')}`,
    );
    setModalVisible(true);

    // Clears the form after successful creation
    setCapsuleName('');
    setMonth('');
    setDay('');
    setYear('');
    setFriendInput('');
    setFriends([]);
  } catch (error) {
    console.error('Capsule creation error:', error);

    // Shows an error if the app cannot connect to the backend
    setModalTitle('Connection Error');
    setModalMessage('Could not connect to the Time Capsule server.');
    setModalVisible(true);
  }
}
 return (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('MyCapsules')}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>CREATE CAPSULE</Text>
        <Text style={styles.subtitle}>
          Save something special for the future.
        </Text>
      </View>

      <Text style={styles.label}>CAPSULE NAME</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter capsule name"
          placeholderTextColor="#9A8A7A"
          value={capsuleName}
          onChangeText={setCapsuleName}
        />

      <Text style={styles.label}>UNLOCK DATE</Text>

    <View style={styles.dateRow}>
      <TextInput
        style={styles.dateInput}
        placeholder="MM"
        placeholderTextColor="#9A8A7A"
        value={month}
        onChangeText={handleMonth}
        keyboardType="number-pad"
        maxLength={2}
      />

      <TextInput
        style={styles.dateInput}
        placeholder="DD"
        placeholderTextColor="#9A8A7A"
        value={day}
        onChangeText={handleDay}
        keyboardType="number-pad"
        maxLength={2}
      />

      <TextInput
        style={styles.yearInput}
        placeholder="YYYY"
        placeholderTextColor="#9A8A7A"
        value={year}
        onChangeText={handleYear}
        keyboardType="number-pad"
        maxLength={4}
      />
    </View>

      <Text style={styles.label}>ADD FRIENDS</Text>

      <TextInput
        style={styles.input}
        placeholder="Search registered users"
        placeholderTextColor="#9A8A7A"
        value={friendInput}
        onChangeText={setFriendInput}
      />

      {searching && (
        <Text style={styles.friendText}>Searching...</Text>
      )}

      {searchResults
        .filter(user => !friends.some(friend => friend.id === user.id))
        .map(user => (
          <TouchableOpacity
            key={user.id}
            style={styles.friendChip}
            onPress={() => addFriend(user)}
          >
            <Text style={styles.friendText}>{user.name}</Text>
          </TouchableOpacity>
        ))}

      {friends.map(friend => (
        <TouchableOpacity
          key={friend.id}
          style={styles.friendChip}
          onPress={() => removeFriend(friend.id)}
        >
          <Text style={styles.friendText}>
            {friend.name} ×
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.createButton}
        onPress={createCapsule}
      >
        <Text style={styles.createButtonText}>CREATE CAPSULE</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        title={modalTitle}
        onClose={() => setModalVisible(false)}
      >
        <Text style={styles.modalMessage}>
          {modalMessage}
        </Text>
      </Modal>
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
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#806A58',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
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

dateRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 22,
},

dateInput: {
  flex: 1,
  height: 52,
  backgroundColor: '#FFFDF8',
  borderWidth: 1,
  borderColor: '#BFA88D',
  borderRadius: 8,
  color: '#3D3028',
  fontSize: 15,
  textAlign: 'center',
},

yearInput: {
  flex: 1.4,
  height: 52,
  backgroundColor: '#FFFDF8',
  borderWidth: 1,
  borderColor: '#BFA88D',
  borderRadius: 8,
  color: '#3D3028',
  fontSize: 15,
  textAlign: 'center',
},
createButton: {
  backgroundColor: '#735641',
  height: 54,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 12,
},

createButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '800',
  letterSpacing: 2,
},

friendChip: {
  alignSelf: 'flex-start',
  backgroundColor: '#F8F0E3',
  borderWidth: 1,
  borderColor: '#BFA88D',
  borderRadius: 20,
  paddingHorizontal: 14,
  paddingVertical: 8,
  marginBottom: 8,
},

friendText: {
  color: '#50382B',
  fontSize: 14,
  fontWeight: '600',
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
modalMessage: {
  fontSize: 15,
  color: '#806A58',
  lineHeight: 22,
},
});


export default CreateCapsuleScreen;