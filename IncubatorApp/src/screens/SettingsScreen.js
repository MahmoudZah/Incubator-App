import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function InputField({ icon, label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={styles.cardItem}>
      <View style={[styles.stripe, { backgroundColor: colors.textDark }]} />
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.textDark} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={colors.textMutedDark}
          multiline={multiline}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const { state, connect, disconnect, updatePatient, sendCalibration } = useIncubator();
  const [ipInput, setIpInput] = useState(state.ipAddress);
  const [name, setName] = useState(state.patient.name);
  const [birth, setBirth] = useState(state.patient.birthDate);
  const [gestAge, setGestAge] = useState(state.patient.gestationalAge);
  const [doctor, setDoctor] = useState(state.patient.doctor);
  const [notes, setNotes] = useState(state.patient.notes);

  const handleConnect = () => (state.connected ? disconnect() : connect(ipInput));
  const handleSave = () => {
    updatePatient({ name, birthDate: birth, gestationalAge: gestAge, doctor, notes });
    Alert.alert('Saved', 'Patient information updated');
  };
  const handleCalibrate = () => {
    Alert.alert(
      'Calibrate Sensor',
      'Have white and black surfaces ready.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Start', onPress: sendCalibration }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Background Section */}
      <View style={styles.topSection}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="settings-outline" size={32} color={colors.primary} style={styles.topIcon} />
            <Text style={styles.title}>Settings</Text>
          </View>
        </View>

        {/* Tab Bump */}
        <View style={styles.tabListRow}>
          <View style={styles.activeTabWrap}>
            <Ionicons name="settings" size={24} color={colors.textDark} />
            <Text style={styles.tabMonth}>APP</Text>
          </View>
          <Text style={styles.deadTab}>PROFILE</Text>
        </View>
      </View>

      {/* Massive Connected Variant Card */}
      <View style={[styles.mainCard, { minHeight: SCREEN_H - 150 }]}>
        
        {/* Connection item matching Trail List */}
        <View style={styles.cardItem}>
          <View style={[styles.stripe, { backgroundColor: colors.primary }]} />
          <View style={styles.iconWrap}>
            <Ionicons name="wifi" size={24} color={colors.textDark} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>ESP32 IP Address</Text>
            <TextInput
              style={styles.fieldInput}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="192.168.x.x"
              placeholderTextColor={colors.textMutedDark}
            />
          </View>
          <TouchableOpacity onPress={handleConnect} style={styles.connActionBtn}>
             <Ionicons name={state.connected ? 'close-circle' : 'link'} size={24} color={state.connected ? colors.danger : colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Patient Form mapping to trailing list items */}
        <Text style={styles.sectionHeader}>Patient Info</Text>
        <View style={styles.listGroup}>
          <InputField icon="person" label="Name" value={name} onChangeText={setName} />
          <InputField icon="calendar" label="Birth" value={birth} onChangeText={setBirth} placeholder="DD/MM/YYYY" />
          <InputField icon="medkit" label="Doctor" value={doctor} onChangeText={setDoctor} />
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <Text style={styles.submitBtnText}>Save Patient Info</Text>
          </TouchableOpacity>
        </View>

        {/* Device Actions */}
        <Text style={styles.sectionHeader}>Device Actions</Text>
        <TouchableOpacity style={styles.cardItem} onPress={handleCalibrate}>
          <View style={[styles.stripe, { backgroundColor: colors.warning }]} />
          <View style={styles.iconWrap}>
            <Ionicons name="color-palette" size={24} color={colors.textDark} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Calibrate Sensor</Text>
            <Text style={styles.desc}>Recalibrate jaundice detection</Text>
          </View>
          <View style={styles.arrowWrap}>
            <Ionicons name="chevron-forward" size={24} color={colors.textMutedDark} />
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
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
    backgroundColor: colors.brand5,
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
    backgroundColor: colors.brand5,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 0, 
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm, 
  },

  sectionHeader: {
    paddingHorizontal: spacing.md, color: colors.textMutedDark, fontSize: fontSize.xs, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.xl,
  },
  
  listGroup: { marginBottom: spacing.md },

  /* List Item styling matching VitalCard / Trail List */
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteTranslucent,
    marginHorizontal: spacing.sm,
  },
  stripe: {
    position: 'absolute', left: 0, top: spacing.lg, bottom: spacing.lg, width: 6, borderRadius: 3,
  },
  iconWrap: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.whiteTranslucent,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10, marginRight: spacing.md,
  },
  textWrap: { flex: 1, justifyContent: 'center' },
  label: { color: colors.textDark, fontSize: fontSize.sm, fontWeight: '800', marginBottom: 2 },
  desc: { color: colors.textMutedDark, fontSize: fontSize.xs, fontWeight: '700' },
  arrowWrap: { alignItems: 'center', justifyContent: 'center' },

  fieldInput: { color: colors.textDark, fontSize: fontSize.lg, fontWeight: '900', paddingVertical: 4 },
  fieldMulti: { minHeight: 60, textAlignVertical: 'top' },

  connActionBtn: {
    backgroundColor: colors.whiteTranslucent,
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },

  submitBtn: {
    backgroundColor: colors.textDark,
    paddingVertical: 18,
    borderRadius: 30, // pill button
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF', fontWeight: '800', fontSize: fontSize.md, letterSpacing: 0.5,
  },
});
