import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";
import AdminUsersScreen from "../screens/Admin/AdminUsersScreen";
import  AdminStaffScreen from "../screens/Admin/AdminStaffScreen";
import  AdminReportsScreen from "../screens/Admin/AdminReportsScreen";



// IMPORTANT: adjust paths to match your files inside screens/Admin

const Tab = createBottomTabNavigator();

/**
 * Admin Tabs (Best practice)
 * Overview / Users / Staff / Reports

 */
export default function AdminTabs() {
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
          };
          return <Ionicons name={map[route.name] || "ellipse-outline"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={AdminDashboardScreen} />
      <Tab.Screen name="Users" component={AdminUsersScreen} />
      <Tab.Screen name="Staff" component={AdminStaffScreen} />
      <Tab.Screen name="Reports" component={AdminReportsScreen} />
    </Tab.Navigator>
  );
}
