import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image } from 'react-native';
import { useCapsules } from '../context/CapsuleContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { validateMemory, hasErrors, MemoryErrors } from '../utils/memoryValidation';

function AddMemoryScreen({ route, navigation }: any) {
  const [memoryText, setMemoryText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<MemoryErrors>({});
  const { capsule } = route.params;
  const { addMemory } = useCapsules();

  const choosePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
    });

    console.log('IMAGE PICKER RESULT:', result);

    const selectedPhoto = result.assets?.[0];

    if (selectedPhoto?.uri) {
      setPhotoUri(selectedPhoto.uri);
      // A photo was chosen, so clear the photo error
      setErrors(current => ({ ...current, photo: undefined }));
    }
  };

  const handleAddMemory = () => {
    // Check the form first; stop and show messages if something is missing
    const validationErrors = validateMemory(memoryText, photoUri);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      return;
    }

    const newMemory = {
      id: Date.now().toString(),
      text: memoryText.trim(),
      photoUri: photoUri ?? '',
    };

    addMemory(capsule.id, newMemory);

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Memory</Text>
      <Text style={styles.subtitle}>Adding to: {capsule.name}</Text>

      <Text style={styles.label}>Memory</Text>

      <TextInput
        style={[styles.input, errors.text ? styles.inputError : null]}
        placeholder="Write a memory..."
        value={memoryText}
        onChangeText={value => {
          setMemoryText(value);
          // The user is typing, so clear the text error
          if (errors.text) {
            setErrors(current => ({ ...current, text: undefined }));
          }
        }}
        multiline
      />
      {errors.text ? <Text style={styles.error}>{errors.text}</Text> : null}

      <Button title="Choose Photo" onPress={choosePhoto} />
      {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      ) : null}

      <Button title="Add Memory" onPress={handleAddMemory} />
    </View>
  );
}

const styles = StyleSheet.create({ error: {
    color: '#c62828',
    marginBottom: 12,
  },

  inputError: {
    borderColor: '#c62828',
  },
  
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  subtitle: {
  fontSize: 16,
  marginBottom: 20,
},
  photo: {
    width: '100%',
    height: 200,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
});

export default AddMemoryScreen;