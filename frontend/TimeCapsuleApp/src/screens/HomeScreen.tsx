import React from 'react';
import { ScrollView,Text, Button, StyleSheet, } from 'react-native';
import CapsuleCard from '../components/CapsuleCard';
import { useCapsules } from '../context/CapsuleContext';


// Gets the shared list of capsules created in the app
function HomeScreen({ navigation }: any) {
  const { capsules } = useCapsules();

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

      {capsules.length === 0 ? (
        // Shows a message if no capsules have been created
        <Text>No capsules to display yet.</Text>
      ) : (
        // Creates CapsuleCard for each saved capsule
        capsules.map(capsule => (
          <CapsuleCard
            key={capsule.id}
            capsule={capsule}
          />
        ))
      )}
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