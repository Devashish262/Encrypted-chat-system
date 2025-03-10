import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.disconnectionHandlers = [];
    this.errorHandlers = [];
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionHandlers.forEach(handler => handler());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.disconnectionHandlers.forEach(handler => handler(reason));
    });

    this.socket.on('message', (message) => {
      console.log('Message received:', message);
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.errorHandlers.forEach(handler => handler(error));
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send a message
  sendMessage(message) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('message', message);
  }

  // Add message handler
  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Add connection handler
  onConnect(handler) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  // Add disconnection handler
  onDisconnect(handler) {
    this.disconnectionHandlers.push(handler);
    return () => {
      this.disconnectionHandlers = this.disconnectionHandlers.filter(h => h !== handler);
    };
  }

  // Add error handler
  onError(handler) {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  // Check if socket is connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 