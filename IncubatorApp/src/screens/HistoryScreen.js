import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import { colors, spacing, borderRadius, fontSize } from '../theme';

const chartTypes = [
  { key: 'temp', icon: 'thermometer', label: 'Temp', suffix: '°C', color: colors.danger },
  { key: 'hum', icon: 'water', label: 'Humidity', suffix: '%', color: colors.primary },
  { key: 'bpm', icon: 'heart', label: 'BPM', suffix: ' BPM', color: colors.success },
];

function StatCard({ label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statVal, color && { color }]}>{value}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { width } = useWindowDimensions();
  const CHART_W = width - spacing.lg * 2;
  const { state } = useIncubator();
  const [active, setActive] = useState('temp');

  const cfg = chartTypes.find((c) => c.key === active);
  const historyMap = { temp: state.tempHistory, hum: state.humHistory, bpm: state.bpmHistory };
  const history = historyMap[active] || [];

  const hasData = history.length > 1;
  const values = history.map((h) => h.value);
  const current = hasData ? values[values.length - 1].toFixed(1) : '--';
  const min = hasData ? Math.min(...values).toFixed(1) : '--';
  const max = hasData ? Math.max(...values).toFixed(1) : '--';
  const avg = hasData ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1) : '--';

  const labelStep = Math.max(1, Math.floor(history.length / 6));
  const chartData = hasData
    ? {
      labels: history.filter((_, i) => i % labelStep === 0).map((h) => h.time),
      datasets: [{ data: values, color: () => cfg.color, strokeWidth: 2 }],
    }
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>

      {/* Selector */}
      <View style={styles.selRow}>
        {chartTypes.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.selBtn, active === c.key && styles.selBtnActive]}
            onPress={() => setActive(c.key)}
          >
            <Ionicons name={c.icon} size={16} color={active === c.key ? colors.text : colors.textMuted} />
            <Text style={[styles.selText, active === c.key && styles.selTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Current" value={`${current}${cfg.suffix}`} color={cfg.color} />
        <StatCard label="Min" value={`${min}${cfg.suffix}`} />
        <StatCard label="Max" value={`${max}${cfg.suffix}`} />
        <StatCard label="Avg" value={`${avg}${cfg.suffix}`} />
      </View>

      {/* Chart */}
      {chartData ? (
        <View style={styles.chartWrap}>
          <LineChart
            data={chartData}
            width={CHART_W}
            height={240}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalCount: 1,
              color: (o) => `rgba(139, 157, 195, ${o})`,
              labelColor: () => colors.textSecondary,
              propsForDots: { r: '3', strokeWidth: '1', stroke: cfg.color },
              propsForBackgroundLines: { stroke: colors.border, strokeWidth: 0.5 },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="analytics-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySub}>
            Historical data will appear here once{'\n'}the incubator starts recording
          </Text>
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

  selRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: 4, marginBottom: spacing.lg,
  },
  selBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: borderRadius.sm,
  },
  selBtnActive: { backgroundColor: colors.primary },
  selText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  selTextActive: { color: colors.text },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', marginBottom: 4 },
  statVal: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },

  chartWrap: { alignItems: 'center' },
  chart: { borderRadius: borderRadius.lg },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, textAlign: 'center' },
});
