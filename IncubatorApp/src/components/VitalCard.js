import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../theme';

const statusColors = {
  normal: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  inactive: colors.textMuted,
};

export default function VitalCard({ icon, label, value, unit, status = 'inactive', color }) {
  const sColor = color || (statusColors[status] || colors.textDark);

  return (
    <View style={styles.card}>
      {/* Left colored stripe like the trail list */}
      <View style={[styles.stripe, { backgroundColor: sColor }]} />
      
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.textDark} />
      </View>

      {/* Text Content */}
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueWrap}>
          <Text style={styles.value}>{value}</Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </Text>
      </View>

      {/* Trailing Icon (Arrow like the image) */}
      <View style={styles.arrowWrap}>
        <Ionicons name="chevron-forward" size={24} color={colors.textMutedDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteTranslucent,
    marginHorizontal: spacing.sm,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: spacing.lg,
    bottom: spacing.lg,
    width: 6,
    borderRadius: 3,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.whiteTranslucent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: colors.textDark,
    fontSize: fontSize.md,
    fontWeight: '800',
    marginBottom: 2,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: colors.textMutedDark,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginRight: 4,
  },
  unit: {
    color: colors.textMutedDark,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  arrowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
