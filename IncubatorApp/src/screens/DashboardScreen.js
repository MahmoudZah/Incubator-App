import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import VitalCard from '../components/VitalCard';
import ECGWaveform from '../components/ECGWaveform';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function StatusChip({ icon, label, active, color }) {
  return (
    <View style={[styles.chip, active && { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Ionicons name={icon} size={14} color={active ? color : colors.textMuted} />
      <Text style={[styles.chipText, active && { color }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { width: SCREEN_W } = useWindowDimensions();
  const { state, connect, disconnect } = useIncubator();
  const {
    connected, temperature, humidity, heartRate,
    jaundiceDetected, lampOn, heaterOn, fanOn,
    ecgData, patient, sensorError, treatmentStartTime, alarms,
  } = state;

  const tempStatus = () => {
    if (sensorError) return 'danger';
    if (temperature < alarms.tempMin || temperature > alarms.tempMax) return 'danger';
    if (temperature < alarms.tempMin + 0.5 || temperature > alarms.tempMax - 0.5) return 'warning';
    return 'normal';
  };
  const humStatus = () => {
    if (humidity < alarms.humMin || humidity > alarms.humMax) return 'danger';
    if (humidity < alarms.humMin + 5 || humidity > alarms.humMax - 5) return 'warning';
    return 'normal';
  };
  const bpmStatus = () => {
    if (!heartRate) return 'inactive';
    if (heartRate < alarms.bpmMin || heartRate > alarms.bpmMax) return 'danger';
    return 'normal';
  };

  const treatMin = treatmentStartTime ? Math.floor((Date.now() - treatmentStartTime) / 60000) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Incubator</Text>
          <Text style={styles.subtitle}>{patient.name || 'No patient assigned'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.connBtn, connected && styles.connBtnOn]}
          onPress={() => (connected ? disconnect() : connect())}
        >
          <View style={[styles.connDot, connected && styles.connDotOn]} />
          <Text style={[styles.connText, connected && styles.connTextOn]}>
            {connected ? 'Connected' : 'Disconnected'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* System Status */}
      <View style={styles.systemBar}>
        <StatusChip icon="flame" label="Heater" active={heaterOn} color={colors.danger} />
        <StatusChip icon="snow" label="Fan" active={fanOn} color={colors.primary} />
        <StatusChip icon="sunny" label="Lamp" active={lampOn} color={colors.warning} />
        {sensorError && <StatusChip icon="alert-circle" label="Sensor Error" active color={colors.danger} />}
      </View>

      {/* Vital Cards */}
      <View style={styles.row}>
        <VitalCard
          icon="thermometer"
          label="Temperature"
          value={sensorError ? '--' : temperature.toFixed(1)}
          unit="°C"
          status={tempStatus()}
        />
        <View style={styles.gap} />
        <VitalCard
          icon="water"
          label="Humidity"
          value={sensorError ? '--' : humidity.toFixed(0)}
          unit="%"
          status={humStatus()}
          color={colors.primary}
        />
      </View>

      <View style={styles.row}>
        <VitalCard
          icon="heart"
          label="Heart Rate"
          value={heartRate || '--'}
          unit="BPM"
          status={bpmStatus()}
        />
        <View style={styles.gap} />
        <VitalCard
          icon="color-palette"
          label="Jaundice"
          value={jaundiceDetected ? 'DETECTED' : 'Normal'}
          status={jaundiceDetected ? 'warning' : 'normal'}
        />
      </View>

      {/* Treatment Timer */}
      {jaundiceDetected && (
        <View style={styles.treatCard}>
          <Ionicons name="timer" size={24} color={colors.warning} />
          <View style={styles.treatInfo}>
            <Text style={styles.treatLabel}>PHOTOTHERAPY DURATION</Text>
            <Text style={styles.treatVal}>
              {Math.floor(treatMin / 60)}h {treatMin % 60}m
            </Text>
          </View>
          <View style={styles.treatBadge}>
            <Text style={styles.treatBadgeText}>ACTIVE</Text>
          </View>
        </View>
      )}

      {/* RGB Color Reading */}
      <View style={styles.rgbCard}>
        <Text style={styles.sectionTitle}>Skin Color Reading</Text>
        <View style={styles.rgbRow}>
          <View style={styles.rgbItem}>
            <View style={[styles.rgbDot, { backgroundColor: `rgb(${state.rgb.r}, 60, 60)` }]} />
            <Text style={styles.rgbVal}>R: {state.rgb.r}</Text>
          </View>
          <View style={styles.rgbItem}>
            <View style={[styles.rgbDot, { backgroundColor: `rgb(60, ${state.rgb.g}, 60)` }]} />
            <Text style={styles.rgbVal}>G: {state.rgb.g}</Text>
          </View>
          <View style={styles.rgbItem}>
            <View style={[styles.rgbDot, { backgroundColor: `rgb(60, 60, ${state.rgb.b})` }]} />
            <Text style={styles.rgbVal}>B: {state.rgb.b}</Text>
          </View>
          <View style={styles.rgbItem}>
            <View
              style={[styles.rgbDot, styles.rgbPreview,
                { backgroundColor: `rgb(${state.rgb.r}, ${state.rgb.g}, ${state.rgb.b})` }]}
            />
            <Text style={styles.rgbVal}>Mix</Text>
          </View>
        </View>
      </View>

      {/* ECG Preview */}
      <View style={styles.ecgSection}>
        <View style={styles.ecgHeader}>
          <Text style={styles.sectionTitle}>ECG Monitor</Text>
          <View style={styles.bpmBadge}>
            <Ionicons name="heart" size={14} color={colors.danger} />
            <Text style={styles.bpmText}>{heartRate || '--'} BPM</Text>
          </View>
        </View>
        <ECGWaveform data={ecgData} width={SCREEN_W - spacing.lg * 2} height={160} color={colors.success} />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  connBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border,
  },
  connBtnOn: { backgroundColor: colors.successMuted, borderColor: colors.success + '40' },
  connDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted, marginRight: spacing.sm },
  connDotOn: { backgroundColor: colors.success },
  connText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  connTextOn: { color: colors.success },
  systemBar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  chipText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  gap: { width: spacing.md },
  treatCard: {
    backgroundColor: colors.warningMuted, borderRadius: borderRadius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.warning + '30', marginBottom: spacing.md,
  },
  treatInfo: { flex: 1, marginLeft: spacing.md },
  treatLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  treatVal: { color: colors.warning, fontSize: fontSize.xl, fontWeight: '800' },
  treatBadge: { backgroundColor: colors.warning, paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  treatBadgeText: { color: '#000', fontSize: fontSize.xs, fontWeight: '800' },
  rgbCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  rgbRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  rgbItem: { alignItems: 'center' },
  rgbDot: { width: 32, height: 32, borderRadius: 16, marginBottom: 6, borderWidth: 2, borderColor: colors.border },
  rgbPreview: { width: 36, height: 36, borderRadius: 18 },
  rgbVal: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600' },
  ecgSection: { marginTop: spacing.sm },
  ecgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  bpmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dangerMuted,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full,
  },
  bpmText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '700' },
});
