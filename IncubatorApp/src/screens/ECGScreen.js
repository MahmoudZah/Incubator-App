import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import ECGWaveform from '../components/ECGWaveform';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>{value}</Text>
    </View>
  );
}

export default function ECGScreen() {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const { state } = useIncubator();
  const { ecgData, heartRate, connected } = state;

  const quality = ecgData.length > 50 ? 'Good' : ecgData.length > 20 ? 'Fair' : 'No Signal';
  const qColor = quality === 'Good' ? colors.success : quality === 'Fair' ? colors.warning : colors.danger;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Background Section */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="pulse-outline" size={32} color={colors.danger} style={styles.topIcon} />
            <Text style={styles.title}>ECG Monitor</Text>
          </View>
        </View>

        {/* Tab Bump imitating the calendar strips */}
        <View style={styles.tabListRow}>
          <View style={styles.activeTabWrap}>
            <Ionicons name="pulse" size={24} color={colors.textDark} />
            <Text style={styles.tabMonth}>LIVE</Text>
          </View>
          <Text style={styles.deadTab}>LOGS</Text>
        </View>
      </View>

      {/* Massive Connected Variant Card */}
      <View style={[styles.mainCard, { minHeight: SCREEN_H - 150 }]}>
        
        {/* BPM Hero */}
        <View style={styles.bpmWrap}>
          <Ionicons name="heart" size={48} color={colors.danger} />
          <Text style={styles.bpmVal}>{heartRate || '--'}</Text>
          <Text style={styles.bpmUnit}>BPM</Text>
        </View>

        {/* Info chips */}
        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <View style={[styles.sigDot, { backgroundColor: qColor }]} />
            <Text style={[styles.infoText, { color: qColor }]}>Quality: {quality}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name={connected ? 'wifi' : 'wifi-outline'} size={14} color={connected ? colors.success : colors.danger} />
            <Text style={[styles.infoText, { color: connected ? colors.success : colors.danger }]}>
              {connected ? 'Sensor Online' : 'Sensor Offline'}
            </Text>
          </View>
        </View>

        {/* ECG Waveform Card matching the bottom card vibe */}
        <View style={styles.ecgWrap}>
          <ECGWaveform
            data={ecgData}
            width={SCREEN_W - spacing.lg * 2 - spacing.md * 2} // Account for paddings
            height={260}
            color={colors.danger}
            bg="transparent"
            showGrid={true}
            gridColor={colors.whiteTranslucent}
          />
        </View>

        <Text style={styles.leadText}>Lead II  •  25mm/s  •  10mm/mV</Text>

        {/* Stats row like the trail cards but horizontal chunks */}
        <View style={styles.statsRow}>
          <StatBox label="PR Int" value="0.16s" />
          <StatBox label="QRS Dur" value="0.08s" />
          <StatBox label="QT Int" value="0.36s" />
        </View>

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
    textShadowColor: colors.danger,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textLight, letterSpacing: 0.5 },
  
  tabListRow: {
    flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xl,
    gap: spacing.xl,
  },
  activeTabWrap: {
    backgroundColor: colors.brand3,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    marginBottom: -1, 
    zIndex: 2,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  tabMonth: { color: colors.textDark, fontSize: fontSize.xs, fontWeight: '800', marginTop: 4 },
  deadTab: { color: colors.textLight, opacity: 0.6, fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.xl },

  mainCard: {
    backgroundColor: colors.brand3,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 0, 
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm, 
  },

  bpmWrap: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    marginBottom: spacing.xl, marginTop: spacing.lg, gap: spacing.sm,
  },
  bpmVal: { fontSize: 80, fontWeight: '900', color: colors.textDark, letterSpacing: -2 },
  bpmUnit: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textMutedDark },
  
  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xl },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.whiteTranslucentStrong, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  sigDot: { width: 8, height: 8, borderRadius: 4 },
  infoText: { fontSize: fontSize.sm, fontWeight: '800' },
  
  ecgWrap: { 
    backgroundColor: colors.whiteTranslucentStrong, 
    borderRadius: 40, padding: spacing.lg, 
    marginHorizontal: spacing.md,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  leadText: {
    color: colors.textMutedDark, fontSize: fontSize.xs, fontWeight: '800',
    textAlign: 'center', letterSpacing: 1, marginBottom: spacing.xl,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md },
  statBox: {
    flex: 1, backgroundColor: colors.whiteTranslucentStrong, borderRadius: 24,
    padding: spacing.md, alignItems: 'center'
  },
  statLabel: { color: colors.textMutedDark, fontSize: fontSize.xs, fontWeight: '800', marginBottom: 4 },
  statVal: { color: colors.textDark, fontSize: fontSize.lg, fontWeight: '900' },
});
