import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { tokenManager } from '../services/api';

// WebSocket 消息类型
export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
  message?: string;
}

// 新预约通知数据
export interface NewAppointmentNotification {
  appointmentId: number;
  date: string;
  time: string;
  duration: number;
  customerName: string;
  resourceName: string;
  status: string;
  bookingSource: string;
}

// 预约取消通知数据
export interface CancelledAppointmentNotification {
  appointmentId: number;
  date: string;
  time: string;
  duration: number;
  customerName: string;
  status: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  newAppointment: NewAppointmentNotification | null;
  cancelledAppointment: CancelledAppointmentNotification | null;
  clearNewAppointment: () => void;
  clearCancelledAppointment: () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [newAppointment, setNewAppointment] = useState<NewAppointmentNotification | null>(null);
  const [cancelledAppointment, setCancelledAppointment] = useState<CancelledAppointmentNotification | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 3000; // 3 seconds

  const clearNewAppointment = useCallback(() => {
    setNewAppointment(null);
  }, []);

  const clearCancelledAppointment = useCallback(() => {
    setCancelledAppointment(null);
  }, []);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!user) {
      console.log('[WebSocket] No user, skipping connection');
      return;
    }

    const token = tokenManager.getToken();
    if (!token) {
      console.log('[WebSocket] No token, skipping connection');
      return;
    }

    // Clean existing connection
    cleanup();

    // Build WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1';
    // 生产环境通过 CloudFront 代理 WebSocket（已配置 /ws/* behavior）
    const wsHost = process.env.REACT_APP_WS_HOST || (isDev ? 'localhost:8080' : window.location.host);
    const wsUrl = `${wsProtocol}//${wsHost}/ws/notifications?token=${encodeURIComponent(token)}`;

    console.log('[WebSocket] Connecting to:', wsUrl.replace(/token=.*/, 'token=***'));

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.type);
          setLastMessage(message);

          // Handle specific message types
          if (message.type === 'NEW_APPOINTMENT' && message.data) {
            try {
              const appointmentData: NewAppointmentNotification =
                typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
              setNewAppointment(appointmentData);
              console.log('[WebSocket] New appointment notification:', appointmentData);
            } catch (e) {
              console.error('[WebSocket] Failed to parse appointment data:', e);
            }
          }

          // Handle appointment cancellation
          if (message.type === 'APPOINTMENT_CANCELLED' && message.data) {
            try {
              const cancelData: CancelledAppointmentNotification =
                typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
              setCancelledAppointment(cancelData);
              console.log('[WebSocket] Appointment cancelled notification:', cancelData);
            } catch (e) {
              console.error('[WebSocket] Failed to parse cancellation data:', e);
            }
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a normal close and user is still logged in
        if (event.code !== 1000 && user && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
    }
  }, [user, cleanup]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // Connect when user logs in, disconnect when user logs out
  useEffect(() => {
    if (user) {
      connect();
    } else {
      cleanup();
      setIsConnected(false);
    }

    return () => {
      cleanup();
    };
  }, [user, connect, cleanup]);

  const value: WebSocketContextType = {
    isConnected,
    lastMessage,
    newAppointment,
    cancelledAppointment,
    clearNewAppointment,
    clearCancelledAppointment,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
