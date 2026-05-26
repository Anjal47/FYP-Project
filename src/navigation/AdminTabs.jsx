import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";
import AdminUsersScreen from "../screens/Admin/AdminUsersScreen";
import  AdminStaffScreen from "../screens/Admin/AdminStaffScreen";
import  AdminReportsScreen from "../screens/Admin/AdminReportsScreen";
import AdminDonationsScreen from "../screens/Admin/AdminDonationsScreen";
import { useTranslate } from "../utils/localization";

const Tab = createBottomTabNavigator();

/**
 * Admin Tabs (Best practice)
 * Overview / Users / Staff / Reports

 */
export default function AdminTabs() {
  const translate = useTranslate();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0B0F14",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "rgba(234,240,255,0.55)",
        tabBarIcon: ({ color, size }) => {
          const map = {
            Overview: "grid-outline",
            Users: "people-outline",
            Staff: "medkit-outline",
            Reports: "warning-outline",
            Donations: "heart-outline",
          };
          return <Ionicons name={map[route.name] || "ellipse-outline"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={AdminDashboardScreen} options={{ tabBarLabel: translate("Overview") }} />
      <Tab.Screen name="Users" component={AdminUsersScreen} options={{ tabBarLabel: translate("Users") }} />
      <Tab.Screen name="Staff" component={AdminStaffScreen} options={{ tabBarLabel: translate("Staff") }} />
      <Tab.Screen name="Reports" component={AdminReportsScreen} options={{ tabBarLabel: translate("Reports") }} />
      <Tab.Screen name="Donations" component={AdminDonationsScreen} options={{ tabBarLabel: translate("Donations") }} />

    </Tab.Navigator>
  );
}
