import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import CreateCapsuleScreen from './src/screens/CreateCapsuleScreen';
import MyCapsulesScreen from './src/screens/MyCapsulesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MemoryMapScreen from './src/screens/MemoryMapScreen';
import VideoTemplatesScreen from './src/screens/VideoTemplatesScreen';
import DMScreen from './src/screens/DMScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateCapsule" component={CreateCapsuleScreen} />
        <Stack.Screen name="MyCapsules" component={MyCapsulesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} /> 
        <Stack.Screen name="MemoryMap" component={MemoryMapScreen} />
        <Stack.Screen name="VideoTemplates" component={VideoTemplatesScreen} />
        <Stack.Screen name="DMs" component={DMScreen} />
      </Stack.Navigator>
    </NavigationContainer> );
}
export default App;