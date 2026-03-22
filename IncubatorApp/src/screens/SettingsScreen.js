import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIncubator } from '../context/IncubatorContext';
import { colors, spacing, borderRadius, fontSize } from '../theme';

function InputField({ icon, label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function SettingsScreen() {
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
      'Calibrate Color Sensor',
      'This will start calibration on the ESP32. Have white and black surfaces ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: sendCalibration },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Connection */}
      <Text style={styles.section}>Connection</Text>
      <View style={styles.card}>
        <View style={styles.ipRow}>
          <Ionicons name="wifi" size={20} color={colors.primary} />
          <TextInput
            style={styles.ipInput}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="ESP32 IP Address"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity
          style={[styles.btn, state.connected && styles.btnDanger]}
          onPress={handleConnect}
        >
          <Ionicons
            name={state.connected ? 'close-circle' : 'link'}
            size={18}
            color={state.connected ? colors.danger : colors.primary}
          />
          <Text style={[styles.btnText, state.connected && styles.btnTextDanger]}>
            {state.connected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
        {state.connected && (
          <View style={styles.connStatus}>
            <View style={styles.connDot} />
            <Text style={styles.connText}>Connected to {state.ipAddress}</Text>
          </View>
        )}
      </View>

      {/* Patient */}
      <Text style={styles.section}>Patient Information</Text>
      <View style={styles.card}>
        <InputField icon="person" label="Name" value={name} onChangeText={setName} />
        <InputField icon="calendar" label="Birth Date" value={birth} onChangeText={setBirth} placeholder="DD/MM/YYYY" />
        <InputField icon="time" label="Gestational Age" value={gestAge} onChangeText={setGestAge} placeholder="e.g. 34 weeks" />
        <InputField icon="medkit" label="Attending Doctor" value={doctor} onChangeText={setDoctor} />
        <InputField icon="document-text" label="Notes" value={notes} onChangeText={setNotes} multiline />
        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Ionicons name="save" size={18} color={colors.primary} />
          <Text style={styles.btnText}>Save Patient Info</Text>
        </TouchableOpacity>
      </View>

      {/* Device */}
      <Text style={styles.section}>Device</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={handleCalibrate}>
          <View style={[styles.actionIcon, { backgroundColor: colors.warningMuted }]}>
            <Ionicons name="color-palette" size={20} color={colors.warning} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionLabel}>Calibrate Color Sensor</Text>
            <Text style={styles.actionDesc}>Recalibrate jaundice detection</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App Version</Text>
          <Text style={styles.aboutVal}>1.0.0</Text>
        </View>
        <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.aboutLabel}>Firmware</Text>
          <Text style={styles.aboutVal}>ESP32 v1.0</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: 60 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  section: {
    color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  ipRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  ipInput: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: 14, marginLeft: spacing.sm },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryMuted, paddingVertical: 14, borderRadius: borderRadius.md,
  },
  btnDanger: { backgroundColor: colors.dangerMuted },
  btnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  btnTextDanger: { color: colors.danger },
  connStatus: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm, gap: 6,
  },
  connDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  connText: { color: colors.success, fontSize: fontSize.sm, fontWeight: '600' },

  field: { marginBottom: spacing.md },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  fieldInput: {
    backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.md,
    padding: spacing.md, color: colors.text, fontSize: fontSize.md,
  },
  fieldMulti: { minHeight: 80, textAlignVertical: 'top' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actionInfo: { flex: 1, marginLeft: spacing.md },
  actionLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  actionDesc: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },

  aboutRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  aboutLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  aboutVal: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
});
