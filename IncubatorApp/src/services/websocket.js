class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.onMessage = null;
    this.onConnect = null;
    this.onDisconnect = null;
    this.reconnectTimer = null;
    this.isIntentionalClose = false;
  }

  connect(ip, port = 81) {
    this.url = `ws://${ip}:${port}`;
    this.isIntentionalClose = false;
    this._createConnection();
  }

  _createConnection() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      if (this.onConnect) this.onConnect();
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessage) this.onMessage(data);
      } catch (e) {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (this.onDisconnect) this.onDisconnect();
      if (!this.isIntentionalClose) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {};
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._createConnection();
    }, 3000);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketService();
