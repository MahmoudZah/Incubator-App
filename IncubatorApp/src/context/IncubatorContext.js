import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wsService from '../services/websocket';
import { Audio } from 'expo-av';

const IncubatorContext = createContext();

const MAX_ECG_POINTS = 600;
const MAX_HISTORY_POINTS = 360;
const MAX_LOG_ENTRIES = 100;

const initialState = {
  connected: false,
  ipAddress: '192.168.4.1',

  temperature: 0,
  humidity: 0,
  heartRate: 0,
  rgb: { r: 0, g: 0, b: 0 },
  jaundiceDetected: false,
  lampOn: false,
  heaterOn: false,
  fanOn: false,
  humidifierOn: false,
  sensorError: false,

  ecgData: [],

  alarms: {
    tempMin: 35.5,
    tempMax: 37.5,
    humMin: 40,
    humMax: 70,
    bpmMin: 100,
    bpmMax: 180,
    jaundiceAlertEnabled: true,
  },

  tempHistory: [],
  humHistory: [],
  bpmHistory: [],

  alarmLog: [],
  activeAlarms: {},

  patient: {
    name: '',
    birthDate: '',
    gestationalAge: '',
    doctor: '',
    notes: '',
  },

  treatmentStartTime: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };

    case 'SET_IP':
      return { ...state, ipAddress: action.payload };

    case 'UPDATE_VITALS': {
      const d = action.payload;
      return {
        ...state,
        temperature: d.temp ?? state.temperature,
        humidity: d.hum ?? state.humidity,
        heartRate: d.bpm ?? state.heartRate,
        rgb: d.rgb ?? state.rgb,
        jaundiceDetected: d.jaundice ?? state.jaundiceDetected,
        lampOn: d.lamp ?? state.lampOn,
        heaterOn: d.heater ?? state.heaterOn,
        fanOn: d.fan ?? state.fanOn,
        humidifierOn: d.humidifier ?? state.humidifierOn,
        sensorError: d.sensorError ?? false,
        treatmentStartTime:
          d.jaundice && !state.jaundiceDetected
            ? Date.now()
            : d.jaundice
              ? state.treatmentStartTime
              : null,
      };
    }

    case 'UPDATE_ECG': {
      const { samples, bpm } = action.payload;
      const newEcg = [...state.ecgData, ...samples];
      // Trim from the front if over capacity
      while (newEcg.length > MAX_ECG_POINTS) newEcg.shift();
      return {
        ...state,
        ecgData: newEcg,
        heartRate: bpm ?? state.heartRate,
      };
    }

    case 'ADD_HISTORY': {
      const { temp, hum, bpm, time } = action.payload;
      const addCapped = (arr, val) => {
        const next = [...arr, { value: val, time }];
        if (next.length > MAX_HISTORY_POINTS) next.shift();
        return next;
      };
      return {
        ...state,
        tempHistory: addCapped(state.tempHistory, temp),
        humHistory: addCapped(state.humHistory, hum),
        bpmHistory: addCapped(state.bpmHistory, bpm),
      };
    }

    case 'ADD_ALARM_LOG': {
      const newLog = [action.payload, ...state.alarmLog];
      if (newLog.length > MAX_LOG_ENTRIES) newLog.pop();
      return { ...state, alarmLog: newLog };
    }

    case 'SET_ACTIVE_ALARM':
      return { ...state, activeAlarms: { ...state.activeAlarms, [action.payload.key]: action.payload.active } };

    case 'SET_ALARMS':
      return { ...state, alarms: { ...state.alarms, ...action.payload } };

    case 'SET_PATIENT':
      return { ...state, patient: { ...state.patient, ...action.payload } };

    case 'CLEAR_LOG':
      return { ...state, alarmLog: [] };

    case 'LOAD_SETTINGS':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export function IncubatorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const historyInterval = useRef(null);
  const lastVitals = useRef({});
  const alarmsRef = useRef(state.alarms);
  const soundRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Initialize and load the audio
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/alarm.wav'),
          { isLooping: true }
        );
        soundRef.current = sound;
      } catch (e) {
        console.log('Error loading audio:', e);
      }
    })();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => { alarmsRef.current = state.alarms; }, [state.alarms]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('incubator_settings');
        if (saved) {
          const p = JSON.parse(saved);
          dispatch({
            type: 'LOAD_SETTINGS',
            payload: {
              alarms: p.alarms || initialState.alarms,
              patient: p.patient || initialState.patient,
              ipAddress: p.ipAddress || initialState.ipAddress,
            },
          });
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.setItem(
        'incubator_settings',
        JSON.stringify({ alarms: state.alarms, patient: state.patient, ipAddress: state.ipAddress })
      ).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [state.alarms, state.patient, state.ipAddress]);

  const checkAlarms = useCallback((data) => {
    const a = alarmsRef.current;
    const now = new Date().toLocaleTimeString();
    const fire = (key, type, message, icon) => {
      dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key, active: true } });
      dispatch({ type: 'ADD_ALARM_LOG', payload: { type, message, time: now, icon } });
    };

    if (data.temp !== undefined) {
      if (data.temp < a.tempMin) fire('tempLow', 'danger', `Low Temperature: ${data.temp.toFixed(1)}°C`, 'thermometer');
      else if (data.temp > a.tempMax) fire('tempHigh', 'danger', `High Temperature: ${data.temp.toFixed(1)}°C`, 'thermometer');
      else {
        dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key: 'tempLow', active: false } });
        dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key: 'tempHigh', active: false } });
      }
    }

    if (data.hum !== undefined) {
      if (data.hum < a.humMin) fire('humLow', 'warning', `Low Humidity: ${data.hum.toFixed(0)}%`, 'water');
      else if (data.hum > a.humMax) fire('humHigh', 'warning', `High Humidity: ${data.hum.toFixed(0)}%`, 'water');
      else {
        dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key: 'humLow', active: false } });
        dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key: 'humHigh', active: false } });
      }
    }

    if (data.bpm) {
      if (data.bpm < a.bpmMin) fire('bpmLow', 'danger', `Low Heart Rate: ${data.bpm} BPM`, 'heart');
      else if (data.bpm > a.bpmMax) fire('bpmHigh', 'danger', `High Heart Rate: ${data.bpm} BPM`, 'heart');
      else {
        dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key: 'bpmLow', active: false } });
        dispatch({ type: 'SET_ACTIVE_ALARM', payload: { key: 'bpmHigh', active: false } });
      }
    }

    if (data.jaundice && a.jaundiceAlertEnabled) {
      fire('jaundice', 'warning', 'Jaundice Detected', 'alert-circle');
    }
  }, []);

  // Effect to manage alarm audio playback
  useEffect(() => {
    const hasCriticalAlarms =
      state.jaundiceDetected ||
      state.sensorError ||
      (!state.connected && state.ipAddress) /* Only alarm if connection was lost, though might need logic depending on exact specs */ ||
      state.activeAlarms.tempLow ||
      state.activeAlarms.tempHigh ||
      state.activeAlarms.humLow ||
      state.activeAlarms.humHigh ||
      state.activeAlarms.bpmLow ||
      state.activeAlarms.bpmHigh;

    // Remove the `!state.connected` from triggering loops if it's annoying, but user requested alarms for below/above normal, hum and jaundice.
    const shouldAlarm =
      state.jaundiceDetected ||
      state.activeAlarms.tempLow ||
      state.activeAlarms.tempHigh ||
      state.activeAlarms.humLow ||
      state.activeAlarms.humHigh;

    if (shouldAlarm && !isPlayingRef.current) {
      if (soundRef.current) {
        soundRef.current.playAsync();
        isPlayingRef.current = true;
      }
    } else if (!shouldAlarm && isPlayingRef.current) {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        isPlayingRef.current = false;
      }
    }
  }, [
    state.jaundiceDetected,
    state.activeAlarms.tempLow,
    state.activeAlarms.tempHigh,
    state.activeAlarms.humLow,
    state.activeAlarms.humHigh,
  ]);

  const connect = useCallback(
    (ip) => {
      if (ip) dispatch({ type: 'SET_IP', payload: ip });
      const targetIp = ip || state.ipAddress;

      wsService.onConnect = () => {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        wsService.send({ cmd: 'setLimits', ...alarmsRef.current });
      };
      wsService.onDisconnect = () => {
        dispatch({ type: 'SET_CONNECTED', payload: false });
      };
      wsService.onMessage = (data) => {
        // Route by message type: "ecg" for fast ECG batches, "vitals" for slow sensors
        if (data.type === 'ecg') {
          dispatch({ type: 'UPDATE_ECG', payload: { samples: data.ecg || [], bpm: data.bpm } });
        } else {
          // vitals message (or legacy single-value message for backward compat)
          lastVitals.current = data;
          dispatch({ type: 'UPDATE_VITALS', payload: data });
          checkAlarms(data);

          // Backward compat: if there's a single ecg value (legacy firmware), push it
          if (data.ecg !== undefined && !data.type) {
            dispatch({ type: 'UPDATE_ECG', payload: { samples: [data.ecg], bpm: data.bpm } });
          }
        }
      };

      wsService.connect(targetIp);

      if (historyInterval.current) clearInterval(historyInterval.current);
      historyInterval.current = setInterval(() => {
        const v = lastVitals.current;
        if (v.temp !== undefined) {
          dispatch({
            type: 'ADD_HISTORY',
            payload: {
              temp: v.temp,
              hum: v.hum ?? 0,
              bpm: v.bpm ?? 0,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            },
          });
        }
      }, 60000);
    },
    [state.ipAddress, checkAlarms]
  );

  const disconnect = useCallback(() => {
    wsService.disconnect();
    if (historyInterval.current) {
      clearInterval(historyInterval.current);
      historyInterval.current = null;
    }
  }, []);

  const updateAlarms = useCallback(
    (newAlarms) => {
      dispatch({ type: 'SET_ALARMS', payload: newAlarms });
      wsService.send({ cmd: 'setLimits', ...alarmsRef.current, ...newAlarms });
    },
    []
  );

  const updatePatient = useCallback((info) => dispatch({ type: 'SET_PATIENT', payload: info }), []);
  const clearLog = useCallback(() => dispatch({ type: 'CLEAR_LOG' }), []);
  const sendCalibration = useCallback(() => wsService.send({ cmd: 'calibrate' }), []);

  return (
    <IncubatorContext.Provider
      value={{ state, connect, disconnect, updateAlarms, updatePatient, clearLog, sendCalibration }}
    >
      {children}
    </IncubatorContext.Provider>
  );
}

export const useIncubator = () => useContext(IncubatorContext);
