import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import Loading from './src/components/common/Loading';
import { useNetwork } from './src/hooks/useNetwork';
import offlineService from './src/services/offlineService';

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
import ImportScreen from './src/screens/ImportScreen';
import OfflineScreen from './src/screens/OfflineScreen';

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
  const { isConnected } = useNetwork();
  const [lastConnected, setLastConnected] = React.useState(true);

  // Automatic Sync when back online
  React.useEffect(() => {
    if (isConnected && !lastConnected && isAuthenticated) {
      console.log('Network restored. Attempting auto-sync...');
      const autoSync = async () => {
        const result = await offlineService.syncPendingChecks();
        if (result.success > 0) {
          console.log(`Auto-sync successful: ${result.success} items`);
        }
      };
      autoSync();
    }
    setLastConnected(isConnected);
  }, [isConnected, isAuthenticated]);

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
            <Stack.Screen
              name="Import"
              component={ImportScreen}
              options={{
                title: 'นำเข้าข้อมูล',
                headerShown: true,
                headerStyle: { backgroundColor: '#FFF' },
                headerTintColor: '#1F2937',
              }}
            />
            <Stack.Screen
              name="Offline"
              component={OfflineScreen}
              options={{ title: 'จัดการข้อมูลออฟไลน์' }}
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

