import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  validateMemory,
  hasErrors,
  MemoryErrors,
} from '../utils/memoryValidation';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';
import { useCapsules } from '../context/CapsuleContext';

function AddMemoryScreen({ route, navigation }: any) {
  const [memoryText, setMemoryText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [errors, setErrors] = useState<MemoryErrors>({});
  const [uploading, setUploading] = useState(false);

  const { capsule } = route.params;
  const { addMemory } = useCapsules();

  // Opens the phone's photo library
  async function choosePhoto() {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.7,
  });

    const selectedPhoto = result.assets?.[0];

    if (selectedPhoto?.uri) {
      setPhotoUri(selectedPhoto.uri);

      if (selectedPhoto.base64) {
        const imageType = selectedPhoto.type ?? 'image/jpeg';

        setPhotoData(
          `data:${imageType};base64,${selectedPhoto.base64}`,
        );
      }

      // A photo was chosen, so clear the photo error
      setErrors(current => ({
        ...current,
        photo: undefined,
      }));
    }
  }

  // Saves the new memory to the selected capsule
  async function handleAddMemory() {
    // Check the form first; stop and show messages if something is missing
    const validationErrors = validateMemory(
      memoryText,
      photoUri,
    );

    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      return;
    }
    setUploading(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/capsules/${capsule.id}/memories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: memoryText.trim(),
            photoData,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Unable to save memory:',
          data.error,
        );
        return;
      }

      const newMemory = {
        id: data.memory.id,
        text: data.memory.content,
        photoUri: photoData ?? photoUri ?? '',
      };

      addMemory(capsule.id, newMemory);

      navigation.goBack();
    } catch (error) {
      console.error(
        'Memory creation error:',
        error,
      );
    } finally {
    setUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            ← Back
          </Text>
        </TouchableOpacity>

        {/* Page heading */}
        <View style={styles.header}>
          <Text style={styles.title}>
            ADD MEMORY
          </Text>

          <Text style={styles.subtitle}>
            Adding to: {capsule.name}
          </Text>
        </View>

        {/* Memory text */}
        <Text style={styles.label}>
          MEMORY
        </Text>

        <TextInput
          style={[
            styles.input,
            errors.text ? styles.inputError : null,
          ]}
          placeholder="Write a memory..."
          placeholderTextColor="#9A8A7A"
          value={memoryText}
          onChangeText={value => {
            setMemoryText(value);

            if (errors.text) {
              setErrors(current => ({
                ...current,
                text: undefined,
              }));
            }
          }}
          multiline
        />

        {errors.text ? (
          <Text style={styles.error}>
            {errors.text}
          </Text>
        ) : null}

        {/* Photo selection */}
        <Text style={styles.label}>
          PHOTO
        </Text>

        <TouchableOpacity
          style={styles.photoButton}
          onPress={choosePhoto}
        >
          <Text style={styles.photoButtonText}>
            CHOOSE PHOTO
          </Text>
        </TouchableOpacity>

        {errors.photo ? (
          <Text style={styles.error}>
            {errors.photo}
          </Text>
        ) : null}

        {/* Selected photo preview */}
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
          />
        ) : (
          <Text style={styles.photoHint}>
            No photo selected yet.
          </Text>
        )}

        {/* Save memory */}
        <TouchableOpacity
  style={[
    styles.addButton,
    uploading ? styles.addButtonDisabled : null,
  ]}
  onPress={handleAddMemory}
  disabled={uploading}
>
  {uploading ? (
    <View style={styles.uploadingRow}>
      <ActivityIndicator
        size="small"
        color="#FFFFFF"
      />

      <Text style={styles.addButtonText}>
        UPLOADING MEMORY...
      </Text>
    </View>
  ) : (
    <Text style={styles.addButtonText}>
      ADD MEMORY
    </Text>
  )}
</TouchableOpacity>
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

  // Validation messages
  error: {
    color: '#c62828',
    marginTop: 6,
    marginBottom: 12,
  },

  inputError: {
    borderColor: '#c62828',
  },

  container: {
    flex: 1,
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  // Back navigation
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

  // Page heading
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#806A58',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Form labels
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4435',
    letterSpacing: 1,
    marginBottom: 9,
  },

  // Memory input
  input: {
    minHeight: 130,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 8,
    padding: 15,
    color: '#3D3028',
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 24,
  },

  // Choose photo button
  photoButton: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  photoButtonText: {
    color: '#50382B',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  photoHint: {
    color: '#806A58',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 24,
  },

  // Selected image preview
  photo: {
    width: '100%',
    height: 220,
    marginTop: 14,
    marginBottom: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFA88D',
  },

  // Add memory button
  addButton: {
    backgroundColor: '#735641',
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default AddMemoryScreen;