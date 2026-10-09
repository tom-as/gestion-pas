/**
 * Screen — base wrapper for every screen.
 * Provides SafeAreaView, background color and optional scroll.
 */
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default: true) */
  scroll?: boolean;
  /** Extra style applied to the inner content container */
  style?: StyleProp<ViewStyle>;
  /** Called when user pull-to-refreshes (only works when scroll=true) */
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Screen({
  children,
  scroll = true,
  style,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const inner = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, style]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fill: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
});
