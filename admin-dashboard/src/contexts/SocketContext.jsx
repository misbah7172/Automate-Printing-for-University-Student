import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('admin_token');
      
      if (token) {
        const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
          auth: {
            token: token,
          },
        });

        newSocket.on('connect', () => {
          console.log('Connected to WebSocket');
          setConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
          setConnected(false);
        });

        newSocket.on('connectionSuccess', (data) => {
          console.log('WebSocket authentication successful:', data);
        });

        newSocket.on('error', (error) => {
          console.error('WebSocket error:', error);
          toast.error('WebSocket connection error');
        });

        // Listen for payment verification events
        newSocket.on('paymentVerified', (data) => {
          toast.success(`Payment verified for job ${data.upid}`);
        });

        // Listen for queue updates
        newSocket.on('queueUpdate', (data) => {
          console.log('Queue update received:', data);
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      }
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    connected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};