import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import CapsuleCard from '../components/CapsuleCard';
import { useCapsules } from '../context/CapsuleContext';
import DataState from '../components/DataState';
import { SafeAreaView } from 'react-native-safe-area-context';


function MyCapsulesScreen({ navigation }: any) {
  // Gets the shared list of capsules created in the app
  const { capsules, loading, error, reload } = useCapsules();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>            <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>


      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>MY CAPSULES</Text>
        <Text style={styles.subtitle}>Keep track of the memories you are saving.</Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateCapsule')} >
        <Text style={styles.createButtonText}>CREATE NEW CAPSULE</Text>
      </TouchableOpacity>


{/* Displays the created capsules */}
      <View style={styles.list}>
  <DataState
    loading={loading}
    error={error}
    isEmpty={capsules.length === 0}
    emptyTitle="No capsules yet"
    emptyMessage="Tap Create New Capsule to start your first one."
    onRetry={reload}
  >
    {capsules.map(capsule => (
      <CapsuleCard
        key={capsule.id}
        capsule={capsule}
        onPress={() => navigation.navigate('CapsuleDetails', { capsule })}
      />
    ))}
  </DataState>
  </View>
      </ScrollView>
</SafeAreaView>
  );
}


// Styles; Can be updated later
const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: '#E8D8BE',
  padding: 20,
},

list: {
  marginTop: 10,
},

header: {
  alignItems: 'center',
  marginTop: 0,
  marginBottom: 24,
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

createButton: {
  backgroundColor: '#F8F0E3',
  borderWidth: 1,
  borderColor: '#BFA88D',
  borderRadius: 10,
  paddingVertical: 16,
  alignItems: 'center',
  marginBottom: 20,
},

createButtonText: {
  color: '#50382B',
  fontSize: 15,
  fontWeight: '800',
  letterSpacing: 1,
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
safeArea: {
  flex: 1,
  backgroundColor: '#E8D8BE',
},
});

export default MyCapsulesScreen;