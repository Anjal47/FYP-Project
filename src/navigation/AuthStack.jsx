// src/navigation/AuthStack.jsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/* -------------------- AUTH SCREENS -------------------- */
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

/* -------------------- USER SCREENS -------------------- */
import HomeScreen from "../screens/HomeScreen";
import CounselingScreen from "../screens/CounselingScreen";
import CounselingFormScreen from "../screens/CounselingFormScreen";
import CounselorsScreen from "../screens/CounselorsScreen";
import TherapyScreen from "../screens/TherapyScreen";
import BookTherapyScreen from "../screens/BookTherapyScreen";

import TrafficHomeScreen from "../screens/TrafficHomeScreen";
import TrafficReportScreen from "../screens/TrafficReportScreen";
import TrafficRulesScreen from "../screens/TrafficRulesScreen";

import SettingsScreen from "../screens/SettingsScreen";
import SupportScreen from "../screens/SupportScreen";

import CrimeReportScreen from "../screens/CrimeReportScreen";
import ReportStatusScreen from "../screens/ReportStatusScreen";
import ReportingHomeScreen from "../screens/ReportingHomeScreen";
import ConnectToNGOsScreen from "../screens/ConnectToNGOsScreen";

/* -------------------- COUNSELLOR SCREENS -------------------- */
import CounsellorHomeScreen from "../screens/counsellor/CounsellorHomeScreen";
import CounsellorClientsScreen from "../screens/counsellor/CounsellorClientsScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* AUTH */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* USER */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Counseling" component={CounselingScreen} />
        <Stack.Screen name="CounselingForm" component={CounselingFormScreen} />
        <Stack.Screen name="Counselors" component={CounselorsScreen} />
        <Stack.Screen name="TherapyScreen" component={TherapyScreen} />
        <Stack.Screen name="BookTherapyScreen" component={BookTherapyScreen} />
        <Stack.Screen name="TrafficHome" component={TrafficHomeScreen} />
        <Stack.Screen name="TrafficReport" component={TrafficReportScreen} />
        <Stack.Screen name="TrafficRules" component={TrafficRulesScreen} />
        <Stack.Screen name="ReportingHome" component={ReportingHomeScreen} />
        <Stack.Screen name="CrimeReport" component={CrimeReportScreen} />
        <Stack.Screen name="ReportStatus" component={ReportStatusScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="ConnectToNGOs" component={ConnectToNGOsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />

        {/* COUNSELLOR */}
        <Stack.Screen name="CounsellorHome" component={CounsellorHomeScreen} />
        <Stack.Screen name="CounsellorClients" component={CounsellorClientsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
