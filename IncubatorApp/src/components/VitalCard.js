import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../theme';

const statusColors = {
  normal: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  inactive: colors.textMuted,
};

const statusBgs = {
  normal: colors.successMuted,
  warning: colors.warningMuted,
  danger: colors.dangerMuted,
  inactive: colors.primaryMuted,
};

export default function VitalCard({ icon, label, value, unit, status = 'inactive', color }) {
  const sColor = color || statusColors[status] || colors.textSecondary;
  const bgColor = statusBgs[status] || colors.primaryMuted;

  return (
    <View style={[styles.card, { borderColor: sColor + '25' }]}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={sColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: sColor }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <View style={[styles.dot, { backgroundColor: sColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 130,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
  dot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
