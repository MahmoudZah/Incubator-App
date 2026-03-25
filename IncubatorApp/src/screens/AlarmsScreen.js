import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function AlarmItem({ title, desc, icon, active, type }) {
  const isDanger = type === 'danger';
  const color = isDanger ? colors.danger : colors.warning;
  if (!active) return null;
  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={[styles.iconWrap, { backgroundColor: color + '33' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
      <View style={styles.arrowWrap}>
        <Ionicons name="alert-circle" size={24} color={color} />
      </View>
    </View>
  );
}

export default function AlarmsScreen() {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const { state } = useIncubator();
  const { connected, jaundiceDetected, sensorError } = state;

  const hasAlarms = jaundiceDetected || sensorError || !connected;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Background / Tab list area */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
             <Ionicons name="notifications-outline" size={32} color={colors.warning} style={styles.alertIcon} />
             <Text style={styles.title}>System Alerts</Text>
          </View>
        </View>

        {/* Tab Bump imitating the calendar strips */}
        <View style={styles.tabListRow}>
          <View style={styles.activeTabWrap}>
            <Ionicons name="notifications" size={24} color={colors.textDark} />
            <Text style={styles.tabMonth}>ALERTS</Text>
          </View>
          <Text style={styles.deadTab}>LOGS</Text>
        </View>
      </View>

      {/* Main Container blending with Active Tab */}
      <View style={[styles.mainCard, { minHeight: SCREEN_H - 150 }]}>
        <View style={styles.listWrap}>
          <AlarmItem
            active={!connected}
            title="Connection Lost"
            desc="ESP32 incubator is disconnected"
            icon="wifi"
            type="danger"
          />
          <AlarmItem
            active={sensorError}
            title="Sensor Error"
            desc="DHT22 or MAX30102 unreadable"
            icon="warning"
            type="danger"
          />
          <AlarmItem
            active={jaundiceDetected}
            title="Jaundice Detected"
            desc="Skin color readings indicate jaundice risk"
            icon="color-palette"
            type="warning"
          />
        </View>

        {!hasAlarms && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={80} color={colors.success} />
            <Text style={styles.emptyTitle}>All Systems Normal</Text>
            <Text style={styles.emptySub}>No active alarms or warnings</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingTop: 60, paddingBottom: 0 },
  topSection: { paddingHorizontal: spacing.lg },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertIcon: {
    textShadowColor: colors.warning,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textLight, letterSpacing: 0.5 },
  
  tabListRow: {
    flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xl,
    gap: spacing.xl,
  },
  activeTabWrap: {
    backgroundColor: colors.brand2,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    marginBottom: -1, 
    zIndex: 2,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  tabMonth: { color: colors.textDark, fontSize: fontSize.xs, fontWeight: '800', marginTop: 4 },
  deadTab: { color: colors.textLight, opacity: 0.6, fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.xl },

  mainCard: {
    backgroundColor: colors.brand2,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 0, 
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm, 
  },

  listWrap: {
    marginBottom: spacing.xxl,
  },

  empty: { alignItems: 'center', paddingVertical: 100 },
  emptyTitle: { color: colors.textDark, fontSize: fontSize.xl, fontWeight: '900', marginTop: spacing.md },
  emptySub: { color: colors.textMutedDark, fontSize: fontSize.sm, marginTop: 4, fontWeight: '700' },

  /* List Item styling matching VitalCard */
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
    position: 'absolute', left: 0, top: spacing.lg, bottom: spacing.lg, width: 6, borderRadius: 3,
  },
  iconWrap: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10, marginRight: spacing.md,
  },
  textWrap: { flex: 1, justifyContent: 'center' },
  label: { color: colors.textDark, fontSize: fontSize.md, fontWeight: '800', marginBottom: 2 },
  desc: { color: colors.textMutedDark, fontSize: fontSize.xs, fontWeight: '700' },
  arrowWrap: { alignItems: 'center', justifyContent: 'center' },
});
