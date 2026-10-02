import { View, Text, Button } from 'react-native';
function HomeScreen({ navigation }: any) {
  return (
    <View>
      <Text>Home Screen</Text>

      <Button
        title="Create Capsule"
        onPress={() => navigation.navigate('CreateCapsule')}
      />
      <Button
        title="My Capsules"
        onPress={() => navigation.navigate('MyCapsules')}
      />
      <Button
        title="Profile"
        onPress={() => navigation.navigate('Profile')}
      />

    </View>
  );
}
export default HomeScreen;