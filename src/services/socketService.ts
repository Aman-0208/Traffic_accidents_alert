import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    this.url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Stream events
  joinStream(streamId: string) {
    if (this.socket) {
      this.socket.emit('join-stream', streamId);
    }
  }

  onStreamCreated(callback: (stream: any) => void) {
    if (this.socket) {
      this.socket.on('stream-created', callback);
    }
  }

  onStreamUpdated(callback: (stream: any) => void) {
    if (this.socket) {
      this.socket.on('stream-updated', callback);
    }
  }

  onStreamDeleted(callback: (data: { id: string }) => void) {
    if (this.socket) {
      this.socket.on('stream-deleted', callback);
    }
  }

  onStreamStarted(callback: (stream: any) => void) {
    if (this.socket) {
      this.socket.on('stream-started', callback);
    }
  }

  onStreamStopped(callback: (stream: any) => void) {
    if (this.socket) {
      this.socket.on('stream-stopped', callback);
    }
  }

  // Detection events
  onDetectionResult(callback: (data: { streamId: string; result: any }) => void) {
    if (this.socket) {
      this.socket.on('detection-result', callback);
    }
  }

  onAccidentDetected(callback: (data: { alert: any; stream: any; detectionResult: any }) => void) {
    if (this.socket) {
      this.socket.on('accident-detected', callback);
    }
  }

  onPendingAlertCreated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('pending-alert-created', callback);
    }
  }

  // Alert events
  onAlertSent(callback: (alert: any) => void) {
    if (this.socket) {
      this.socket.on('alert-sent', callback);
    }
  }

  onAlertAcknowledged(callback: (data: { alertId: string }) => void) {
    if (this.socket) {
      this.socket.on('alert-acknowledged', callback);
    }
  }

  onAlertStatusUpdated(callback: (alert: any) => void) {
    if (this.socket) {
      this.socket.on('alert-status-updated', callback);
    }
  }

  // Generic on listener for any event
  on(event: string, callback: Function) {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  // Remove event listeners
  off(event: string, callback?: Function) {
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;