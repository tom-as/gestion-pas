import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../theme/tokens';

interface Props {
  message?: string;
}

export default function ErrorState({ message = 'Ocurrió un error.' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  text: { color: colors.danger, fontSize: font.md, textAlign: 'center' },
});
