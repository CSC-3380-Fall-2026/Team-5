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
import { CapsuleProvider } from './src/context/CapsuleContext';
import LoginScreen from './src/login screen/src/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import CapsuleDetailsScreen from './src/screens/CapsuleDetailsScreen';
import AddMemoryScreen from './src/screens/AddMemoryScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <CapsuleProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen}   options={{ headerShown: false }}/>
        <Stack.Screen name="SignUp" component={SignUpScreen}options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateCapsule" component={CreateCapsuleScreen}   options={{ headerShown: false }}/>
        <Stack.Screen name="MyCapsules" component={MyCapsulesScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="CapsuleDetails" component={CapsuleDetailsScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="AddMemory" component={AddMemoryScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Profile" component={ProfileScreen}   options={{ headerShown: false }}/>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }}/> 
        <Stack.Screen name="MemoryMap" component={MemoryMapScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="VideoTemplates" component={VideoTemplatesScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="DMs" component={DMScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
    </NavigationContainer>
    </CapsuleProvider>);
}
export default App;
