import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import ECGWaveform from '../components/ECGWaveform';
import { colors, spacing, borderRadius, fontSize } from '../theme';

export default function ECGScreen() {
  const { width: SCREEN_W } = useWindowDimensions();
  const { state } = useIncubator();
  const { ecgData, heartRate, connected } = state;

  const quality = ecgData.length > 50 ? 'Good' : ecgData.length > 20 ? 'Fair' : 'No Signal';
  const qColor = quality === 'Good' ? colors.success : quality === 'Fair' ? colors.warning : colors.danger;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ECG Monitor</Text>

        {/* BPM */}
        <View style={styles.bpmWrap}>
          <Ionicons name="heart" size={36} color={colors.danger} />
          <Text style={styles.bpmVal}>{heartRate || '--'}</Text>
          <Text style={styles.bpmUnit}>BPM</Text>
        </View>

        {/* Info chips */}
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <View style={[styles.sigDot, { backgroundColor: qColor }]} />
            <Text style={[styles.infoText, { color: qColor }]}>Signal: {quality}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name={connected ? 'wifi' : 'wifi-outline'} size={14} color={connected ? colors.success : colors.danger} />
            <Text style={[styles.infoText, { color: connected ? colors.success : colors.danger }]}>
              {connected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* ECG Waveform */}
        <View style={styles.ecgWrap}>
          <ECGWaveform
            data={ecgData}
            width={SCREEN_W - spacing.lg * 2}
            height={300}
            color={colors.success}
            showGrid
          />
        </View>

        {/* Lead info */}
        <Text style={styles.leadText}>Lead II  |  25mm/s  |  10mm/mV</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="PR Interval" value="0.16s" />
          <StatBox label="QRS Duration" value="0.08s" />
          <StatBox label="QT Interval" value="0.36s" />
        </View>
      </View>
    </View>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 60 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  bpmWrap: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    marginBottom: spacing.lg, gap: spacing.sm,
  },
  bpmVal: { fontSize: 64, fontWeight: '900', color: colors.text },
  bpmUnit: { fontSize: fontSize.xl, fontWeight: '600', color: colors.textSecondary },
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border,
  },
  sigDot: { width: 8, height: 8, borderRadius: 4 },
  infoText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  ecgWrap: { alignItems: 'center', marginBottom: spacing.md },
  leadText: {
    color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600',
    textAlign: 'center', letterSpacing: 1, marginBottom: spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 },
  statVal: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
});
