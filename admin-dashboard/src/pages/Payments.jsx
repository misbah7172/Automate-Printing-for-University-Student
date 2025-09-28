import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { useSocket } from '../contexts/SocketContext';
import * as adminAPI from '../services/adminAPI';

const PaymentStatusChip = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'warning';
      case 'verified': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Chip
      label={status.toUpperCase()}
      color={getStatusColor()}
      size="small"
    />
  );
};

const PaymentVerificationDialog = ({ 
  open, 
  onClose, 
  payment, 
  onVerify,
  loading 
}) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [verificationAction, setVerificationAction] = useState(null);

  const handleVerify = (verified) => {
    setVerificationAction(verified ? 'approve' : 'reject');
    onVerify({
      paymentId: payment?.id,
      verified,
      adminNotes
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Payment Verification
      </DialogTitle>
      
      <DialogContent>
        {payment && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography><strong>Transaction ID:</strong> {payment.txId}</Typography>
              <Typography><strong>Amount:</strong> ৳{payment.amount}</Typography>
              <Typography><strong>Student:</strong> {payment.user?.email}</Typography>
              <Typography><strong>Method:</strong> {payment.method}</Typography>
              <Typography><strong>Submitted:</strong> {format(new Date(payment.createdAt), 'PPpp')}</Typography>
            </Box>

            {payment.printJob && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Print Job Details
                </Typography>
                <Typography><strong>Document:</strong> {payment.printJob.document?.filename}</Typography>
                <Typography><strong>Copies:</strong> {payment.printJob.copies}</Typography>
                <Typography><strong>Color Mode:</strong> {payment.printJob.colorMode}</Typography>
                <Typography><strong>Paper Size:</strong> {payment.printJob.paperSize}</Typography>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Admin Notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add verification notes (optional)"
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={() => handleVerify(false)}
          color="error"
          variant="outlined"
          disabled={loading}
          startIcon={loading && verificationAction === 'reject' ? <CircularProgress size={16} /> : <RejectIcon />}
        >
          Reject
        </Button>
        <Button
          onClick={() => handleVerify(true)}
          color="success"
          variant="contained"
          disabled={loading}
          startIcon={loading && verificationAction === 'approve' ? <CircularProgress size={16} /> : <ApproveIcon />}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DocumentPreviewDialog = ({ open, onClose, document }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Document Preview: {document?.filename}
      </DialogTitle>
      
      <DialogContent>
        {document?.filePath ? (
          <Box sx={{ textAlign: 'center' }}>
            {document.fileType?.startsWith('image/') ? (
              <img
                src={document.filePath}
                alt={document.filename}
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              />
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Preview not available for this file type.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.open(document.filePath, '_blank')}
                >
                  Open in New Tab
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Typography>No preview available</Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationDialog, setVerificationDialog] = useState({ open: false, payment: null });
  const [previewDialog, setPreviewDialog] = useState({ open: false, document: null });
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  const { socket } = useSocket();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getPendingPayments();
      setPayments(data.payments || []);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to fetch payments';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('paymentVerified', () => {
        fetchPayments(); // Refresh the list when payment is verified
      });

      return () => {
        socket.off('paymentVerified');
      };
    }
  }, [socket]);

  const handleVerifyPayment = async (verificationData) => {
    try {
      setVerificationLoading(true);
      const result = await adminAPI.verifyPayment(verificationData);
      
      toast.success(
        verificationData.verified 
          ? `Payment approved! UPID: ${result.upid}` 
          : 'Payment rejected'
      );
      
      setVerificationDialog({ open: false, payment: null });
      fetchPayments(); // Refresh the list
    } catch (err) {
      const message = err.response?.data?.error || 'Verification failed';
      toast.error(message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const openVerificationDialog = (payment) => {
    setVerificationDialog({ open: true, payment });
  };

  const openPreviewDialog = (document) => {
    setPreviewDialog({ open: true, document });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Payment Verification
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPayments}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Student Email</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No pending payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {payment.txId}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.user?.email || 'N/A'}</TableCell>
                    <TableCell>৳{payment.amount}</TableCell>
                    <TableCell>
                      <Chip label={payment.method.toUpperCase()} size="small" />
                    </TableCell>
                    <TableCell>
                      {payment.printJob?.document ? (
                        <Button
                          size="small"
                          onClick={() => openPreviewDialog(payment.printJob.document)}
                          startIcon={<ViewIcon />}
                        >
                          {payment.printJob.document.filename}
                        </Button>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusChip status={payment.status} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Verify Payment">
                        <IconButton
                          color="primary"
                          onClick={() => openVerificationDialog(payment)}
                          disabled={payment.status !== 'pending'}
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PaymentVerificationDialog
        open={verificationDialog.open}
        onClose={() => setVerificationDialog({ open: false, payment: null })}
        payment={verificationDialog.payment}
        onVerify={handleVerifyPayment}
        loading={verificationLoading}
      />

      <DocumentPreviewDialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, document: null })}
        document={previewDialog.document}
      />
    </Box>
  );
};

export default Payments;