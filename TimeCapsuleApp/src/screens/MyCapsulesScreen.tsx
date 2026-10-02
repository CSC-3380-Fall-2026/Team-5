import { View, Text, Button } from 'react-native';

function MyCapsulesScreen({ navigation }: any) {
  return (
    <View>
      <Text>My Capsules Screen</Text>

      <Button
        title="View Capsule Details"
        onPress={() => navigation.navigate('CapsuleDetails')}
      />
    </View>);
}

export default MyCapsulesScreen;