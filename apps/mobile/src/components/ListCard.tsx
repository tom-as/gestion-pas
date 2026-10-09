import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius, spacing } from '../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Optional third line — muted meta info */
  meta?: string;
}

export default function ListCard({ title, subtitle, right, meta }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: font.md, fontWeight: font.semibold },
  subtitle: { color: colors.textMuted, fontSize: font.sm, marginTop: 3 },
  meta: { color: colors.textFaint, fontSize: font.xs, marginTop: 3 },
  right: { marginLeft: spacing.md },
});
