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
  const [queueData, setQueueData] = useState(null);
  const [myJobStatus, setMyJobStatus] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('student_token');
      
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
        });

        // Listen for queue status updates
        newSocket.on('queueStatus', (data) => {
          setQueueData(data);
        });

        // Listen for personalized job status updates
        newSocket.on('myJobStatus', (data) => {
          setMyJobStatus(data);
        });

        // Listen for payment verification
        newSocket.on('paymentVerified', (data) => {
          if (data.userId === user.id) {
            toast.success(`Payment verified! Your UPID is ${data.upid}. Position in queue: ${data.queuePosition}`);
          }
        });

        // Listen for confirmation timeout
        newSocket.on('confirmationTimeout', (data) => {
          if (data.printJobId && myJobStatus?.printJobId === data.printJobId) {
            toast.error('Your print job was moved down in queue due to confirmation timeout');
            setMyJobStatus({ ...myJobStatus, queuePosition: data.newQueuePosition });
          }
        });

        // Listen for job being called for confirmation
        newSocket.on('jobReadyForConfirmation', (data) => {
          if (data.userId === user.id) {
            toast.success('Your print job is ready! Please confirm to start printing.', {
              duration: 10000,
            });
          }
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
        setQueueData(null);
        setMyJobStatus(null);
      }
    }
  }, [isAuthenticated, user]);

  const requestQueueStatus = () => {
    if (socket && connected) {
      socket.emit('requestQueueStatus');
    }
  };

  const value = {
    socket,
    connected,
    queueData,
    myJobStatus,
    requestQueueStatus,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};