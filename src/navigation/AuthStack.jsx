// src/navigation/AuthStack.jsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import CounsellorHomeScreen from "../screens/Counsellor/CounsellorHomeScreen";
import CounsellorClientsScreen from "../screens/Counsellor/CounsellorClientsScreen";

/* -------------------- THERAPIST SCREENS (adjust paths) -------------------- */
import TherapistHomeScreen from "../screens/Therapist/TherapistHomeScreen";

/* -------------------- POLICE SCREENS (adjust paths) -------------------- */
import PoliceHomeScreen from "../screens/Police/PoliceHomeScreen";

/* -------------------- ADMIN (Tabs) -------------------- */
import AdminTabs from "./AdminTabs"; // create this file in src/navigation/AdminTabs.jsx
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

/**
 * Decide initial route based on stored user role.
 */
function getRoleRoute(role) {
  if (role === "admin") return "AdminTabs";
  if (role === "counsellor") return "CounsellorHome";
  if (role === "therapist") return "TherapistHome";
  if (role === "police") return "PoliceHome";
  return "Home";
}

export default function AuthStack() {
  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Welcome");

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        // If logged in already -> go role dashboard
        if (mounted && token && user?.role) {
          setInitialRoute(getRoleRoute(user.role));
        } else {
          setInitialRoute("Welcome");
        }
      } catch (e) {
        setInitialRoute("Welcome");
      } finally {
        if (mounted) setBooting(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  if (booting) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        {/* AUTH */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* ADMIN */}
        <Stack.Screen name="AdminTabs" component={AdminTabs} />

        {/* USER */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Counseling" component={CounselingScreen} />
        <Stack.Screen name="CounselingForm" component={CounselingFormScreen} />
        <Stack.Screen name="Counselors" component={CounelorsScreenFix} />
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
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* COUNSELLOR */}
        <Stack.Screen name="CounsellorHome" component={CounsellorHomeScreen} />
        <Stack.Screen name="CounsellorClients" component={CounsellorClientsScreen} />
          <Stack.Screen name="CounsellorAppointments" component={CounsellorAppointments} />

        {/* THERAPIST */}
        <Stack.Screen name="TherapistHome" component={TherapistHomeScreen} />

        {/* POLICE */}
        <Stack.Screen name="PoliceHome" component={PoliceHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Small safety wrapper:
 * In your paste you had CounselorsScreen import correct,
 * BUT I’m preventing a common typo crash.
 */
function CounelorsScreenFix(props) {
  return <CounselorsScreen {...props} />;
}
