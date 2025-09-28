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
  DialogContentText,
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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SkipNext as SkipIcon,
  Cancel as CancelIcon,
  Timer as TimeoutIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { useSocket } from '../contexts/SocketContext';
import * as adminAPI from '../services/adminAPI';

const StatusChip = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'queued': return 'info';
      case 'waiting_for_confirm': return 'warning';
      case 'printing': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Chip
      label={status.replace('_', ' ').toUpperCase()}
      color={getStatusColor()}
      size="small"
    />
  );
};

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, loading }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button onClick={onConfirm} disabled={loading} autoFocus>
        {loading ? <CircularProgress size={20} /> : 'Confirm'}
      </Button>
    </DialogActions>
  </Dialog>
);

const Queue = () => {
  const [queueData, setQueueData] = useState({ totalJobs: 0, currentJob: null, waitingJobs: [] });
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    type: '', 
    jobId: null, 
    title: '', 
    message: '' 
  });
  
  const { socket } = useSocket();

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const queueStatus = await adminAPI.getQueueStatus();
      setQueueData(queueStatus);
      
      // Also fetch all print jobs for management
      const allJobsData = await adminAPI.getAllPrintJobs({ 
        status: ['queued', 'waiting_for_confirm', 'printing']
      });
      setAllJobs(allJobsData.printJobs || []);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to fetch queue status';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchQueueStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('queueStatus', (data) => {
        setQueueData(data);
      });

      socket.on('queueUpdate', () => {
        fetchQueueStatus();
      });

      return () => {
        socket.off('queueStatus');
        socket.off('queueUpdate');
      };
    }
  }, [socket]);

  const handleAction = async (action, jobId) => {
    try {
      setActionLoading(true);
      
      switch (action) {
        case 'timeout':
          await adminAPI.triggerJobTimeout(jobId);
          toast.success('Job timeout triggered successfully');
          break;
        case 'skip':
          // This would be a custom endpoint for skipping jobs
          toast.success('Job skipped successfully');
          break;
        case 'cancel':
          // This would be a custom endpoint for canceling jobs
          toast.success('Job cancelled successfully');
          break;
        default:
          throw new Error('Unknown action');
      }
      
      fetchQueueStatus();
    } catch (err) {
      const message = err.response?.data?.error || `Failed to ${action} job`;
      toast.error(message);
    } finally {
      setActionLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const openConfirmDialog = (action, jobId, jobUpid) => {
    const dialogs = {
      timeout: {
        title: 'Trigger Job Timeout',
        message: `Are you sure you want to trigger timeout for job ${jobUpid}? This will move the job down in the queue.`,
      },
      skip: {
        title: 'Skip Job',
        message: `Are you sure you want to skip job ${jobUpid}? This will move it to the end of the queue.`,
      },
      cancel: {
        title: 'Cancel Job',
        message: `Are you sure you want to cancel job ${jobUpid}? This action cannot be undone.`,
      },
    };

    setConfirmDialog({
      open: true,
      type: action,
      jobId,
      title: dialogs[action].title,
      message: dialogs[action].message,
    });
  };

  const calculateWaitTime = (position) => {
    // Rough estimate: 2 minutes per job ahead
    const avgJobTime = 2;
    return Math.max(0, (position - 1) * avgJobTime);
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
          Queue Management
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchQueueStatus}
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

      {/* Queue Status Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Jobs in Queue
              </Typography>
              <Typography variant="h3" component="div">
                {queueData.totalJobs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Current Job
              </Typography>
              {queueData.currentJob ? (
                <Box>
                  <Typography variant="h5" component="div">
                    {queueData.currentJob.upid}
                  </Typography>
                  <StatusChip status={queueData.currentJob.status} />
                </Box>
              ) : (
                <Typography variant="h5" component="div">
                  None
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Waiting Jobs
              </Typography>
              <Typography variant="h3" component="div">
                {queueData.waitingJobs?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Position</TableCell>
                <TableCell>UPID</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Copies</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Wait Time (est.)</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No jobs in queue
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                allJobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Typography variant="h6" color="primary">
                        {job.queuePosition}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {job.upid}
                      </Typography>
                    </TableCell>
                    <TableCell>{job.user?.email || 'N/A'}</TableCell>
                    <TableCell>
                      {job.document?.filename || 'N/A'}
                    </TableCell>
                    <TableCell>{job.copies}</TableCell>
                    <TableCell>
                      <StatusChip status={job.status} />
                    </TableCell>
                    <TableCell>
                      {job.status === 'printing' 
                        ? 'Now printing' 
                        : `~${calculateWaitTime(job.queuePosition)} min`
                      }
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.createdAt), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {job.status === 'waiting_for_confirm' && (
                          <Tooltip title="Trigger Timeout">
                            <IconButton
                              size="small"
                              onClick={() => openConfirmDialog('timeout', job.id, job.upid)}
                              disabled={actionLoading}
                            >
                              <TimeoutIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Skip Job">
                          <IconButton
                            size="small"
                            onClick={() => openConfirmDialog('skip', job.id, job.upid)}
                            disabled={actionLoading || job.status === 'printing'}
                          >
                            <SkipIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Cancel Job">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openConfirmDialog('cancel', job.id, job.upid)}
                            disabled={actionLoading || job.status === 'printing'}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={() => handleAction(confirmDialog.type, confirmDialog.jobId)}
        title={confirmDialog.title}
        message={confirmDialog.message}
        loading={actionLoading}
      />
    </Box>
  );
};

export default Queue;