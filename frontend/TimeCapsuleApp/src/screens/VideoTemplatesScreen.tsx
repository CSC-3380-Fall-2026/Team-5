import React, { useEffect, useState } from 'react';import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SlideshowPlayer from '../components/SlideshowPlayer';
import { useCapsules } from '../context/CapsuleContext';
import { VIDEO_TEMPLATES } from '../templates/videoTemplates';
import { buildSlides } from '../utils/slideshow';
import { isCapsuleLocked } from '../utils/capsuleLock';
import { API_BASE_URL } from '../services/api';
import { getAuthToken } from '../services/authStorage';

function VideoTemplatesScreen({ route, navigation }: any) {
const { capsules } = useCapsules();
  // Only capsules that have opened can be turned into a video
  const unlocked = capsules.filter(c => !isCapsuleLocked(c.unlockDate));

  const [capsuleId, setCapsuleId] = useState<string | null>(
    route?.params?.capsule?.id ?? null,
  );
  const [videoMemories, setVideoMemories] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState(VIDEO_TEMPLATES[0].id);
  const [previewing, setPreviewing] = useState(false);

  const capsule = unlocked.find(c => c.id === capsuleId);

    useEffect(() => {
  async function loadMemories() {
    if (!capsuleId) {
      setVideoMemories([]);
      return;
    }

    try {
      const token = await getAuthToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/capsules/${capsuleId}/memories`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Unable to load video memories:',
          data.error,
        );
        return;
      }

      const loadedMemories = data.memories.map(
        (memory: any) => ({
          id: memory.id,
          text: memory.content,
          photoUri: memory.photoData ?? '',
        }),
      );

      setVideoMemories(loadedMemories);
    } catch (error) {
      console.error(
        'Video memory loading error:',
        error,
      );
    }
  }

  loadMemories().catch(error => {
    console.error(
      'Video memory loading error:',
      error,
    );
  });
}, [capsuleId]);


  const template =
    VIDEO_TEMPLATES.find(t => t.id === templateId) ?? VIDEO_TEMPLATES[0];
    const videoCapsule = capsule
    ? {
        ...capsule,
        memories: videoMemories,
      }
    : undefined;

  const slides = videoCapsule
    ? buildSlides(videoCapsule)
    : [];
  const canPreview = capsule !== undefined && slides.length > 0;

  // Preview mode: play the slideshow full screen
  if (previewing && capsule && slides.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.previewBack}
          onPress={() => setPreviewing(false)}
        >
          <Text style={styles.backButtonText}>← Back to templates</Text>
        </TouchableOpacity>
        <SlideshowPlayer slides={slides} template={template} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Page heading */}
        <View style={styles.header}>
          <Text style={styles.title}>VIDEO TEMPLATES</Text>

          <Text style={styles.subtitle}>
            Turn your memories into something special.
          </Text>
        </View>

        {unlocked.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No unlocked capsules yet</Text>

            <Text style={styles.emptyText}>
              Videos can be made once a capsule has opened.
            </Text>
          </View>
        ) : (
          <>
            {/* Capsule choice */}
            <Text style={styles.label}>CHOOSE A CAPSULE</Text>
            {unlocked.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.option,
                  c.id === capsuleId ? styles.optionSelected : null,
                ]}
                onPress={() => setCapsuleId(c.id)}
              >
                <Text style={styles.optionName}>{c.name}</Text>
              </TouchableOpacity>
            ))}

            {/* Template choice */}
            <Text style={styles.label}>CHOOSE A TEMPLATE</Text>
            {VIDEO_TEMPLATES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.option,
                  t.id === templateId ? styles.optionSelected : null,
                ]}
                onPress={() => setTemplateId(t.id)}
              >
                <Text style={styles.optionName}>{t.name}</Text>
                <Text style={styles.optionText}>{t.description}</Text>
              </TouchableOpacity>
            ))}

            {capsule && slides.length === 0 ? (
              <Text style={styles.warning}>
                This capsule has no photos yet. Add a memory with a photo first.
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.previewButton,
                !canPreview ? styles.previewButtonDisabled : null,
              ]}
              disabled={!canPreview}
              onPress={() => setPreviewing(true)}
            >
              <Text style={styles.previewButtonText}>PREVIEW</Text>
            </TouchableOpacity>
          </>
        )}
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

  previewBack: {
    alignSelf: 'flex-start',
    margin: 20,
  },

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

  emptyCard: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#50382B',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#806A58',
    textAlign: 'center',
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B4435',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 9,
  },

  option: {
    backgroundColor: '#F8F0E3',
    borderWidth: 1,
    borderColor: '#BFA88D',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },

  optionSelected: {
    borderColor: '#735641',
    borderWidth: 2,
    backgroundColor: '#FFFDF8',
  },

  optionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#50382B',
  },

  optionText: {
    fontSize: 13,
    color: '#806A58',
    marginTop: 2,
  },

  warning: {
    color: '#c62828',
    marginBottom: 12,
  },

  previewButton: {
    backgroundColor: '#735641',
    height: 54,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,
  },

  previewButtonDisabled: {
    opacity: 0.4,
  },

  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default VideoTemplatesScreen;