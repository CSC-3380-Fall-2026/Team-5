import React, { useState } from 'react';
import {View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCapsules } from '../context/CapsuleContext';
import Modal from '../components/Modal';

function CreateCapsuleScreen({ navigation }: any) {  const [capsuleName, setCapsuleName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState<string[]>([]);
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

  //adds friend to list after hitting enter 
  function addFriend() {
  const newFriend = friendInput.trim();

  if (newFriend !== '' && !friends.includes(newFriend)) {
    setFriends([...friends, newFriend]);
    setFriendInput('');
  }
}


// Validates the form, creates a capsule, and saves it
  function createCapsule() {
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


// Creates new capsule with entered info 
    const newCapsule = {
      id: Date.now().toString(),
      name: capsuleName.trim(),
      unlockDate: `${month}/${day}/${year}`,
      friends,
    };

    addCapsule(newCapsule);

    setModalTitle('Capsule Created');

setModalMessage(
  `${capsuleName}\n${month}/${day}/${year}\nFriends: ${friends.join(', ')}`,
);

setModalVisible(true);

//Clears form after creation
    setCapsuleName('');
    setMonth('');
    setDay('');
    setYear('');
    setFriendInput('');
    setFriends([]);
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
        placeholder="Enter friend's username"
        placeholderTextColor="#9A8A7A"
        value={friendInput}
        onChangeText={setFriendInput}
        onSubmitEditing={addFriend}
      />

      {friends.map(friend => (
      <View key={friend} style={styles.friendChip}>
        <Text style={styles.friendText}>{friend}</Text>
      </View>
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