import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image, Alert } from 'react-native';
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
  const { state, connect, disconnect, clearJaundice, silenceTempAlarm, silenceHumAlarm } = useIncubator();
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

  const isVitalsAlarmActive =
    state.activeAlarms.tempLow || state.activeAlarms.tempHigh ||
    state.activeAlarms.humLow || state.activeAlarms.humHigh ||
    state.activeAlarms.bpmLow || state.activeAlarms.bpmHigh;

  const getBannerMessage = () => {
    if (jaundiceDetected) return { title: 'Jaundice Alert', subtitle: 'Jaundice detected' };

    // Priority: Temp > Hum > BPM
    if (state.activeAlarms.tempHigh && !state.tempAlarmSilenced) return { title: 'Temperature Alarm', subtitle: 'Temperature is hotter than normal' };
    if (state.activeAlarms.tempLow && !state.tempAlarmSilenced) return { title: 'Temperature Alarm', subtitle: 'Temperature is cooler than normal' };

    if (state.activeAlarms.humHigh && !state.humAlarmSilenced) return { title: 'Humidity Alarm', subtitle: 'Humidity is higher than normal' };
    if (state.activeAlarms.humLow && !state.humAlarmSilenced) return { title: 'Humidity Alarm', subtitle: 'Humidity is lower than normal' };

    if (state.activeAlarms.bpmHigh) return { title: 'Heart Rate Alarm', subtitle: 'Heart rate is too high' };
    if (state.activeAlarms.bpmLow) return { title: 'Heart Rate Alarm', subtitle: 'Heart rate is too low' };

    return { title: 'Vitals Warning', subtitle: 'Sensors are out of limits' };
  };
  const bannerMessage = getBannerMessage();

  const showBanner =
    jaundiceDetected ||
    ((state.activeAlarms.tempLow || state.activeAlarms.tempHigh) && !state.tempAlarmSilenced) ||
    ((state.activeAlarms.humLow || state.activeAlarms.humHigh) && !state.humAlarmSilenced) ||
    (state.activeAlarms.bpmLow || state.activeAlarms.bpmHigh);

  return (
    <View style={styles.container}>
      {showBanner && (
        <View style={styles.alarmBanner}>
          <Ionicons name="warning" size={36} color={colors.white} />
          <View style={styles.alarmBannerTextWrap}>
            <Text style={styles.alarmBannerTitle}>{bannerMessage.title}</Text>
            <Text style={styles.alarmBannerSubtitle}>{bannerMessage.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.alarmBannerBtn} onPress={() => { silenceTempAlarm(); silenceHumAlarm(); }}>
            <Text style={styles.alarmBannerBtnText}>SKIP</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <View style={styles.jaundiceRow}>
              <VitalCard
                icon="thermometer"
                label="Environmental Temperature"
                value={sensorError ? '--' : temperature.toFixed(1)}
                unit="°C"
                status={tempStatus()}
                color={tempStatus() === 'danger' ? colors.danger : colors.textDark}
              />
              {/* Restored Mute Button */}
              {(state.activeAlarms.tempLow || state.activeAlarms.tempHigh) && !state.tempAlarmSilenced && (
                <TouchableOpacity
                  style={[styles.resetBtn, { zIndex: 100, elevation: 10, padding: 8 }]}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  onPress={() => silenceTempAlarm()}
                >
                  <Ionicons name="notifications-off-circle" size={32} color={colors.warning} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.jaundiceRow}>
              <VitalCard
                icon="water"
                label="Humidity Level"
                value={sensorError ? '--' : humidity.toFixed(0)}
                unit="%"
                status={humStatus()}
                color={colors.primary}
              />
              {(state.activeAlarms.humLow || state.activeAlarms.humHigh) && !state.humAlarmSilenced && (
                <TouchableOpacity
                  style={[styles.resetBtn, { zIndex: 100, elevation: 10, padding: 8 }]}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  onPress={() => silenceHumAlarm()}
                >
                  <Ionicons name="notifications-off-circle" size={32} color={colors.warning} />
                </TouchableOpacity>
              )}
            </View>
            <VitalCard
              icon="heart"
              label="Heart Rate"
              value={heartRate || '--'}
              unit="BPM"
              status={bpmStatus()}
              color={colors.danger}
            />
            <View style={styles.jaundiceRow}>
              <VitalCard
                icon="color-palette"
                label="Jaundice Status"
                value={jaundiceDetected ? 'DETECTED' : 'Normal'}
                unit=""
                status={jaundiceDetected ? 'warning' : 'normal'}
                color={jaundiceDetected ? colors.warning : colors.success}
              />
              {jaundiceDetected && (
                <TouchableOpacity style={styles.resetBtn} onPress={() => {
                  Alert.alert('Reset Jaundice', 'Are you sure you want to clear the detection status?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', onPress: () => clearJaundice() }
                  ]);
                }}>
                  <Ionicons name="refresh-circle" size={28} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
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
    </View>
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
  jaundiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 2,
  },
  alarmBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 1000, elevation: 20,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 65, // Taller banner
    paddingBottom: 25,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30, // More attractive, rounded bottom
    borderBottomRightRadius: 30,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  alarmBannerTextWrap: {
    flex: 1,
    paddingHorizontal: 15,
  },
  alarmBannerTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '900',
    marginBottom: 4,
  },
  alarmBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  alarmBannerBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  alarmBannerBtnText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: fontSize.sm,
  },
});
