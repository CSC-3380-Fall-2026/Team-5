import { View, Text, Button } from 'react-native';

function ProfileScreen({ navigation }: any) {
  return (
    <View>
      <Text>Profile Screen</Text>

      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
}

export default ProfileScreen;