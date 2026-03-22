import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function LimitControl({ label, value, unit, color, onDecrease, onIncrease }) {
  return (
    <View style={styles.limitCtrl}>
      <Text style={styles.limitLabel}>{label}</Text>
      <View style={styles.limitRow}>
        <TouchableOpacity style={styles.adjBtn} onPress={onDecrease}>
          <Ionicons name="remove" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.limitVal, { color }]}>
          {value}
          {unit}
        </Text>
        <TouchableOpacity style={styles.adjBtn} onPress={onIncrease}>
          <Ionicons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AlarmSetting({ icon, label, unit, minValue, maxValue, onChangeMin, onChangeMax, color, step, minBound, maxBound }) {
  const adjust = (cur, delta, cb) => {
    const n = Math.round((cur + delta) * 10) / 10;
    if (n >= minBound && n <= maxBound) cb(n);
  };
  return (
    <View style={styles.alarmCard}>
      <View style={styles.alarmHead}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={styles.alarmLabel}>{label}</Text>
      </View>
      <View style={styles.limitsRow}>
        <LimitControl
          label="MIN" value={minValue} unit={unit} color={color}
          onDecrease={() => adjust(minValue, -step, onChangeMin)}
          onIncrease={() => adjust(minValue, step, onChangeMin)}
        />
        <View style={styles.limitDiv} />
        <LimitControl
          label="MAX" value={maxValue} unit={unit} color={color}
          onDecrease={() => adjust(maxValue, -step, onChangeMax)}
          onIncrease={() => adjust(maxValue, step, onChangeMax)}
        />
      </View>
    </View>
  );
}

export default function AlarmsScreen() {
  const { state, updateAlarms, clearLog } = useIncubator();
  const { alarms, alarmLog } = state;
  const [tab, setTab] = useState('settings');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Alarms</Text>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['settings', 'log'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'settings' ? 'Settings' : `Log${alarmLog.length ? ` (${alarmLog.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'settings' ? (
        <View>
          <AlarmSetting
            icon="thermometer" label="Temperature" unit="°C"
            minValue={alarms.tempMin} maxValue={alarms.tempMax}
            onChangeMin={(v) => updateAlarms({ tempMin: v })}
            onChangeMax={(v) => updateAlarms({ tempMax: v })}
            color={colors.danger} step={0.5} minBound={30} maxBound={42}
          />
          <AlarmSetting
            icon="water" label="Humidity" unit="%"
            minValue={alarms.humMin} maxValue={alarms.humMax}
            onChangeMin={(v) => updateAlarms({ humMin: v })}
            onChangeMax={(v) => updateAlarms({ humMax: v })}
            color={colors.primary} step={5} minBound={20} maxBound={90}
          />
          <AlarmSetting
            icon="heart" label="Heart Rate" unit=" BPM"
            minValue={alarms.bpmMin} maxValue={alarms.bpmMax}
            onChangeMin={(v) => updateAlarms({ bpmMin: v })}
            onChangeMax={(v) => updateAlarms({ bpmMax: v })}
            color={colors.danger} step={5} minBound={60} maxBound={220}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="color-palette" size={22} color={colors.warning} />
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.switchLabel}>Jaundice Alert</Text>
                <Text style={styles.switchDesc}>Notify when jaundice is detected</Text>
              </View>
            </View>
            <Switch
              value={alarms.jaundiceAlertEnabled}
              onValueChange={(v) => updateAlarms({ jaundiceAlertEnabled: v })}
              trackColor={{ false: colors.border, true: colors.warning + '60' }}
              thumbColor={alarms.jaundiceAlertEnabled ? colors.warning : colors.textMuted}
            />
          </View>
        </View>
      ) : (
        <View>
          {alarmLog.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearLog}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.clearText}>Clear Log</Text>
            </TouchableOpacity>
          )}
          {alarmLog.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.emptyTitle}>No alarms recorded</Text>
              <Text style={styles.emptySub}>Alarm events will appear here</Text>
            </View>
          ) : (
            alarmLog.map((e, i) => (
              <View key={i} style={styles.logEntry}>
                <View
                  style={[styles.logIcon, {
                    backgroundColor: e.type === 'danger' ? colors.dangerMuted : colors.warningMuted,
                  }]}
                >
                  <Ionicons
                    name={e.icon || 'alert-circle'}
                    size={18}
                    color={e.type === 'danger' ? colors.danger : colors.warning}
                  />
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logMsg}>{e.message}</Text>
                  <Text style={styles.logTime}>{e.time}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 60 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: 4, marginBottom: spacing.lg,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.md },
  tabTextActive: { color: colors.text },

  alarmCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  alarmHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  alarmLabel: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  limitsRow: { flexDirection: 'row', alignItems: 'center' },
  limitCtrl: { flex: 1, alignItems: 'center' },
  limitLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  adjBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  limitVal: { fontSize: fontSize.xl, fontWeight: '800', minWidth: 70, textAlign: 'center' },
  limitDiv: { width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: spacing.sm },

  switchRow: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  switchInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  switchLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  switchDesc: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6,
    marginBottom: spacing.md,
  },
  clearText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },

  logEntry: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  logIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  logInfo: { marginLeft: spacing.md, flex: 1 },
  logMsg: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  logTime: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
});
