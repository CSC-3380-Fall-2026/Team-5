import React from 'react';
import { ScrollView,Text, Button, StyleSheet, } from 'react-native';
import CapsuleCard from '../components/CapsuleCard';
import { useCapsules } from '../context/CapsuleContext';
import DataState from '../components/DataState';


// Gets the shared list of capsules created in the app
function HomeScreen({ navigation }: any) {
  const { capsules, loading, error, reload } = useCapsules();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <Button
        title="My Capsules"
        onPress={() => navigation.navigate('MyCapsules')}
      />

      <Button
        title="Profile"
        onPress={() => navigation.navigate('Profile')}
      />

      <Button
        title="Memory Map"
        onPress={() => navigation.navigate('MemoryMap')}
      />

      <Button
        title="Video Templates"
        onPress={() => navigation.navigate('VideoTemplates')}
      />

      <Button
        title="DMs"
        onPress={() => navigation.navigate('DMs')}
      />

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
    </ScrollView>
  );
}

// Styles; can be updated later 
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20,},
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16,},
  feedTitle: { fontSize: 22, fontWeight: '600', marginTop: 24, marginBottom: 12,},
});

export default HomeScreen;