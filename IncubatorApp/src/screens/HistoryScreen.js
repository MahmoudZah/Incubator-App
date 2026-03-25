import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import { colors, spacing, borderRadius, fontSize } from '../theme';

const chartTypes = [
  { key: 'temp', icon: 'thermometer', label: 'Temp', suffix: '°C', color: colors.danger },
  { key: 'hum', icon: 'water', label: 'Hum', suffix: '%', color: colors.primary },
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
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const CHART_W = SCREEN_W - spacing.lg * 2 - spacing.md * 2;
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
      datasets: [{ data: values, color: () => cfg.color, strokeWidth: 3 }],
    }
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Background Section */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="stats-chart-outline" size={32} color={colors.primary} style={styles.topIcon} />
            <Text style={styles.title}>History</Text>
          </View>
        </View>

        {/* Tab Bump */}
        <View style={styles.tabListRow}>
          <View style={styles.activeTabWrap}>
            <Ionicons name="bar-chart" size={24} color={colors.textDark} />
            <Text style={styles.tabMonth}>DATA</Text>
          </View>
          <Text style={styles.deadTab}>LOGS</Text>
        </View>
      </View>

      {/* Massive Connected Variant Card */}
      <View style={[styles.mainCard, { minHeight: SCREEN_H - 150 }]}>
        
        {/* Selector */}
        <View style={styles.selRow}>
          {chartTypes.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.selBtn, active === c.key && styles.selBtnActive]}
              onPress={() => setActive(c.key)}
            >
              <Ionicons name={c.icon} size={18} color={active === c.key ? '#FFF' : colors.textDark} />
              {active === c.key && <Text style={styles.selTextActive}>{c.label}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Current" value={`${current}${cfg.suffix}`} color={colors.textDark} />
          <StatCard label="Min" value={`${min}${cfg.suffix}`} color={colors.textMutedDark} />
          <StatCard label="Max" value={`${max}${cfg.suffix}`} color={colors.textMutedDark} />
          <StatCard label="Avg" value={`${avg}${cfg.suffix}`} color={colors.textMutedDark} />
        </View>

        {/* Chart Card */}
        {chartData ? (
          <View style={styles.chartWrap}>
            <LineChart
              data={chartData}
              width={CHART_W}
              height={260}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.whiteTranslucentStrong,
                backgroundGradientFromOpacity: 0.0,
                backgroundGradientTo: colors.whiteTranslucentStrong,
                backgroundGradientToOpacity: 0.0,
                decimalCount: 1,
                color: (o) => `rgba(46, 46, 46, ${o})`, // Dark grid/lines
                labelColor: () => colors.textDark,
                propsForDots: { r: '5', strokeWidth: '2', stroke: colors.textDark },
                propsForBackgroundLines: { stroke: colors.whiteTranslucent, strokeWidth: 1 },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="analytics-outline" size={80} color={colors.whiteTranslucent} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySub}>Historical data will appear here once the incubator starts recording</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
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
  topIcon: {
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textLight, letterSpacing: 0.5 },
  
  tabListRow: {
    flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xl,
    gap: spacing.xl,
  },
  activeTabWrap: {
    backgroundColor: colors.brand4,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    marginBottom: -1, 
    zIndex: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  tabMonth: { color: colors.textDark, fontSize: fontSize.xs, fontWeight: '800', marginTop: 4 },
  deadTab: { color: colors.textLight, opacity: 0.6, fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.xl },

  mainCard: {
    backgroundColor: colors.brand4,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 0, 
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm, 
  },

  selRow: {
    flexDirection: 'row', backgroundColor: colors.whiteTranslucent,
    borderRadius: 30, padding: 6, marginBottom: spacing.xl, marginHorizontal: spacing.md,
  },
  selBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 30, 
  },
  selBtnActive: { backgroundColor: colors.textDark },
  selTextActive: { color: '#FFF', fontWeight: '800', fontSize: fontSize.sm },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, marginHorizontal: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.whiteTranslucentStrong, borderRadius: 24,
    padding: spacing.sm, alignItems: 'center', paddingVertical: spacing.md,
  },
  statLabel: { color: colors.textMutedDark, fontSize: fontSize.xs, fontWeight: '800', marginBottom: 4 },
  statVal: { color: colors.textDark, fontSize: fontSize.md, fontWeight: '900' },

  chartWrap: { 
    alignItems: 'center', borderRadius: 40, overflow: 'hidden', 
    backgroundColor: colors.whiteTranslucentStrong, paddingVertical: spacing.lg,
    marginHorizontal: spacing.md,
  },
  chart: { borderRadius: 40 },

  empty: { alignItems: 'center', paddingVertical: 100 },
  emptyTitle: { color: colors.textDark, fontSize: fontSize.xl, fontWeight: '900', marginTop: spacing.md },
  emptySub: { color: colors.textMutedDark, fontSize: fontSize.sm, marginTop: 4, textAlign: 'center', fontWeight: '700', paddingHorizontal: 40 },
});
