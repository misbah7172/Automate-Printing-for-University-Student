import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  QrCode2 as QRCodeIcon,
  CheckCircle as CheckIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { paymentService } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

const PaymentSubmit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const jobData = location.state;

  const [paymentData, setPaymentData] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, verifying, success, failed
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const steps = ['Upload Files', 'Make Payment', 'Confirmation', 'Print Queue'];
  const activeStep = 1;

  useEffect(() => {
    if (!jobData?.jobId) {
      navigate('/upload');
      return;
    }

    generateQRCode();
  }, [jobData, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handlePaymentVerified = (data) => {
      if (data.jobId === jobData?.jobId) {
        setPaymentStatus('success');
        setShowSuccessDialog(true);
        toast.success('Payment verified successfully!');
      }
    };

    const handlePaymentFailed = (data) => {
      if (data.jobId === jobData?.jobId) {
        setPaymentStatus('failed');
        toast.error('Payment verification failed. Please try again.');
      }
    };

    socket.on('paymentVerified', handlePaymentVerified);
    socket.on('paymentFailed', handlePaymentFailed);

    return () => {
      socket.off('paymentVerified', handlePaymentVerified);
      socket.off('paymentFailed', handlePaymentFailed);
    };
  }, [socket, jobData?.jobId]);

  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      toast.error('QR code expired. Please generate a new one.');
    }
  }, [timeLeft, paymentStatus]);

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    
    try {
      const response = await paymentService.generateQR({
        jobId: jobData.jobId,
        amount: jobData.totalCost,
      });

      if (response.success) {
        setPaymentData(response.data);
        setTimeLeft(600); // Reset timer
        toast.success('QR code generated successfully');
      } else {
        toast.error(response.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter the transaction ID');
      return;
    }

    setIsSubmitting(true);
    setPaymentStatus('verifying');

    try {
      const response = await paymentService.verify({
        jobId: jobData.jobId,
        transactionId: transactionId.trim(),
      });

      if (response.success) {
        toast.success('Transaction ID submitted. Verifying payment...');
      } else {
        setPaymentStatus('pending');
        toast.error(response.error || 'Failed to submit transaction ID');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setPaymentStatus('pending');
      toast.error('Failed to submit transaction ID');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinueToQueue = () => {
    setShowSuccessDialog(false);
    navigate('/queue');
  };

  if (!jobData) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Payment
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        {/* Payment Instructions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Instructions
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Scan the QR code with your bKash app or send money manually
                </Typography>
              </Alert>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                {isGeneratingQR ? (
                  <Box sx={{ p: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Generating QR code...
                    </Typography>
                  </Box>
                ) : paymentData ? (
                  <Box>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        display: 'inline-block',
                        border: timeLeft <= 60 ? '2px solid #f44336' : '2px solid #1976d2'
                      }}
                    >
                      <QRCodeSVG 
                        value={paymentData.qrString} 
                        size={200}
                        level="M"
                        includeMargin
                      />
                    </Paper>
                    
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TimerIcon color={timeLeft <= 60 ? 'error' : 'primary'} sx={{ mr: 1 }} />
                      <Typography 
                        variant="h6" 
                        color={timeLeft <= 60 ? 'error' : 'primary'}
                      >
                        {formatTime(timeLeft)}
                      </Typography>
                    </Box>
                    
                    {timeLeft <= 60 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        QR code expires soon!
                      </Alert>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ p: 4 }}>
                    <QRCodeIcon sx={{ fontSize: 100, color: 'grey.400' }} />
                    <Typography variant="body2" color="text.secondary">
                      Click "Generate New QR" to create payment code
                    </Typography>
                  </Box>
                )}
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={generateQRCode}
                disabled={isGeneratingQR}
                startIcon={<RefreshIcon />}
                sx={{ mb: 2 }}
              >
                Generate New QR Code
              </Button>

              {paymentData && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Manual Payment Details:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    bKash Number: {paymentData.merchantNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amount: ৳{jobData.totalCost}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reference: {paymentData.reference}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary & Transaction ID */}
        <Grid item xs={12} md={6}>
          {/* Order Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Files" 
                    secondary={`${jobData.files?.length || 0} documents`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Copies" 
                    secondary={jobData.printOptions?.copies || 1}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Color Mode" 
                    secondary={
                      <Chip 
                        label={jobData.printOptions?.color || 'grayscale'} 
                        size="small"
                        color={jobData.printOptions?.color === 'color' ? 'primary' : 'default'}
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Double-sided" 
                    secondary={jobData.printOptions?.duplex ? 'Yes' : 'No'}
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h5" color="primary">
                  ৳{jobData.totalCost}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Transaction ID Submission */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submit Transaction ID
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                After completing the payment, enter your bKash transaction ID below
              </Typography>

              <TextField
                fullWidth
                label="bKash Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., 8G751HX123"
                disabled={paymentStatus === 'verifying' || paymentStatus === 'success'}
                sx={{ mb: 2 }}
                helperText="You can find this in your bKash app or SMS confirmation"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmitTransaction}
                disabled={!transactionId.trim() || isSubmitting || paymentStatus === 'verifying' || paymentStatus === 'success'}
                startIcon={
                  paymentStatus === 'verifying' ? <CircularProgress size={20} /> :
                  paymentStatus === 'success' ? <CheckIcon /> : <PaymentIcon />
                }
                color={paymentStatus === 'success' ? 'success' : 'primary'}
              >
                {paymentStatus === 'verifying' ? 'Verifying Payment...' :
                 paymentStatus === 'success' ? 'Payment Verified' :
                 'Submit Transaction ID'}
              </Button>

              {paymentStatus === 'verifying' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Please wait while we verify your payment. This may take a few moments.
                  </Typography>
                </Alert>
              )}

              {paymentStatus === 'failed' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Payment verification failed. Please check your transaction ID and try again.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Dialog */}
      <Dialog 
        open={showSuccessDialog} 
        onClose={() => {}} 
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
          <Typography variant="h5">Payment Successful!</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
            Your payment has been verified and your print job has been added to the queue.
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Job ID: {jobData.jobId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can track your print job in the Queue section
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleContinueToQueue}
            sx={{ minWidth: 200 }}
          >
            Continue to Queue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentSubmit;