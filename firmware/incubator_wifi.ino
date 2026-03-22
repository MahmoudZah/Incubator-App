/*
  Neonatal Incubator — ESP32 Firmware with WiFi + WebSocket
  ─────────────────────────────────────────────────────────
  Sensors : DHT11 (temp/humidity), TCS3200 (color/jaundice), AD8232 (ECG)
  Outputs : Relay (heater/fan), Lamp (phototherapy)
  Comms   : WiFi → WebSocket server on port 81

  Libraries needed (install via Arduino Library Manager):
    - DHT sensor library  (by Adafruit)
    - ArduinoJson         (by Benoît Blanchon)
    - WebSockets          (by Markus Sattler / Links2004)
*/

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <DHT.h>

// ── WiFi credentials (CHANGE THESE) ──────────────────
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ── Pin Definitions ──────────────────────────────────
#define DHTPIN      4
#define DHTTYPE     DHT11
#define RELAY_PIN   26

#define S0 18
#define S1 19
#define S2 21
#define S3 22
#define sensorOut 23
const int sensorLED = 5;
const int lamp      = 27;

#define ECG_PIN     34
#define ECG_LO_PLUS  32
#define ECG_LO_MINUS 33

// ── Objects ──────────────────────────────────────────
DHT dht(DHTPIN, DHTTYPE);
WebSocketsServer webSocket(81);
Preferences prefs;

// ── Color calibration values ─────────────────────────
int redMin, redMax;
int greenMin, greenMax;
int blueMin, blueMax;

// ── State ────────────────────────────────────────────
bool jaundiceDetected   = false;
bool calibrationPending = false;

// ── Alarm limits (updated from the app) ──────────────
float tempMinLimit = 35.5;
float tempMaxLimit = 37.5;
float humMinLimit  = 40;
float humMaxLimit  = 70;

// ── BPM calculation ──────────────────────────────────
unsigned long lastBeat   = 0;
int           currentBPM = 0;
int           ecgPrev    = 0;
const int     ECG_THRESH = 2800;

// ── Timing ───────────────────────────────────────────
unsigned long lastSend  = 0;
const int     SEND_INTERVAL = 100;   // ms between WebSocket broadcasts

// ═══════════════════════════════════════════════════════
//  Color sensor helpers
// ═══════════════════════════════════════════════════════
int rawRead(int s2, int s3) {
  digitalWrite(S2, s2);
  digitalWrite(S3, s3);
  return pulseIn(sensorOut, LOW);
}

int getMappedColor(int s2, int s3, int minV, int maxV) {
  int freq = rawRead(s2, s3);
  return constrain(map(freq, minV, maxV, 255, 0), 0, 255);
}

// ═══════════════════════════════════════════════════════
//  Calibration
// ═══════════════════════════════════════════════════════
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

void loadCalibration() {
  redMin   = prefs.getInt("rMin", 0);
  greenMin = prefs.getInt("gMin", 0);
  blueMin  = prefs.getInt("bMin", 0);
  redMax   = prefs.getInt("rMax", 255);
  greenMax = prefs.getInt("gMax", 255);
  blueMax  = prefs.getInt("bMax", 255);

  if (redMin == 0 && greenMin == 0 && blueMin == 0)
    Serial.println("WARNING: No calibration data — readings may be inaccurate.");
  else
    Serial.println("Calibration loaded.");
}

// ═══════════════════════════════════════════════════════
//  WebSocket event handler
// ═══════════════════════════════════════════════════════
void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.printf("[WS] Client #%u connected\n", num);
      break;

    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client #%u disconnected\n", num);
      break;

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
        Serial.printf("Limits updated → T: %.1f–%.1f  H: %.0f–%.0f\n",
                       tempMinLimit, tempMaxLimit, humMinLimit, humMaxLimit);
      }
      else if (strcmp(cmd, "calibrate") == 0) {
        calibrationPending = true;
        Serial.println("Calibration requested from app");
      }
      break;
    }

    default: break;
  }
}

// ═══════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);

  // ── DHT + relay ────────────────────────────────────
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);

  // ── Color sensor ───────────────────────────────────
  pinMode(S0, OUTPUT);  pinMode(S1, OUTPUT);
  pinMode(S2, OUTPUT);  pinMode(S3, OUTPUT);
  pinMode(sensorOut, INPUT);
  pinMode(sensorLED, OUTPUT);
  pinMode(lamp, OUTPUT);

  digitalWrite(sensorLED, HIGH);
  digitalWrite(S0, HIGH);
  digitalWrite(S1, LOW);
  digitalWrite(lamp, LOW);

  // ── ECG ────────────────────────────────────────────
  pinMode(ECG_LO_PLUS, INPUT);
  pinMode(ECG_LO_MINUS, INPUT);

  // ── Load calibration ──────────────────────────────
  prefs.begin("color_cal", false);
  loadCalibration();

  // ── WiFi ───────────────────────────────────────────
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // ── WebSocket ──────────────────────────────────────
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server started on port 81");
}

// ═══════════════════════════════════════════════════════
//  LOOP
// ═══════════════════════════════════════════════════════
void loop() {
  webSocket.loop();

  if (calibrationPending) {
    runCalibration();
    return;
  }

  // ── Read sensors ───────────────────────────────────
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  bool sensorError = isnan(temp) || isnan(hum);

  // ── Temperature control ────────────────────────────
  bool heaterOn = false;
  bool fanOn    = false;

  if (!sensorError) {
    if (temp < tempMinLimit) {
      digitalWrite(RELAY_PIN, HIGH); delay(200);
      digitalWrite(RELAY_PIN, LOW);  delay(200);
      heaterOn = true;
    } else if (temp > tempMaxLimit) {
      digitalWrite(RELAY_PIN, LOW);
      fanOn = true;
    } else {
      digitalWrite(RELAY_PIN, LOW);
      fanOn = true;
    }
  }

  // ── Color / jaundice ──────────────────────────────
  if (!jaundiceDetected) {
    int r = getMappedColor(LOW, LOW,   redMin,   redMax);
    int g = getMappedColor(HIGH, HIGH, greenMin, greenMax);
    int b = getMappedColor(LOW, HIGH,  blueMin,  blueMax);

    if (r > 180 && g > 150 && b < 120) {
      jaundiceDetected = true;
      digitalWrite(lamp, HIGH);
      Serial.println("*** JAUNDICE DETECTED ***");
    }

    // ── ECG ────────────────────────────────────────
    int ecgRaw = analogRead(ECG_PIN);
    bool leadsOff = digitalRead(ECG_LO_PLUS) || digitalRead(ECG_LO_MINUS);

    if (!leadsOff && ecgRaw > ECG_THRESH && ecgPrev <= ECG_THRESH) {
      unsigned long now = millis();
      if (lastBeat > 0) {
        unsigned long interval = now - lastBeat;
        if (interval > 300 && interval < 2000)
          currentBPM = 60000 / interval;
      }
      lastBeat = now;
    }
    ecgPrev = ecgRaw;

    // ── Broadcast via WebSocket ────────────────────
    if (millis() - lastSend >= SEND_INTERVAL) {
      lastSend = millis();

      StaticJsonDocument<300> doc;
      doc["temp"]        = sensorError ? 0 : temp;
      doc["hum"]         = sensorError ? 0 : hum;
      doc["ecg"]         = leadsOff ? 512 : ecgRaw;
      doc["bpm"]         = leadsOff ? 0   : currentBPM;
      doc["jaundice"]    = jaundiceDetected;
      doc["lamp"]        = (bool)digitalRead(lamp);
      doc["heater"]      = heaterOn;
      doc["fan"]         = fanOn;
      doc["sensorError"] = sensorError;

      JsonObject rgb = doc.createNestedObject("rgb");
      rgb["r"] = r;
      rgb["g"] = g;
      rgb["b"] = b;

      String output;
      serializeJson(doc, output);
      webSocket.broadcastTXT(output);
    }
  } else {
    digitalWrite(lamp, HIGH);

    // Still send status while treating
    if (millis() - lastSend >= SEND_INTERVAL) {
      lastSend = millis();

      StaticJsonDocument<200> doc;
      doc["temp"]        = sensorError ? 0 : temp;
      doc["hum"]         = sensorError ? 0 : hum;
      doc["ecg"]         = 512;
      doc["bpm"]         = currentBPM;
      doc["jaundice"]    = true;
      doc["lamp"]        = true;
      doc["heater"]      = heaterOn;
      doc["fan"]         = fanOn;
      doc["sensorError"] = sensorError;

      String output;
      serializeJson(doc, output);
      webSocket.broadcastTXT(output);
    }
  }

  delay(10);
}
