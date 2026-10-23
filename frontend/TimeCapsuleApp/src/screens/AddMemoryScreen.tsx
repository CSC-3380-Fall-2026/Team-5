import React, { useState } from 'react';
import {View,Text,TextInput,Button,StyleSheet,Image} from 'react-native';
import { useCapsules } from '../context/CapsuleContext';
import { launchImageLibrary } from 'react-native-image-picker';

function AddMemoryScreen({ route, navigation }: any) {
  const [memoryText, setMemoryText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
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
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Memory</Text>
        <Text style={styles.subtitle}>
            Adding to: {capsule.name}
     </Text>

      <Text style={styles.label}>Memory</Text>

      <TextInput
        style={styles.input}
        placeholder="Write a memory..."
        value={memoryText}
        onChangeText={setMemoryText}
        multiline
      />


      <Button
        title="Choose Photo"
        onPress={choosePhoto}
      />

      {photoUri ? (
      <Image
        source={{ uri: photoUri }}
        style={styles.photo}
      />
    ) : null}

      <Button
        title="Add Memory"
        onPress={() => {
        if (memoryText.trim() === '' || photoUri === null) {
        return;
        }

        const newMemory = {
          id: Date.now().toString(),
          text: memoryText.trim(),
          photoUri: photoUri ?? '',
        };

        addMemory(capsule.id, newMemory);

        navigation.goBack();
        }}
/>
    </View>
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