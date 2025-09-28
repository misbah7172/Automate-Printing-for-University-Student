import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  Print as PrintIcon,
  Queue as QueueIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  Notifications as NotificationIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { printJobService } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Queue = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [jobToConfirm, setJobToConfirm] = useState(null);
  const [confirmationTimer, setConfirmationTimer] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = (data) => {
      setQueueStatus(data);
    };

    const handleJobStatusUpdate = (data) => {
      if (data.userId === user?.id) {
        setMyJobs(prev => prev.map(job => 
          job.id === data.jobId 
            ? { ...job, status: data.status, position: data.position }
            : job
        ));

        // Handle ready for pickup notification
        if (data.status === 'ready_for_pickup') {
          setJobToConfirm(data);
          setShowConfirmDialog(true);
          setConfirmationTimer(300); // 5 minutes
          toast.success(`Your print job is ready for pickup! Please confirm within 5 minutes.`);
        }
      }
    };

    const handleConfirmationTimeout = (data) => {
      if (data.userId === user?.id) {
        toast.error('Confirmation timeout! Your job has been moved to expired.');
        setShowConfirmDialog(false);
        setJobToConfirm(null);
        setConfirmationTimer(null);
      }
    };

    socket.on('queueStatus', handleQueueUpdate);
    socket.on('myJobStatus', handleJobStatusUpdate);
    socket.on('confirmationTimeout', handleConfirmationTimeout);

    return () => {
      socket.off('queueStatus', handleQueueUpdate);
      socket.off('myJobStatus', handleJobStatusUpdate);
      socket.off('confirmationTimeout', handleConfirmationTimeout);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    if (confirmationTimer > 0) {
      const timer = setTimeout(() => setConfirmationTimer(confirmationTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [confirmationTimer]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobsResponse, queueResponse] = await Promise.all([
        printJobService.getMyJobs(),
        printJobService.getQueueStatus()
      ]);

      if (jobsResponse.success) {
        setMyJobs(jobsResponse.data);
      }

      if (queueResponse.success) {
        setQueueStatus(queueResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!jobToConfirm) return;

    try {
      const response = await printJobService.confirmPickup(jobToConfirm.jobId);
      
      if (response.success) {
        toast.success('Pickup confirmed! Thank you for using AutoPrint.');
        setShowConfirmDialog(false);
        setJobToConfirm(null);
        setConfirmationTimer(null);
        loadData(); // Refresh data
      } else {
        toast.error(response.error || 'Failed to confirm pickup');
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error('Failed to confirm pickup');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_payment': return 'warning';
      case 'paid': return 'info';
      case 'in_queue': return 'primary';
      case 'printing': return 'secondary';
      case 'ready_for_pickup': return 'success';
      case 'completed': return 'success';
      case 'expired': return 'error';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_payment': return <TimerIcon />;
      case 'paid': return <CheckIcon />;
      case 'in_queue': return <QueueIcon />;
      case 'printing': return <PrintIcon />;
      case 'ready_for_pickup': return <NotificationIcon />;
      case 'completed': return <CheckIcon />;
      case 'expired': return <ErrorIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <QueueIcon />;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getNextInQueue = () => {
    return myJobs.find(job => 
      ['paid', 'in_queue', 'printing'].includes(job.status) && job.position
    );
  };

  const nextJob = getNextInQueue();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Queue Status
      </Typography>

      <Grid container spacing={3}>
        {/* Current Position */}
        {nextJob && (
          <Grid item xs={12}>
            <Alert 
              severity={nextJob.status === 'printing' ? 'success' : 'info'} 
              sx={{ mb: 2 }}
              icon={
                <Badge badgeContent={nextJob.position} color="primary">
                  <QueueIcon />
                </Badge>
              }
            >
              <Typography variant="h6">
                {nextJob.status === 'printing' 
                  ? 'Your job is currently printing!' 
                  : `You are #${nextJob.position} in the queue`
                }
              </Typography>
              <Typography variant="body2">
                Job ID: {nextJob.id} • Estimated wait: {Math.max(0, (nextJob.position - 1) * 2)} minutes
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Queue Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Printer Status
              </Typography>
              
              {queueStatus ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {queueStatus.isActive ? (
                      <PlayIcon sx={{ color: 'success.main', mr: 1 }} />
                    ) : (
                      <PauseIcon sx={{ color: 'error.main', mr: 1 }} />
                    )}
                    <Typography variant="body1">
                      Printer is {queueStatus.isActive ? 'Active' : 'Offline'}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Queue Information:
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Total jobs in queue" 
                        secondary={queueStatus.totalJobs} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Currently printing" 
                        secondary={queueStatus.currentJob || 'None'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Estimated wait time" 
                        secondary={`${queueStatus.estimatedWaitTime || 0} minutes`} 
                      />
                    </ListItem>
                  </List>

                  {queueStatus.totalJobs > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        Queue Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.max(0, 100 - (queueStatus.totalJobs * 10))} 
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Unable to load printer status
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Jobs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Print Jobs
              </Typography>
              
              {myJobs.length === 0 ? (
                <Typography color="text.secondary">
                  No print jobs found. Upload some files to get started!
                </Typography>
              ) : (
                <List>
                  {myJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${getStatusColor(job.status)}.main` }}>
                            {getStatusIcon(job.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                Job #{job.id}
                              </Typography>
                              <Chip 
                                label={job.status.replace('_', ' ')} 
                                size="small" 
                                color={getStatusColor(job.status)}
                              />
                              {job.position && (
                                <Chip 
                                  label={`#${job.position} in queue`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {job.fileCount} files • {job.totalCopies} copies • ৳{job.totalCost}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Created: {new Date(job.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < myJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  • Printer came online at 10:30 AM<br/>
                  • 3 jobs completed in the last hour<br/>
                  • Average processing time: 2.5 minutes per job<br/>
                  • Next maintenance: Tomorrow 2:00 PM
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmDialog} 
        onClose={() => {}} 
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <NotificationIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
          <Typography variant="h5">Print Job Ready!</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body1">
              Your print job is ready for pickup at the printer location.
            </Typography>
          </Alert>
          
          {confirmationTimer && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" color="error">
                Time remaining: {formatTime(confirmationTimer)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please confirm pickup within this time to avoid expiration
              </Typography>
            </Box>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Job ID: {jobToConfirm?.jobId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Present this ID when collecting your prints
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleConfirmPickup}
            sx={{ minWidth: 200 }}
            startIcon={<CheckIcon />}
          >
            Confirm Pickup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Queue;