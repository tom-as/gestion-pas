/**
 * ScreenHeader — consistent header for list/detail screens.
 * Sits below the SafeArea, above the main content.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing } from '../theme/tokens';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back chevron on the left */
  onBack?: () => void;
  /** Action button on the right */
  action?: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    label?: string;
  };
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left slot */}
      <View style={styles.side}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>

      {/* Centre */}
      <View style={styles.centre}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right slot */}
      <View style={styles.side}>
        {action && (
          <Pressable
            onPress={action.onPress}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={22} color={colors.accent} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  side: {
    width: 40,
    alignItems: 'center',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: font.lg,
    fontWeight: font.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: font.sm,
    marginTop: 2,
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
