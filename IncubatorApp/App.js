import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { IncubatorProvider } from './src/context/IncubatorContext';
import TabNavigator from './src/navigation/TabNavigator';
import { colors } from './src/theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

import { registerRootComponent } from 'expo';

export default function App() {
  return (
    <IncubatorProvider>
      <NavigationContainer theme={navTheme} linking={{ enabled: false }}>
        <StatusBar style="light" />
        <TabNavigator />
      </NavigationContainer>
    </IncubatorProvider>
  );
}

registerRootComponent(App);
