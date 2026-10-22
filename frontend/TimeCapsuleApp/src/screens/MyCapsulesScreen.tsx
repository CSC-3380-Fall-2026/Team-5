import { View, Text, Button, StyleSheet, } from 'react-native';

import CapsuleCard from '../components/CapsuleCard';
import { useCapsules } from '../context/CapsuleContext';

function MyCapsulesScreen({ navigation }: any) {
  // Gets the shared list of capsules created in the app
  const { capsules } = useCapsules();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Capsules</Text>

      <Button
        title="Create New Capsule"
        onPress={() => navigation.navigate('CreateCapsule')}
      />
{/* Displays the created capsules */}
      <View style={styles.list}>
        {capsules.length === 0 ? (
          <Text>No capsules yet.</Text>
        ) : (
          capsules.map(capsule => (
          <CapsuleCard
            key={capsule.id}
            capsule={capsule}
            onPress={() =>
              navigation.navigate('CapsuleDetails', { capsule })
            }
          />
        ))
        )}
      </View>
    </View>
  );
}


// Styles; Can be updated later
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  list: {
    marginTop: 20,
  },
});

export default MyCapsulesScreen;