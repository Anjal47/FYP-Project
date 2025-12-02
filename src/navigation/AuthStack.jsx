import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import CounselingScreen from '../screens/CounselingScreen';
import CounselingFormScreen from "../screens/CounselingFormScreen";
import CounselorsScreen from '../screens/CounselorsScreen';
import TherapyScreen from '../screens/TherapyScreen';
import BookTherapyScreen from '../screens/BookTherapScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Counseling" component={CounselingScreen} />
        <Stack.Screen name="CounselingForm" component={CounselingFormScreen} />
        <Stack.Screen name="Counselors" component={CounselorsScreen} />
        <Stack.Screen name="Therapy" component={TherapyScreen} />
        <Stack.Screen name="BookTherapy" component={BookTherapyScreen} />
        
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
