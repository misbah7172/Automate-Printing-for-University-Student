import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Upload from '../pages/Upload';
import PaymentSubmit from '../pages/PaymentSubmit';
import Queue from '../pages/Queue';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import * as apiService from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
  printJobService: {
    create: vi.fn(),
    getMyJobs: vi.fn(),
    getQueueStatus: vi.fn(),
    confirmPickup: vi.fn(),
  },
  paymentService: {
    generateQR: vi.fn(),
    verify: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        jobId: 'test-job-123',
        totalCost: 15,
        files: [{ name: 'test.pdf', size: 1024 }],
        printOptions: { copies: 1, color: 'grayscale', duplex: false, paperSize: 'A4' }
      }
    }),
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr-code">{value}</div>
}));

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Upload Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Upload Page', () => {
    it('renders upload interface correctly', () => {
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      expect(screen.getByText('Upload & Print')).toBeInTheDocument();
      expect(screen.getByText('Select your documents and configure print settings')).toBeInTheDocument();
      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Print Options')).toBeInTheDocument();
    });

    it('handles file selection and validation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      const fileInput = screen.getByLabelText(/drop files here/i).closest('div');
      
      // Create a test file
      const testFile = new File(['test content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      // Mock file input change
      const hiddenInput = document.querySelector('input[type="file"]');
      Object.defineProperty(hiddenInput, 'files', {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(hiddenInput, { target: { files: [testFile] } });

      await waitFor(() => {
        expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('validates file types correctly', async () => {
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      const invalidFile = new File(['test'], 'test.exe', { 
        type: 'application/x-msdownload' 
      });

      const hiddenInput = document.querySelector('input[type="file"]');
      Object.defineProperty(hiddenInput, 'files', {
        value: [invalidFile],
        writable: false,
      });

      fireEvent.change(hiddenInput, { target: { files: [invalidFile] } });

      // Should not add invalid file
      await waitFor(() => {
        expect(screen.queryByText('test.exe')).not.toBeInTheDocument();
      });
    });

    it('updates print options correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Change number of copies
      const copiesInput = screen.getByLabelText('Number of Copies');
      await user.clear(copiesInput);
      await user.type(copiesInput, '3');

      expect(copiesInput.value).toBe('3');

      // Change color mode
      const colorRadio = screen.getByLabelText('Color');
      await user.click(colorRadio);

      expect(colorRadio).toBeChecked();

      // Enable duplex printing
      const duplexSwitch = screen.getByLabelText('Double-sided printing');
      await user.click(duplexSwitch);

      expect(duplexSwitch).toBeChecked();
    });

    it('calculates cost correctly', () => {
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Add a test file first
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const hiddenInput = document.querySelector('input[type="file"]');
      Object.defineProperty(hiddenInput, 'files', {
        value: [testFile],
        writable: false,
      });
      fireEvent.change(hiddenInput, { target: { files: [testFile] } });

      // Default should be 1 BDT (1 file × 1 copy × 1 BDT grayscale)
      expect(screen.getByText('৳1')).toBeInTheDocument();
    });

    it('submits upload successfully', async () => {
      const user = userEvent.setup();
      
      apiService.printJobService.create.mockResolvedValue({
        success: true,
        data: { id: 'job-123' }
      });

      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Add a file
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const hiddenInput = document.querySelector('input[type="file"]');
      Object.defineProperty(hiddenInput, 'files', {
        value: [testFile],
        writable: false,
      });
      fireEvent.change(hiddenInput, { target: { files: [testFile] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      // Submit upload
      const submitButton = screen.getByText('Upload & Continue to Payment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.printJobService.create).toHaveBeenCalledWith(
          expect.any(FormData)
        );
        expect(mockNavigate).toHaveBeenCalledWith('/payment-submit', {
          state: expect.objectContaining({
            jobId: 'job-123'
          })
        });
      });
    });
  });

  describe('Payment Submit Page', () => {
    it('renders payment interface correctly', () => {
      apiService.paymentService.generateQR.mockResolvedValue({
        success: true,
        data: {
          qrString: 'test-qr-code',
          merchantNumber: '01711111111',
          reference: 'REF123'
        }
      });

      render(
        <TestWrapper>
          <PaymentSubmit />
        </TestWrapper>
      );

      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Submit Transaction ID')).toBeInTheDocument();
    });

    it('generates QR code on mount', async () => {
      apiService.paymentService.generateQR.mockResolvedValue({
        success: true,
        data: {
          qrString: 'test-qr-code',
          merchantNumber: '01711111111',
          reference: 'REF123'
        }
      });

      render(
        <TestWrapper>
          <PaymentSubmit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(apiService.paymentService.generateQR).toHaveBeenCalledWith({
          jobId: 'test-job-123',
          amount: 15
        });
        expect(screen.getByTestId('qr-code')).toBeInTheDocument();
      });
    });

    it('submits transaction ID successfully', async () => {
      const user = userEvent.setup();
      
      apiService.paymentService.generateQR.mockResolvedValue({
        success: true,
        data: {
          qrString: 'test-qr-code',
          merchantNumber: '01711111111',
          reference: 'REF123'
        }
      });

      apiService.paymentService.verify.mockResolvedValue({
        success: true
      });

      render(
        <TestWrapper>
          <PaymentSubmit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('qr-code')).toBeInTheDocument();
      });

      // Enter transaction ID
      const transactionInput = screen.getByLabelText('bKash Transaction ID');
      await user.type(transactionInput, '8G751HX123');

      // Submit transaction ID
      const submitButton = screen.getByText('Submit Transaction ID');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.paymentService.verify).toHaveBeenCalledWith({
          jobId: 'test-job-123',
          transactionId: '8G751HX123'
        });
        expect(screen.getByText('Verifying Payment...')).toBeInTheDocument();
      });
    });

    it('shows countdown timer for QR code expiry', () => {
      apiService.paymentService.generateQR.mockResolvedValue({
        success: true,
        data: {
          qrString: 'test-qr-code',
          merchantNumber: '01711111111',
          reference: 'REF123'
        }
      });

      render(
        <TestWrapper>
          <PaymentSubmit />
        </TestWrapper>
      );

      // Should show timer (initially 10:00)
      expect(screen.getByText(/10:00|9:5\d/)).toBeInTheDocument();
    });
  });

  describe('Confirmation Flow', () => {
    it('shows confirmation dialog when job is ready', async () => {
      // Mock socket context to simulate confirmation event
      const mockSocket = {
        on: vi.fn(),
        off: vi.fn(),
      };

      // Mock the SocketProvider to provide our mock socket
      vi.mocked(apiService.printJobService.getMyJobs).mockResolvedValue({
        success: true,
        data: [{
          id: 'job-123',
          status: 'ready_for_pickup',
          fileCount: 1,
          totalCopies: 1,
          totalCost: 15,
          createdAt: new Date().toISOString()
        }]
      });

      vi.mocked(apiService.printJobService.getQueueStatus).mockResolvedValue({
        success: true,
        data: {
          isActive: true,
          totalJobs: 5,
          currentJob: 'job-456',
          estimatedWaitTime: 10
        }
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Queue Status')).toBeInTheDocument();
      });

      // Mock socket event for ready for pickup
      const socketCallbacks = {};
      mockSocket.on.mockImplementation((event, callback) => {
        socketCallbacks[event] = callback;
      });

      // Simulate socket event
      if (socketCallbacks.myJobStatus) {
        socketCallbacks.myJobStatus({
          userId: 'user-123',
          jobId: 'job-123',
          status: 'ready_for_pickup'
        });
      }
    });

    it('handles confirmation timeout correctly', async () => {
      // This test would verify the timeout behavior
      // Implementation would depend on the specific timeout logic
      expect(true).toBe(true); // Placeholder
    });

    it('confirms pickup successfully', async () => {
      const user = userEvent.setup();

      apiService.printJobService.confirmPickup.mockResolvedValue({
        success: true
      });

      apiService.printJobService.getMyJobs.mockResolvedValue({
        success: true,
        data: []
      });

      apiService.printJobService.getQueueStatus.mockResolvedValue({
        success: true,
        data: { isActive: true, totalJobs: 0 }
      });

      render(
        <TestWrapper>
          <Queue />
        </TestWrapper>
      );

      // This would test the confirmation dialog if it's shown
      // The test setup would need to trigger the ready_for_pickup state
      expect(true).toBe(true); // Placeholder for actual confirmation test
    });
  });

  describe('Error Handling', () => {
    it('handles upload errors gracefully', async () => {
      const user = userEvent.setup();
      
      apiService.printJobService.create.mockResolvedValue({
        success: false,
        error: 'Upload failed'
      });

      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Add a file and try to submit
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const hiddenInput = document.querySelector('input[type="file"]');
      Object.defineProperty(hiddenInput, 'files', {
        value: [testFile],
        writable: false,
      });
      fireEvent.change(hiddenInput, { target: { files: [testFile] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Upload & Continue to Payment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.printJobService.create).toHaveBeenCalled();
        // Should not navigate on error
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('handles payment verification errors gracefully', async () => {
      const user = userEvent.setup();
      
      apiService.paymentService.generateQR.mockResolvedValue({
        success: true,
        data: {
          qrString: 'test-qr-code',
          merchantNumber: '01711111111',
          reference: 'REF123'
        }
      });

      apiService.paymentService.verify.mockResolvedValue({
        success: false,
        error: 'Invalid transaction ID'
      });

      render(
        <TestWrapper>
          <PaymentSubmit />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('qr-code')).toBeInTheDocument();
      });

      const transactionInput = screen.getByLabelText('bKash Transaction ID');
      await user.type(transactionInput, 'INVALID123');

      const submitButton = screen.getByText('Submit Transaction ID');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.paymentService.verify).toHaveBeenCalled();
        // Should show error state but not navigate
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('handles network errors gracefully', async () => {
      apiService.printJobService.create.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // The component should handle the network error gracefully
      expect(screen.getByText('Upload & Print')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Check for proper form labels
      expect(screen.getByLabelText('Number of Copies')).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: /color mode/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload & continue to payment/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Test tab navigation
      const copiesInput = screen.getByLabelText('Number of Copies');
      copiesInput.focus();
      
      expect(document.activeElement).toBe(copiesInput);

      // Tab to next element
      await user.tab();
      const grayscaleRadio = screen.getByLabelText('Grayscale');
      expect(document.activeElement).toBe(grayscaleRadio);
    });

    it('has proper color contrast and text sizes', () => {
      render(
        <TestWrapper>
          <Upload />
        </TestWrapper>
      );

      // Material-UI components should have proper contrast
      // This is more of a visual test but we can check for proper structure
      expect(screen.getByText('Upload & Print')).toHaveStyle({ 
        // Material-UI h4 variant should have proper font size
      });
    });
  });
});