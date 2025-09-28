import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';

import Payments from '../pages/Payments';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import * as adminAPI from '../services/adminAPI';

// Mock the API
vi.mock('../services/adminAPI');
vi.mock('react-hot-toast');

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

const mockPayments = [
  {
    id: '1',
    txId: 'BKash123456789',
    amount: 10.00,
    method: 'bkash',
    status: 'pending',
    createdAt: new Date().toISOString(),
    user: {
      email: 'student@university.edu'
    },
    printJob: {
      id: 'job1',
      copies: 2,
      colorMode: 'bw',
      paperSize: 'A4',
      document: {
        filename: 'test-document.pdf',
        filePath: 'https://example.com/document.pdf'
      }
    }
  }
];

describe('Payments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders payments list correctly', async () => {
    adminAPI.getPendingPayments.mockResolvedValue({
      payments: mockPayments
    });

    render(
      <TestWrapper>
        <Payments />
      </TestWrapper>
    );

    // Check if the title is rendered
    expect(screen.getByText('Payment Verification')).toBeInTheDocument();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('BKash123456789')).toBeInTheDocument();
    });

    // Check if payment details are displayed
    expect(screen.getByText('student@university.edu')).toBeInTheDocument();
    expect(screen.getByText('৳10')).toBeInTheDocument();
  });

  it('opens verification dialog when approve button is clicked', async () => {
    adminAPI.getPendingPayments.mockResolvedValue({
      payments: mockPayments
    });

    render(
      <TestWrapper>
        <Payments />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('BKash123456789')).toBeInTheDocument();
    });

    // Click the approve button
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    // Check if verification dialog opens
    await waitFor(() => {
      expect(screen.getByText('Payment Verification')).toBeInTheDocument();
    });

    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText('Transaction ID:')).toBeInTheDocument();
  });

  it('handles payment verification successfully', async () => {
    adminAPI.getPendingPayments.mockResolvedValue({
      payments: mockPayments
    });

    adminAPI.verifyPayment.mockResolvedValue({
      upid: 'ABCD1234',
      queuePosition: 1,
      payment: {
        id: '1',
        status: 'verified'
      }
    });

    render(
      <TestWrapper>
        <Payments />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('BKash123456789')).toBeInTheDocument();
    });

    // Click approve button to open dialog
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
    });

    // Click the approve button in dialog
    const dialogApproveButton = screen.getAllByText('Approve')[1];
    fireEvent.click(dialogApproveButton);

    // Wait for API call and success message
    await waitFor(() => {
      expect(adminAPI.verifyPayment).toHaveBeenCalledWith({
        paymentId: '1',
        verified: true,
        adminNotes: ''
      });
    });
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch payments';
    adminAPI.getPendingPayments.mockRejectedValue({
      response: { data: { error: errorMessage } }
    });

    render(
      <TestWrapper>
        <Payments />
      </TestWrapper>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows empty state when no payments exist', async () => {
    adminAPI.getPendingPayments.mockResolvedValue({
      payments: []
    });

    render(
      <TestWrapper>
        <Payments />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No pending payments found')).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    adminAPI.getPendingPayments.mockResolvedValue({
      payments: mockPayments
    });

    render(
      <TestWrapper>
        <Payments />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('BKash123456789')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // API should be called again
    await waitFor(() => {
      expect(adminAPI.getPendingPayments).toHaveBeenCalledTimes(2);
    });
  });
});