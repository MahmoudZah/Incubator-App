import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import AlarmsScreen from '../screens/AlarmsScreen';
import ECGScreen from '../screens/ECGScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard', component: DashboardScreen, icon: 'grid' },
  { name: 'Alarms', component: AlarmsScreen, icon: 'notifications' },
  { name: 'ECG', component: ECGScreen, icon: 'pulse' },
  { name: 'History', component: HistoryScreen, icon: 'analytics' },
  { name: 'Settings', component: SettingsScreen, icon: 'settings' },
];

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 15,
          paddingTop: 10,
          // Floating dock styles
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 35,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMutedLight,
        tabBarShowLabel: false, // Cleaner look similar to style picture
      }}
    >
      {TABS.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? t.icon : `${t.icon}-outline`} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
