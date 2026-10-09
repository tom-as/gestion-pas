import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  EstadoPoliza,
  EstadoSiniestro,
  EstadoReclamo,
  EstadoCuota,
} from '@gestion-pas/types';
import { colors, font, radius } from '../theme/tokens';

type BadgeValue = EstadoPoliza | EstadoSiniestro | EstadoReclamo | EstadoCuota | string;

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  // EstadoPoliza
  activa:      { bg: colors.successDim, text: colors.success },
  suspendida:  { bg: colors.warningDim, text: colors.warning },
  anulada:     { bg: colors.dangerDim,  text: colors.danger  },
  // EstadoSiniestro / EstadoReclamo
  abierto:     { bg: colors.accentDim,  text: colors.accent  },
  en_gestion:  { bg: colors.warningDim, text: colors.warning },
  resuelto:    { bg: colors.successDim, text: colors.success },
  rechazado:   { bg: colors.dangerDim,  text: colors.danger  },
  // EstadoCuota
  pendiente:   { bg: colors.accentDim,  text: colors.accent  },
  pagada:      { bg: colors.successDim, text: colors.success },
  rechazada:   { bg: colors.dangerDim,  text: colors.danger  },
  vencida:     { bg: colors.urgentDim,  text: colors.urgent  },
};

const LABEL_MAP: Record<string, string> = {
  activa: 'Activa', suspendida: 'Suspendida', anulada: 'Anulada',
  abierto: 'Abierto', en_gestion: 'En gestión', resuelto: 'Resuelto', rechazado: 'Rechazado',
  pendiente: 'Pendiente', pagada: 'Pagada', rechazada: 'Rechazada', vencida: 'Vencida',
};

interface Props {
  value: BadgeValue;
}

export default function StatusBadge({ value }: Props) {
  const key = String(value).toLowerCase();
  const c = COLOR_MAP[key] ?? { bg: colors.borderStrong, text: colors.textSecondary };
  const label = LABEL_MAP[key] ?? value;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  text: { fontSize: font.sm, fontWeight: font.semibold },
});
