/*
  Neonatal Incubator — ESP32 Firmware with WiFi + WebSocket
  ─────────────────────────────────────────────────────────
  Sensors : DHT11 (temp/humidity), TCS3200 (color/jaundice), AD8232 (ECG)
  Outputs : Relay (heater/fan), Lamp (phototherapy)
  Comms   : WiFi AP mode → WebSocket server on port 81
*/

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <DHT.h>

// ── WiFi AP credentials ──────────────────────────────
const char* ap_ssid     = "Incubator_AP";
const char* ap_password = "incubator123";

// ── Objects ──────────────────────────────────────────
WebSocketsServer webSocket(81);
Preferences prefs;

// =========================
// ECG PINS & FILTERS
// =========================
const int ecgPin = 34;
const int loMinus = 14;
const int loPlus = 13;

float rawValue = 0;
float lpfValue = 0;
float hpfValue = 0;
float notchValue = 0;

float xn1 = 0, xn2 = 0, yn1 = 0, yn2 = 0;
const float a0 = 0.945, a1 = -1.529, a2 = 0.945;
const float b1 = -1.529, b2 = 0.890;

const float alphaLPF = 0.4;
const float alphaHPF = 0.96;

float prevRawValue = 0;
float prevHPFValue = 0;

unsigned long previousMicros = 0;
const long interval = 4000; // 250Hz

// ── ECG fast-sample buffer
#define ECG_BATCH_SIZE   30        // sufficient for 100ms at 250Hz = 25 samples
int     ecgBuffer[ECG_BATCH_SIZE];
int     ecgBufIdx = 0;

unsigned long lastEcgSend = 0;
const int ECG_SEND_INTERVAL = 100;  // send batch every 100ms

// ── BPM calculation
unsigned long lastBeat   = 0;
int           currentBPM = 0;
float         ecgPrev    = 0;
const int     ECG_THRESH = 2800; 

// =========================
// TEMP SYSTEM
// =========================
#define DHTPIN 4
#define DHTTYPE DHT11

#define HEATER_RELAY 25
#define FAN_RELAY 26

DHT dht(DHTPIN, DHTTYPE);

// =========================
// JAUNDICE / COLOR SENSOR
// =========================
#define S0 18
#define S1 19
#define S2 21
#define S3 22
#define sensorOut 23

#define sensorLED 5
#define BLUE_RELAY 32

int redMin, redMax;
int greenMin, greenMax;
int blueMin, blueMax;

bool jaundiceDetected = false;
bool calibrationPending = false;

// ── App Limits ───────────────────────────────────────
float tempMinLimit = 35.5; 
float tempMaxLimit = 37.5; 
float humMinLimit  = 40;
float humMaxLimit  = 70;

// ── TIMING ───────────────────────────────────────────
unsigned long lastTempRead = 0;
const unsigned long tempInterval = 2000;

unsigned long lastColorRead = 0;
const unsigned long colorInterval = 2000;

// ── Cached values ────────────────────────────────────
float cachedTemp    = 0;
float cachedHum     = 0;
bool  cachedSensorError = false;
bool  cachedHeaterOn    = false;
bool  cachedFanOn       = false;
int   cachedR = 0, cachedG = 0, cachedB = 0;

// =========================
// COLOR SENSOR FUNCTIONS
// =========================
int rawRead(int s2, int s3) {
  digitalWrite(S2, s2);
  digitalWrite(S3, s3);
  return pulseIn(sensorOut, LOW);
}

int getMappedColor(int s2, int s3, int minV, int maxV) {
  int freq = rawRead(s2, s3);
  return constrain(map(freq, minV, maxV, 255, 0), 0, 255);
}

// =========================
// CALIBRATION
// =========================
void runCalibration() {
  Serial.println("\n--- CALIBRATION ---");
  Serial.println("1. WHITE surface — reading in 5 s...");
  delay(5000);
  redMin   = rawRead(LOW, LOW);
  greenMin = rawRead(HIGH, HIGH);
  blueMin  = rawRead(LOW, HIGH);

  Serial.println("2. BLACK surface — reading in 5 s...");
  delay(5000);
  redMax   = rawRead(LOW, LOW);
  greenMax = rawRead(HIGH, HIGH);
  blueMax  = rawRead(LOW, HIGH);

  prefs.putInt("rMin", redMin);
  prefs.putInt("gMin", greenMin);
  prefs.putInt("bMin", blueMin);
  prefs.putInt("rMax", redMax);
  prefs.putInt("gMax", greenMax);
  prefs.putInt("bMax", blueMax);

  Serial.println("Calibration saved!");
  calibrationPending = false;
}

// ═══════════════════════════════════════════════════════
// WebSocket event handler
// ═══════════════════════════════════════════════════════
void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:     Serial.printf("[WS] Client #%u connected\n", num); break;
    case WStype_DISCONNECTED:  Serial.printf("[WS] Client #%u disconnected\n", num); break;
    case WStype_TEXT: {
      StaticJsonDocument<256> doc;
      if (deserializeJson(doc, payload) != DeserializationError::Ok) break;

      const char* cmd = doc["cmd"];
      if (!cmd) break;

      if (strcmp(cmd, "setLimits") == 0) {
        if (doc.containsKey("tempMin")) tempMinLimit = doc["tempMin"];
        if (doc.containsKey("tempMax")) tempMaxLimit = doc["tempMax"];
        if (doc.containsKey("humMin"))  humMinLimit  = doc["humMin"];
        if (doc.containsKey("humMax"))  humMaxLimit  = doc["humMax"];
      }
      else if (strcmp(cmd, "calibrate") == 0) {
        calibrationPending = true;
      }
      break;
    }
    default: break;
  }
}

// =========================
// SETUP
// =========================
void setup() {
  Serial.begin(115200);

  // ===== ECG SETUP =====
  pinMode(loMinus, INPUT);
  pinMode(loPlus, INPUT);

  // ===== TEMP SETUP =====
  dht.begin();
  pinMode(HEATER_RELAY, OUTPUT);
  pinMode(FAN_RELAY, OUTPUT);
  
  digitalWrite(HEATER_RELAY, HIGH); 
  digitalWrite(FAN_RELAY, HIGH);    

  // ===== JAUNDICE SETUP =====
  pinMode(S0, OUTPUT);
  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);
  pinMode(S3, OUTPUT);
  pinMode(sensorOut, INPUT);
  pinMode(sensorLED, OUTPUT);
  pinMode(BLUE_RELAY, OUTPUT);

  digitalWrite(sensorLED, HIGH);   
  digitalWrite(S0, HIGH);          
  digitalWrite(S1, LOW);
  digitalWrite(BLUE_RELAY, LOW);   

  // Load stored calibration
  prefs.begin("color_cal", false);
  redMin   = prefs.getInt("rMin", 0);
  greenMin = prefs.getInt("gMin", 0);
  blueMin  = prefs.getInt("bMin", 0);
  redMax   = prefs.getInt("rMax", 255);
  greenMax = prefs.getInt("gMax", 255);
  blueMax  = prefs.getInt("bMax", 255);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  delay(100);
  Serial.print("\nAP IP: "); Serial.println(WiFi.softAPIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

// =========================
// LOOP
// =========================
void loop() {
  webSocket.loop();

  if (calibrationPending) {
    runCalibration();
    return;
  }

  unsigned long currentMillis = millis();
  unsigned long currentMicros = micros();

  // =========================
  // ECG LOOP (250Hz)
  // =========================
  if (currentMicros - previousMicros >= interval) {
    previousMicros = currentMicros;

    if (digitalRead(loPlus) == HIGH || digitalRead(loMinus) == HIGH) {
      xn1 = xn2 = yn1 = yn2 = 0;
      prevRawValue = prevHPFValue = 0;
      lpfValue = 0;
      
      if (ecgBufIdx < ECG_BATCH_SIZE) {
        ecgBuffer[ecgBufIdx++] = 2048; // Centered flatline
      }
      ecgPrev = 0;
    } else {
      rawValue = analogRead(ecgPin);

      // Notch filter (50Hz)
      notchValue = a0 * rawValue + a1 * xn1 + a2 * xn2 - b1 * yn1 - b2 * yn2;
      xn2 = xn1; xn1 = rawValue;
      yn2 = yn1; yn1 = notchValue;

      // Low-pass filter
      lpfValue = lpfValue + alphaLPF * (notchValue - lpfValue);

      // High-pass filter
      hpfValue = alphaHPF * (prevHPFValue + lpfValue - prevRawValue);
      prevRawValue = lpfValue;
      prevHPFValue = hpfValue;

      // Adjusted to center on 2048 for the 0-4095 app graph scale
      int filteredOut = (hpfValue * 2) + 2048; 
      if (ecgBufIdx < ECG_BATCH_SIZE) {
        ecgBuffer[ecgBufIdx++] = filteredOut;
      }

      // Peak detection for BPM based on raw signal
      if (rawValue > ECG_THRESH && ecgPrev <= ECG_THRESH) {
        if (lastBeat > 0) {
          unsigned long beatInterval = currentMillis - lastBeat;
          if (beatInterval > 300 && beatInterval < 2000) {
            currentBPM = 60000 / beatInterval;
          }
        }
        lastBeat = currentMillis;
      }
      ecgPrev = rawValue;
    }
  }

  // ── Send ECG batch (every 100ms)
  if (currentMillis - lastEcgSend >= ECG_SEND_INTERVAL) {
    lastEcgSend = currentMillis;

    if (ecgBufIdx > 0) {
      StaticJsonDocument<512> ecgDoc;
      ecgDoc["type"] = "ecg";
      JsonArray ecgArr = ecgDoc.createNestedArray("ecg");
      for (int i = 0; i < ecgBufIdx; i++) {
        ecgArr.add(ecgBuffer[i]);
      }
      ecgDoc["bpm"] = currentBPM;

      String ecgOut;
      serializeJson(ecgDoc, ecgOut);
      webSocket.broadcastTXT(ecgOut);
      ecgBufIdx = 0;
    }
  }

  // =========================
  // TEMP AND HUMIDITY LOOP
  // =========================
  if (currentMillis - lastTempRead >= tempInterval) {
    lastTempRead = currentMillis;

    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
      cachedSensorError = true;
      cachedTemp = 0; cachedHum = 0;
      digitalWrite(HEATER_RELAY, HIGH); // OFF
      digitalWrite(FAN_RELAY, LOW);     // ON
      cachedHeaterOn = false;
      cachedFanOn = true;
    } else {
      cachedSensorError = false;
      cachedTemp = temp;
      cachedHum = hum;

      if (temp < tempMinLimit) {
        digitalWrite(HEATER_RELAY, LOW);  // ON
        digitalWrite(FAN_RELAY, LOW);     // ON
        cachedHeaterOn = true; 
        cachedFanOn = true;
      } else if (temp > tempMaxLimit) {
        digitalWrite(HEATER_RELAY, HIGH); // OFF
        digitalWrite(FAN_RELAY, LOW);     // ON
        cachedHeaterOn = false; 
        cachedFanOn = true;
      } else {
        digitalWrite(HEATER_RELAY, HIGH); // OFF
        digitalWrite(FAN_RELAY, LOW);     // ON (Default to circulating)
        cachedHeaterOn = false; 
        cachedFanOn = true;
      }
    }
  }

  // =========================
  // JAUNDICE LOOP
  // =========================
  if (currentMillis - lastColorRead >= colorInterval) {
    lastColorRead = currentMillis;

    cachedR = getMappedColor(LOW,  LOW,  redMin,   redMax);
    cachedG = getMappedColor(HIGH, HIGH, greenMin, greenMax);
    cachedB = getMappedColor(LOW,  HIGH, blueMin,  blueMax);

    if (cachedR > 180 && cachedG > 150 && cachedB < 120) {
      if (!jaundiceDetected) {
        Serial.println("*** JAUNDICE DETECTED ***");
        jaundiceDetected = true;
      }
      digitalWrite(BLUE_RELAY, HIGH);  // ON
    } else {
      jaundiceDetected = false;
      digitalWrite(BLUE_RELAY, LOW);   // OFF
    }

    // Broadcast full array
    StaticJsonDocument<400> doc;
    doc["type"]        = "vitals";
    doc["temp"]        = cachedTemp;
    doc["hum"]         = cachedHum;
    doc["bpm"]         = currentBPM;
    doc["jaundice"]    = jaundiceDetected;
    doc["lamp"]        = (bool)digitalRead(BLUE_RELAY);
    doc["heater"]      = cachedHeaterOn;
    doc["fan"]         = cachedFanOn;
    doc["humidifier"]  = false; // removed in hardware
    doc["sensorError"] = cachedSensorError;

    if (!jaundiceDetected) {
      JsonObject rgb = doc.createNestedObject("rgb");
      rgb["r"] = cachedR; rgb["g"] = cachedG; rgb["b"] = cachedB;
    }

    String output;
    serializeJson(doc, output);
    webSocket.broadcastTXT(output);
  }
}
