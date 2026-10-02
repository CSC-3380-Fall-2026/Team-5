import { View, Text, Button } from 'react-native';
function HomeScreen({ navigation }: any) {
  return (
    <View>
      <Text>Home Screen</Text>
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
        </View>
  );
}
export default HomeScreen;