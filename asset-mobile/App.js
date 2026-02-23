import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import Loading from './src/components/common/Loading';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ScanScreen from './src/screens/ScanScreen';
import AssetsScreen from './src/screens/AssetsScreen';
import AssetDetailScreen from './src/screens/AssetDetailScreen';
import CheckScreen from './src/screens/CheckScreen';
import BorrowsScreen from './src/screens/BorrowsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RoomCheckScreen from './src/screens/RoomCheckScreen';
import AssetEditScreen from './src/screens/AssetEditScreen';

import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Assets') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Check') {
            iconName = focused ? 'checkmark-done' : 'checkmark-done-outline';
          } else if (route.name === 'Borrows') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'หน้าแรก' }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{ title: 'สแกน QR' }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{ title: 'ครุภัณฑ์' }}
      />
      <Tab.Screen
        name="Check"
        component={CheckScreen}
        options={{ title: 'ตรวจสอบ' }}
      />
      <Tab.Screen
        name="Borrows"
        component={BorrowsScreen}
        options={{ title: 'ยืม/คืน' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'โปรไฟล์' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AssetDetail"
              component={AssetDetailScreen}
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="RoomCheck"
              component={RoomCheckScreen}
              options={{ title: 'ตรวจสอบรายห้อง' }}
            />
            <Stack.Screen
              name="AssetEdit"
              component={AssetEditScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

