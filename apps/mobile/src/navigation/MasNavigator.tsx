import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProductoresScreen, CompaniasScreen } from '../screens/organizador/ProductoresCompaniasScreens';
import { ReportesScreen } from '../screens/organizador/ReportesScreen';
import ReclamosScreen from '../screens/shared/ReclamosScreen';
import ReclamoDetailScreen from '../screens/shared/ReclamoDetailScreen';
import NuevoReclamoScreen from '../screens/shared/NuevoReclamoScreen';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '@gestion-pas/types';
import { colors, font, spacing, radius } from '../theme/tokens';

const Stack = createNativeStackNavigator();

type MenuItem = { label: string; screen: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

function MasMenu({ navigation }: any) {
  const { user, logout } = useAuth();
  const isOrganizador = user?.perfil === UserRole.ORGANIZADOR;

  const items: MenuItem[] = [
    ...(isOrganizador
      ? [
          { label: 'Productores', screen: 'Productores', icon: 'person-outline' as const },
          { label: 'Compañías',   screen: 'Companias',   icon: 'business-outline' as const },
        ]
      : []),
    { label: 'Reclamos',  screen: 'ReclamosList', icon: 'chatbox-outline' as const },
    { label: 'Reportes',  screen: 'Reportes',     icon: 'bar-chart-outline' as const },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable
          key={item.screen}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          onPress={() => navigation.navigate(item.screen)}
          accessibilityLabel={item.label}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={20} color={colors.accent} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
      ))}

      {/* Cerrar sesión */}
      <Pressable
        style={({ pressed }) => [styles.item, styles.logoutItem, pressed && styles.itemPressed]}
        onPress={logout}
        accessibilityLabel="Cerrar sesión"
      >
        <View style={styles.logoutIconWrap}>
          <Ionicons name="log-out-outline" size={20} color="#e05050" />
        </View>
        <Text style={styles.logoutLabel}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

export default function MasNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MasMenu"      component={MasMenu}            options={{ title: 'Más' }} />
      <Stack.Screen name="Productores"  component={ProductoresScreen}  options={{ title: 'Productores' }} />
      <Stack.Screen name="Companias"    component={CompaniasScreen}    options={{ title: 'Compañías' }} />
      <Stack.Screen name="ReclamosList" component={ReclamosScreen}     options={{ title: 'Reclamos' }} />
      <Stack.Screen name="ReclamoDetail" component={ReclamoDetailScreen} options={{ title: 'Detalle Reclamo' }} />
      <Stack.Screen name="NuevoReclamo" component={NuevoReclamoScreen} options={{ title: 'Nuevo Reclamo' }} />
      <Stack.Screen name="Reportes"     component={ReportesScreen}     options={{ title: 'Reportes' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    minHeight: 56,
  },
  itemPressed: {
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: font.md,
  },
  logoutItem: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 0,
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(224,80,80,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    flex: 1,
    color: '#e05050',
    fontSize: font.md,
    fontWeight: '600',
  },
});
