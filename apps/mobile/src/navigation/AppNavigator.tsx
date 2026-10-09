import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '@gestion-pas/types';
import { useAuth } from '../hooks/useAuth';

import DashboardScreen from '../screens/shared/DashboardScreen';
import { AseguradosStack } from './stacks/AseguradosStack';
import { PolizasStack } from './stacks/PolizasStack';
import { SiniestrosStack } from './stacks/SiniestrosStack';
import { ReclamosStack } from './stacks/ReclamosStack';
import MasNavigator from './MasNavigator';

const Tab = createBottomTabNavigator();

const TAB_BAR_STYLE = {
  backgroundColor: '#040a18',
  borderTopColor: '#0d1a2e',
};

const ACTIVE_COLOR = '#00d4ff';
const INACTIVE_COLOR = '#4a5568';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName, focusedName: IoniconsName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );
}

/** Tabs for asegurado role: Mis Pólizas / Mis Siniestros / Mis Reclamos */
function AseguradoTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ tabBarStyle: TAB_BAR_STYLE, tabBarActiveTintColor: ACTIVE_COLOR, tabBarInactiveTintColor: INACTIVE_COLOR, headerShown: false }}
    >
      <Tab.Screen
        name="MisPolizas"
        component={PolizasStack}
        options={{ title: 'Mis Pólizas', tabBarIcon: tabIcon('document-outline', 'document') }}
      />
      <Tab.Screen
        name="MisSiniestros"
        component={SiniestrosStack}
        options={{ title: 'Mis Siniestros', tabBarIcon: tabIcon('alert-circle-outline', 'alert-circle') }}
      />
      <Tab.Screen
        name="MisReclamos"
        component={ReclamosStack}
        options={{ title: 'Mis Reclamos', tabBarIcon: tabIcon('chatbox-outline', 'chatbox') }}
      />
    </Tab.Navigator>
  );
}

/** Tabs for productor role */
function ProductorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ tabBarStyle: TAB_BAR_STYLE, tabBarActiveTintColor: ACTIVE_COLOR, tabBarInactiveTintColor: INACTIVE_COLOR, headerShown: false }}
    >
      <Tab.Screen
        name="Asegurados"
        component={AseguradosStack}
        options={{ title: 'Asegurados', tabBarIcon: tabIcon('people-outline', 'people') }}
      />
      <Tab.Screen
        name="Polizas"
        component={PolizasStack}
        options={{ title: 'Pólizas', tabBarIcon: tabIcon('document-outline', 'document') }}
      />
      <Tab.Screen
        name="Siniestros"
        component={SiniestrosStack}
        options={{ title: 'Siniestros', tabBarIcon: tabIcon('alert-circle-outline', 'alert-circle') }}
      />
      <Tab.Screen
        name="Reclamos"
        component={ReclamosStack}
        options={{ title: 'Reclamos', tabBarIcon: tabIcon('chatbox-outline', 'chatbox') }}
      />
      <Tab.Screen
        name="Mas"
        component={MasNavigator}
        options={{ title: 'Más', tabBarIcon: tabIcon('ellipsis-horizontal-outline', 'ellipsis-horizontal') }}
      />
    </Tab.Navigator>
  );
}

/** Tabs for organizador role — 5 tabs: Inicio / Asegurados / Pólizas / Siniestros / Más */
function OrganizadorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ tabBarStyle: TAB_BAR_STYLE, tabBarActiveTintColor: ACTIVE_COLOR, tabBarInactiveTintColor: INACTIVE_COLOR, headerShown: false }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ title: 'Inicio', tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tab.Screen
        name="Asegurados"
        component={AseguradosStack}
        options={{ title: 'Asegurados', tabBarIcon: tabIcon('people-outline', 'people') }}
      />
      <Tab.Screen
        name="Polizas"
        component={PolizasStack}
        options={{ title: 'Pólizas', tabBarIcon: tabIcon('document-outline', 'document') }}
      />
      <Tab.Screen
        name="Siniestros"
        component={SiniestrosStack}
        options={{ title: 'Siniestros', tabBarIcon: tabIcon('alert-circle-outline', 'alert-circle') }}
      />
      <Tab.Screen
        name="Mas"
        component={MasNavigator}
        options={{ title: 'Más', tabBarIcon: tabIcon('ellipsis-horizontal-outline', 'ellipsis-horizontal') }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  if (user?.perfil === UserRole.ASEGURADO) return <AseguradoTabs />;
  if (user?.perfil === UserRole.PRODUCTOR) return <ProductorTabs />;
  return <OrganizadorTabs />;
}
