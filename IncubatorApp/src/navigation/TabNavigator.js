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
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
