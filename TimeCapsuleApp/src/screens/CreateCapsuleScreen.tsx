import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';



function CreateCapsuleScreen() {
    const [capsuleName, setCapsuleName] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [year, setYear] = useState('');
    const [friendInput, setFriendInput] = useState('');
    const [friends, setFriends] = useState<string[]>([]);

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

    function addFriend() {
        if (friendInput.trim() !== '') {
            setFriends([...friends, friendInput.trim()]);
            setFriendInput('');
        }
        }
    return (
    
    
    <View>
        <Text>Create Capsule Screen</Text>

        <TextInput 
        placeholder="Capsule Name" 
        value={capsuleName}
        onChangeText={setCapsuleName}/>
        <Text>Unlock Date</Text>

    <View style={{ flexDirection: 'row' }}>
        <TextInput
        placeholder="MM"
        value={month}
        onChangeText={handleMonth}
        
        keyboardType="number-pad"
        maxLength={2}
        />

        <TextInput
            placeholder="DD"
            value={day}
            onChangeText={handleDay}
            keyboardType="number-pad"
            maxLength={2}
        />

        <TextInput
            placeholder="YYYY"
            value={year}
            onChangeText={handleYear}
            keyboardType="number-pad"
            maxLength={4}
            />
        </View>
        <TextInput
            placeholder="Add Friend"
            value={friendInput}
            onChangeText={setFriendInput}
            onSubmitEditing={addFriend}
            />
            {friends.map((friend) => (
                <Text key={friend}>{friend}</Text>
            ))}

       <Button
            title="Create Capsule"
            onPress={() => {
            if (
                capsuleName.trim() === '' ||
                month === '' ||
                day === '' ||
                year === ''
            ) {
                Alert.alert('Missing Information', 'Please complete all required fields.');
                return;
            }

            Alert.alert(
                'Capsule Created',
                `${capsuleName}\n${month}/${day}/${year}\nFriends: ${friends.join(', ')}`
            );
            setCapsuleName('');
            setMonth('');
            setDay('');
            setYear('');
            setFriendInput('');
            setFriends([]);
            }}
            />
        </View>     

    );
    
    }

export default CreateCapsuleScreen;