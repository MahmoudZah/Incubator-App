import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import VitalCard from '../components/VitalCard';
import ECGWaveform from '../components/ECGWaveform';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function StatusChip({ icon, active, color }) {
  return (
    <View style={[styles.chip, active && { backgroundColor: color }]}>
      <Ionicons name={icon} size={28} color={active ? '#FFF' : colors.textMuted} />
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const { state, connect, disconnect } = useIncubator();
  const {
    connected, temperature, humidity, heartRate,
    jaundiceDetected, lampOn, heaterOn, fanOn, humidifierOn,
    ecgData, patient, sensorError, alarms,
  } = state;

  const tempStatus = () => {
    if (sensorError) return 'danger';
    if (temperature < alarms.tempMin || temperature > alarms.tempMax) return 'danger';
    return 'normal';
  };
  const humStatus = () => {
    if (humidity < alarms.humMin || humidity > alarms.humMax) return 'danger';
    return 'normal';
  };
  const bpmStatus = () => {
    if (!heartRate) return 'inactive';
    if (heartRate < alarms.bpmMin || heartRate > alarms.bpmMax) return 'danger';
    return 'normal';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Background Section (Navy logic) */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
             <Image source={require('../../assets/baby_avatar.png')} style={styles.babyIcon} />
             <Text style={styles.title}>Incubator</Text>
          </View>
          <TouchableOpacity
            style={[styles.connBtn, connected && styles.connBtnOn]}
            onPress={() => (connected ? disconnect() : connect())}
          >
            <View style={[styles.connDot, connected && styles.connDotOn]} />
            <Text style={[styles.connText, connected && styles.connTextOn]}>
              {connected ? 'Live' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{patient.name || 'No patient assigned'}</Text>

        {/* Tab Bump with Glow */}
        <View style={styles.tabListRow}>
          <View style={styles.activeTabWrap}>
            <Text style={styles.tabDate}>1</Text>
            <Text style={styles.tabMonth}>DAY</Text>
          </View>
          <Text style={styles.deadTab}>2</Text>
          <Text style={styles.deadTab}>3</Text>
          <Text style={styles.deadTab}>4</Text>
        </View>
      </View>

      {/* Massive Connected Variant Card */}
      <View style={[styles.mainCard, { minHeight: SCREEN_H - 150 }]}>
        
        {/* System Chips rendered as large pill/circles */}
        <View style={styles.chipRow}>
          <StatusChip icon="flame" active={heaterOn} color={colors.danger} />
          <StatusChip icon="snow" active={fanOn} color={colors.primary} />
          <StatusChip icon="sunny" active={lampOn} color={colors.warning} />
          <StatusChip icon="water" active={humidifierOn} color={'#64B5F6'} />
        </View>

        {/* Column List matching the "Trail List" exactly */}
        <View style={styles.listWrap}>
          <VitalCard
            icon="thermometer"
            label="Environmental Temperature"
            value={sensorError ? '--' : temperature.toFixed(1)}
            unit="°C"
            status={tempStatus()}
            color={tempStatus() === 'danger' ? colors.danger : colors.textDark}
          />
          <VitalCard
             icon="water"
             label="Humidity Level"
             value={sensorError ? '--' : humidity.toFixed(0)}
             unit="%"
             status={humStatus()}
             color={colors.primary}
           />
           <VitalCard
             icon="heart"
             label="Heart Rate"
             value={heartRate || '--'}
             unit="BPM"
             status={bpmStatus()}
             color={colors.danger}
           />
           <VitalCard
             icon="color-palette"
             label="Jaundice Status"
             value={jaundiceDetected ? 'DETECTED' : 'Normal'}
             unit=""
             status={jaundiceDetected ? 'warning' : 'normal'}
             color={jaundiceDetected ? colors.warning : colors.success}
           />
        </View>

        {/* ECG Preview */}
        <TouchableOpacity style={styles.largeBottomCard} onPress={() => navigation.navigate('ECG')}>
          <View style={styles.ecgHeader}>
            <Text style={styles.ecgTitle}>ECG Monitor</Text>
            <View style={styles.bpmBadge}>
              <Ionicons name="heart" size={14} color={colors.danger} />
              <Text style={styles.bpmText}>{heartRate || '--'} BPM</Text>
            </View>
          </View>
          <ECGWaveform data={ecgData} width={SCREEN_W - spacing.lg * 2 - spacing.md * 2} height={100} color={colors.primary} bg="transparent" showGrid={false} />
          <View style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>Expand ECG</Text>
          </View>
        </TouchableOpacity>

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
  babyIcon: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: colors.primary,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textLight, letterSpacing: 0.5 },
  subtitle: { fontSize: fontSize.sm, color: colors.textLight, opacity: 0.8, marginTop: 4, fontWeight: '700' },
  
  connBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.whiteTranslucentStrong,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  connBtnOn: { backgroundColor: colors.whiteTranslucentStrong, borderWidth: 1, borderColor: colors.success },
  connDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textLight, opacity: 0.6, marginRight: spacing.sm },
  connDotOn: { backgroundColor: colors.success, opacity: 1 },
  connText: { color: colors.textLight, opacity: 0.6, fontSize: fontSize.sm, fontWeight: '800' },
  connTextOn: { color: colors.textLight, opacity: 1 },

  tabListRow: {
    flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xl,
    gap: spacing.xl,
  },
  activeTabWrap: {
    backgroundColor: colors.brand1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    marginBottom: -1, // Crucial for perfect visual blend
    zIndex: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  tabDate: { color: colors.textDark, fontSize: fontSize.xl, fontWeight: '900' },
  tabMonth: { color: colors.textDark, fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  deadTab: { color: colors.textLight, opacity: 0.6, fontSize: fontSize.lg, fontWeight: '800', marginBottom: spacing.xl },

  mainCard: {
    backgroundColor: colors.brand1,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 0, 
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm, 
  },

  chipRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xl },
  chip: {
    width: 60, height: 60, borderRadius: 30, // Perfect circle like right image
    backgroundColor: colors.whiteTranslucentStrong,
    alignItems: 'center', justifyContent: 'center',
  },

  listWrap: {
    marginBottom: spacing.xxl,
  },

  largeBottomCard: {
    backgroundColor: colors.whiteTranslucentStrong, 
    borderRadius: 40, padding: spacing.lg,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  ecgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: spacing.md },
  ecgTitle: { fontSize: fontSize.lg, fontWeight: '900', color: colors.textDark },
  bpmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.whiteTranslucent,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full,
  },
  bpmText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '800' },
  
  joinBtn: {
    backgroundColor: colors.whiteTranslucentStrong,
    borderWidth: 1, borderColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  joinBtnText: {
    color: colors.primary, fontSize: fontSize.md, fontWeight: '900', letterSpacing: 0.5,
  },
});
