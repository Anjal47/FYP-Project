// src/navigation/AuthStack.jsx
import React, { useEffect, useState } from "react";
import { Linking } from "react-native";
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppTheme } from "../context/ThemeContext";
import {
  getRoleRoute,
  parsePaymentReturnUrl,
  resolveInitialRouteFromStorage,
} from "./authStack.logic";

/* -------------------- AUTH SCREENS -------------------- */
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

/* -------------------- USER SCREENS -------------------- */
import HomeScreen from "../screens/HomeScreen";
import CounselingScreen from "../screens/CounselingScreen";
import CounselingFormScreen from "../screens/CounselingFormScreen";
import BookCounseling from "../screens/BookCounselingScreen";
import TherapyScreen from "../screens/TherapyScreen";
import BookTherapyScreen from "../screens/BookTherapyScreen";

import TrafficHomeScreen from "../screens/TrafficHomeScreen";
import TrafficReportScreen from "../screens/TrafficReportScreen";
import TrafficRulesScreen from "../screens/TrafficRulesScreen";

import SettingsScreen from "../screens/SettingsScreen";
import SupportScreen from "../screens/SupportScreen";
import EmergencySOSScreen from "../screens/EmergencySOSScreen";
import EmergencyContactScreen from "../screens/EmergencyContactScreen";

import CrimeReportScreen from "../screens/CrimeReportScreen";
import ReportStatusScreen from "../screens/ReportStatusScreen";
import ReportingHomeScreen from "../screens/ReportingHomeScreen";
import ConnectToNGOsScreen from "../screens/ConnectToNGOsScreen";

/* -------------------- COUNSELLOR SCREENS -------------------- */
import CounsellorHomeScreen from "../screens/Counsellor/CounsellorHomeScreen";
import CounsellorClientsScreen from "../screens/Counsellor/CounsellorClientsScreen";
import CounsellorReportsScreen from "../screens/Counsellor/CounsellorReportsScreen";

/* -------------------- THERAPIST SCREENS (adjust paths) -------------------- */
import TherapistHomeScreen from "../screens/Therapist/TherapistHomeScreen";

import CounsellorChatScreen from "../screens/Counsellor/CounsellorChatScreen";
/* -------------------- POLICE SCREENS (adjust paths) -------------------- */
import PoliceHomeScreen from "../screens/Police/PoliceHomeScreen";
import TrafficFineCreateScreen from "../screens/Police/TrafficFineCreateScreen";

/* -------------------- ADMIN (Tabs) -------------------- */
import AdminTabs from "./AdminTabs"; // create this file in src/navigation/AdminTabs.jsx
import ProfileScreen from "../screens/ProfileScreen";
import CounsellorAppointmentsScreen from "../screens/Counsellor/CounsellorAppointmentsScreen";
import UserBookedCounselingScreen from "../screens/UserBookedCounselingScreen";
import TrafficReportStatusScreen from "../screens/TrafficReportStatusScreen";
import WasteHomeScreen from "../screens/WasteHomeScreen";
import WasteReportScreen from "../screens/WasteReportScreen";
import WasteReportStatusScreen from "../screens/WasteReportsStatusScreen";
import MunicipalityWasteDashboardScreen from "../screens/Waste/MunicipalityWasteDashboardScreen";
import MunicipalityReportCreateScreen from "../screens/MunicipalityReportCreateScreen";
import CounselingChatScreen from "../screens/CounselingChatScreen";
import TherapyChatScreen from "../screens/TherapyChatScreen";
import VideoCallRoomScreen from "../screens/VideoCallRoomScreen";
import TherapistChatScreen from "../screens/Therapist/TherapistChatScreen";
import FinePaymentScreen from "../Traffic/FinePaymentScreen";
import CrimeReportingHomeScreen from "../screens/CrimeReportHomeScreen";
import DonationScreen from "../screens/Donation/DonationScreen";
import DonateNowScreen from "../screens/Donation/DonateNowScreen";


const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const linking = {
  prefixes: ["angeltouch://"],
  config: {
    screens: {
      FinePayment: "payment-return",
    },
  },
};

export default function AuthStack() {
  const { theme, isDark, language } = useAppTheme();
  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Welcome");

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const nextRoute = await resolveInitialRouteFromStorage();
        if (mounted) {
          setInitialRoute(nextRoute);
        }
      } finally {
        if (mounted) setBooting(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (!url || !navigationRef.isReady()) {
        return;
      }

      const params = parsePaymentReturnUrl(url);
      if (params) {
        navigationRef.navigate("FinePayment", params);
      }
    });

    return () => subscription.remove();
  }, []);

  if (booting) return null;

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };
  const localizedNavigationKey = `lang-${language}`;

  return (
    <NavigationContainer linking={linking} ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}
      >
        {/* AUTH */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* ADMIN */}
        <Stack.Screen name="AdminTabs" component={AdminTabs} />

        {/* USER */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          navigationKey={localizedNavigationKey}
        />
        <Stack.Screen name="Counseling" component={CounselingScreen} />
        <Stack.Screen name="CounselingForm" component={CounselingFormScreen} />
        <Stack.Screen name="Counselors" component={BookCounseling} />
        <Stack.Screen name="UserBookedCounseling" component={UserBookedCounselingScreen} />

<Stack.Screen
  name="TrafficReportStatus"
  component={TrafficReportStatusScreen}
  options={{ headerShown: false }}
/>

        <Stack.Screen name="TherapyScreen" component={TherapyScreen} />
        <Stack.Screen name="BookTherapyScreen" component={BookTherapyScreen} />
        <Stack.Screen name="TrafficHome" component={TrafficHomeScreen} />
        <Stack.Screen name="TrafficReport" component={TrafficReportScreen} />
        <Stack.Screen name="TrafficRules" component={TrafficRulesScreen} />
        <Stack.Screen
          name="ReportingHome"
          component={ReportingHomeScreen}
          navigationKey={localizedNavigationKey}
        />
        <Stack.Screen
          name="CrimeReport"
          component={CrimeReportScreen}
          navigationKey={localizedNavigationKey}
        />
        <Stack.Screen name="ReportStatus" component={ReportStatusScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
        <Stack.Screen
          name="EmergencyContact"
          component={EmergencyContactScreen}
        />
        <Stack.Screen name="ConnectToNGOs" component={ConnectToNGOsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="CounselingChat" component={CounselingChatScreen} />
        <Stack.Screen name="TherapyChat" component={TherapyChatScreen} />
        <Stack.Screen name="VideoCallRoom" component={VideoCallRoomScreen} />
        <Stack.Screen name="FinePayment" component={FinePaymentScreen} />
        <Stack.Screen
          name="CrimeReportingHome"
          component={CrimeReportingHomeScreen}
          navigationKey={localizedNavigationKey}
        />
        <Stack.Screen name="Donation" component={DonationScreen} />
        <Stack.Screen name="DonateNow" component={DonateNowScreen} />


<Stack.Screen name="CounsellorChat" component={CounsellorChatScreen} />
<Stack.Screen name="TherapistChat" component={TherapistChatScreen} />


        {/* COUNSELLOR */}
        <Stack.Screen name="CounsellorHome" component={CounsellorHomeScreen} />
        <Stack.Screen name="CounsellorClients" component={CounsellorClientsScreen} />
          <Stack.Screen name="CounsellorReports" component={CounsellorReportsScreen} />
          <Stack.Screen name="CounsellorAppointments" component={CounsellorAppointmentsScreen} />

        {/* THERAPIST */}
        <Stack.Screen name="TherapistHome" component={TherapistHomeScreen} />

        {/* POLICE */}
        <Stack.Screen name="PoliceHome" component={PoliceHomeScreen} />
        <Stack.Screen name="TrafficFineCreate" component={TrafficFineCreateScreen} />
         <Stack.Screen name="MunicipalityReportCreate" component={MunicipalityReportCreateScreen} />

  <Stack.Screen
    name="MunicipalityWasteDashboard"
    component={MunicipalityWasteDashboardScreen}
  />
        <Stack.Screen name="WasteHome" component={WasteHomeScreen} options={{ headerShown: false }} />
<Stack.Screen name="WasteReport" component={WasteReportScreen} options={{ headerShown: false }} />
<Stack.Screen name="WasteReportStatus" component={WasteReportStatusScreen} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Small safety wrapper:
 * In your paste you had CounselorsScreen import correct,
 * BUT I’m preventing a common typo crash.
 */
