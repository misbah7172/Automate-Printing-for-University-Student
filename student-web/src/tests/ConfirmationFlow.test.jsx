import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Queue from '../pages/Queue';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import * as apiService from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
  printJobService: {
    getMyJobs: vi.fn(),
    getQueueStatus: vi.fn(),
    confirmPickup: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: true,
};

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket),
}));

const theme = createTheme();

// Mock AuthContext to provide user data
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
};

const MockAuthProvider = ({ children }) => {
  const value = {
    user: mockUser,
    isAuthenticated: true,
    token: 'mock-token'
  };
  
  return React.createElement(
    AuthProvider.Provider || 'div',
    { value },
    children
  );
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <MockAuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </MockAuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Confirmation Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default API responses
    apiService.printJobService.getMyJobs.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'job-123',
          status: 'in_queue',
          position: 3,
          fileCount: 2,
          totalCopies: 4,
          totalCost: 20,
          createdAt: new Date().toISOString()
        }
      ]
    });

    apiService.printJobService.getQueueStatus.mockResolvedValue({
      success: true,
      data: {
        isActive: true,
        totalJobs: 5,
        currentJob: 'job-456',
        estimatedWaitTime: 6
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Queue Status Display', () => {
    it('renders queue status correctly', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
        expect(screen.getByText('You are #3 in the queue')).toBeInTheDocument();
        expect(screen.getByText('Printer is Active')).toBeInTheDocument();
        expect(screen.getByText('6 minutes')).toBeInTheDocument();
      });
    });

    it('displays my jobs correctly', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('My Print Jobs')).toBeInTheDocument();
        expect(screen.getByText('Job #job-123')).toBeInTheDocument();
        expect(screen.getByText('#3 in queue')).toBeInTheDocument();
        expect(screen.getByText('2 files • 4 copies • ৳20')).toBeInTheDocument();
      });
    });

    it('shows correct status for different job states', async () => {
      apiService.printJobService.getMyJobs.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'job-1',
            status: 'printing',
            fileCount: 1,
            totalCopies: 1,
            totalCost: 5,
            createdAt: new Date().toISOString()
          },
          {
            id: 'job-2',
            status: 'completed',
            fileCount: 2,
            totalCopies: 2,
            totalCost: 10,
            createdAt: new Date().toISOString()
          }
        ]
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Your job is currently printing!')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('handles queue status updates via socket', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // Verify socket listeners are set up
      expect(mockSocket.on).toHaveBeenCalledWith('queueStatus', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('myJobStatus', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('confirmationTimeout', expect.any(Function));
    });

    it('updates job status when socket event is received', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('in queue')).toBeInTheDocument();
      });

      // Find the callback registered for myJobStatus
      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      // Simulate socket event
      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'printing',
        position: null
      });

      await waitFor(() => {
        expect(screen.getByText('printing')).toBeInTheDocument();
      });
    });

    it('updates queue information when queue status changes', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('6 minutes')).toBeInTheDocument();
      });

      // Find the callback registered for queueStatus
      const queueStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'queueStatus'
      )[1];

      // Simulate queue status update
      queueStatusCallback({
        isActive: true,
        totalJobs: 3,
        currentJob: 'job-789',
        estimatedWaitTime: 4
      });

      await waitFor(() => {
        expect(screen.getByText('4 minutes')).toBeInTheDocument();
      });
    });
  });

  describe('Ready for Pickup Notification', () => {
    it('shows confirmation dialog when job is ready for pickup', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // Find the callback registered for myJobStatus
      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      // Simulate ready for pickup event
      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText('Print Job Ready!')).toBeInTheDocument();
        expect(screen.getByText('Your print job is ready for pickup at the printer location.')).toBeInTheDocument();
        expect(screen.getByText('Job ID: job-123')).toBeInTheDocument();
        expect(screen.getByText('Confirm Pickup')).toBeInTheDocument();
      });
    });

    it('shows countdown timer in confirmation dialog', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText(/Time remaining: 5:00|4:5\d/)).toBeInTheDocument();
        expect(screen.getByText('Please confirm pickup within this time to avoid expiration')).toBeInTheDocument();
      });
    });

    it('ignores pickup notifications for other users', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      // Simulate event for different user
      myJobStatusCallback({
        userId: 'different-user',
        jobId: 'job-456',
        status: 'ready_for_pickup'
      });

      // Should not show confirmation dialog
      expect(screen.queryByText('Print Job Ready!')).not.toBeInTheDocument();
    });
  });

  describe('Pickup Confirmation', () => {
    it('confirms pickup successfully', async () => {
      const user = userEvent.setup();

      apiService.printJobService.confirmPickup.mockResolvedValue({
        success: true
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // Trigger ready for pickup
      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Pickup')).toBeInTheDocument();
      });

      // Click confirm pickup
      const confirmButton = screen.getByText('Confirm Pickup');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiService.printJobService.confirmPickup).toHaveBeenCalledWith('job-123');
      });
    });

    it('handles confirmation error gracefully', async () => {
      const user = userEvent.setup();

      apiService.printJobService.confirmPickup.mockResolvedValue({
        success: false,
        error: 'Confirmation failed'
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Pickup')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Confirm Pickup');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiService.printJobService.confirmPickup).toHaveBeenCalled();
        // Dialog should still be open on error
        expect(screen.getByText('Print Job Ready!')).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation Timeout', () => {
    it('handles confirmation timeout event', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // First show the confirmation dialog
      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText('Print Job Ready!')).toBeInTheDocument();
      });

      // Now trigger timeout
      const timeoutCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'confirmationTimeout'
      )[1];

      timeoutCallback({
        userId: 'user-123',
        jobId: 'job-123'
      });

      await waitFor(() => {
        expect(screen.queryByText('Print Job Ready!')).not.toBeInTheDocument();
      });
    });

    it('ignores timeout for other users', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // Show confirmation for our user
      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText('Print Job Ready!')).toBeInTheDocument();
      });

      // Trigger timeout for different user
      const timeoutCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'confirmationTimeout'
      )[1];

      timeoutCallback({
        userId: 'different-user',
        jobId: 'job-456'
      });

      // Dialog should still be open
      expect(screen.getByText('Print Job Ready!')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('handles API errors gracefully', async () => {
      apiService.printJobService.getMyJobs.mockResolvedValue({
        success: false,
        error: 'Failed to load jobs'
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // Should handle error gracefully without crashing
      expect(screen.getByText('No print jobs found.')).toBeInTheDocument();
    });

    it('handles offline printer status', async () => {
      apiService.printJobService.getQueueStatus.mockResolvedValue({
        success: true,
        data: {
          isActive: false,
          totalJobs: 0,
          currentJob: null,
          estimatedWaitTime: 0
        }
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Printer is Offline')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for dialog', async () => {
      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm pickup/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation in confirmation dialog', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      const myJobStatusCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'myJobStatus'
      )[1];

      myJobStatusCallback({
        userId: 'user-123',
        jobId: 'job-123',
        status: 'ready_for_pickup'
      });

      await waitFor(() => {
        expect(screen.getByText('Confirm Pickup')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const confirmButton = screen.getByRole('button', { name: /confirm pickup/i });
      confirmButton.focus();
      
      expect(document.activeElement).toBe(confirmButton);

      // Test Enter key activation
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(apiService.printJobService.confirmPickup).toHaveBeenCalled();
      });
    });
  });
});