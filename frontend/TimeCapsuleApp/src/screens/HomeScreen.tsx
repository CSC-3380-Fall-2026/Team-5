import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView,Text, StyleSheet,View, TouchableOpacity} from 'react-native';
import CapsuleCard from '../components/CapsuleCard';
import { useCapsules } from '../context/CapsuleContext';
import DataState from '../components/DataState';


// Gets the shared list of capsules created in the app
function HomeScreen({ navigation }: any) {
  const { capsules, loading, error, reload } = useCapsules();

  return (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
        <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>✉</Text>
        </View>

        <Text style={styles.title}>TIME CAPSULE</Text>
        <Text style={styles.subtitle}>Your memories, all in one place.</Text>
      </View>

            <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('MyCapsules')}
        >
          <Text style={styles.menuButtonText}>MY CAPSULES</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuButtonText}>PROFILE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('MemoryMap')}
        >
          <Text style={styles.menuButtonText}>MEMORY MAP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('VideoTemplates')}
        >
          <Text style={styles.menuButtonText}>VIDEO TEMPLATES</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('DMs')}
        >
          <Text style={styles.menuButtonText}>DMS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedCard}>
          <Text style={styles.feedTitle}>Capsule Feed</Text>

          <DataState
            loading={loading}
            error={error}
            isEmpty={capsules.length === 0}
            emptyTitle="No capsules to display yet"
            emptyMessage="Create a capsule from My Capsules to see it here."
            onRetry={reload}
          >
            {capsules.map(capsule => (
              <CapsuleCard key={capsule.id} capsule={capsule} />
            ))}
          </DataState>
        </View>
        </ScrollView>
  </SafeAreaView>
  );
}

// Styles; can be updated later 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D8BE',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 28,
  },

  logoCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#735641',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  logoIcon: {
    fontSize: 30,
    color: '#FFF5E8',
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#50382B',
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#806A58',
    marginTop: 6,
    fontStyle: 'italic',
  },

  feedCard: {
  backgroundColor: '#F8F0E3',
  borderWidth: 1,
  borderColor: '#BFA88D',
  borderRadius: 14,
  padding: 18,
  paddingBottom: 28,
  marginTop: 28,
  marginBottom: 30,
},

feedTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#50382B',
  marginBottom: 12,
},

  menu: {
  gap: 12,
},

menuButton: {
  backgroundColor: '#F8F0E3',
  borderWidth: 1,
  borderColor: '#BFA88D',
  borderRadius: 10,
  paddingVertical: 16,
  alignItems: 'center',
},

menuButtonText: {
  color: '#50382B',
  fontSize: 15,
  fontWeight: '800',
  letterSpacing: 1,
},
safeArea: {
  flex: 1,
  backgroundColor: '#E8D8BE',
},
});

export default HomeScreen;