import { View, Text, Button } from 'react-native';

function MyCapsulesScreen({ navigation }: any) {
  return (
    <View>
      <Text>My Capsules Screen</Text>

      <Button
        title="Create New Capsule"
        onPress={() => navigation.navigate('CreateCapsule')}
      />
    </View>);
}

export default MyCapsulesScreen;