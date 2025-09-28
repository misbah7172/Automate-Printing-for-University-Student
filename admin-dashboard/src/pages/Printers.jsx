import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Error as ErrorIcon,
  CheckCircle as OnlineIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Opacity as InkIcon,
  Description as PaperIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { useSocket } from '../contexts/SocketContext';
import * as adminAPI from '../services/adminAPI';

const PrinterStatusChip = ({ status }) => {
  const getStatusProps = () => {
    switch (status) {
      case 'online':
        return { color: 'success', icon: <OnlineIcon /> };
      case 'offline':
        return { color: 'error', icon: <ErrorIcon /> };
      case 'warning':
        return { color: 'warning', icon: <WarningIcon /> };
      case 'printing':
        return { color: 'info', icon: <PrintIcon /> };
      default:
        return { color: 'default', icon: <PrintIcon /> };
    }
  };

  const { color, icon } = getStatusProps();
  
  return (
    <Chip
      label={status.toUpperCase()}
      color={color}
      size="small"
      icon={icon}
    />
  );
};

const SupplyLevel = ({ label, level, type, icon }) => {
  const getColor = () => {
    if (level < 20) return 'error';
    if (level < 50) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" mb={1}>
        {icon}
        <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {level}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={level}
        color={getColor()}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};

const PrinterDetailsDialog = ({ open, onClose, printer }) => {
  if (!printer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Printer Details: {printer.name}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              General Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Model" 
                  secondary={printer.model || 'Unknown'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="IP Address" 
                  secondary={printer.ipAddress || 'N/A'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Location" 
                  secondary={printer.location || 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Last Updated" 
                  secondary={format(new Date(printer.lastUpdated), 'PPpp')} 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Supply Levels
            </Typography>
            <Box sx={{ p: 2 }}>
              <SupplyLevel
                label="Black Ink"
                level={printer.supplies?.blackInk || 0}
                type="ink"
                icon={<InkIcon fontSize="small" />}
              />
              <SupplyLevel
                label="Color Ink"
                level={printer.supplies?.colorInk || 0}
                type="ink"
                icon={<InkIcon fontSize="small" color="primary" />}
              />
              <SupplyLevel
                label="Paper Tray"
                level={printer.supplies?.paper || 0}
                type="paper"
                icon={<PaperIcon fontSize="small" />}
              />
            </Box>
          </Grid>
          
          {printer.errors && printer.errors.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="error">
                Current Errors
              </Typography>
              <List>
                {printer.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={error.message}
                      secondary={`Code: ${error.code} - ${format(new Date(error.timestamp), 'PPpp')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Mock printer data - replace with actual API call
const mockPrinters = [
  {
    id: 'printer-1',
    name: 'Main Printer - Ground Floor',
    model: 'HP LaserJet Pro M404dn',
    status: 'online',
    ipAddress: '192.168.1.100',
    location: 'Library - Ground Floor',
    supplies: {
      blackInk: 75,
      colorInk: 60,
      paper: 85,
    },
    lastUpdated: new Date().toISOString(),
    errors: [],
    jobsCompleted: 142,
    totalPages: 3847,
  },
  {
    id: 'printer-2',
    name: 'Secondary Printer - 1st Floor',
    model: 'Canon PIXMA G6020',
    status: 'warning',
    ipAddress: '192.168.1.101',
    location: 'Computer Lab - 1st Floor',
    supplies: {
      blackInk: 15,
      colorInk: 45,
      paper: 20,
    },
    lastUpdated: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    errors: [
      {
        code: 'LOW_INK',
        message: 'Black ink level is critically low',
        timestamp: new Date().toISOString(),
      },
    ],
    jobsCompleted: 89,
    totalPages: 2156,
  },
  {
    id: 'printer-3',
    name: 'Backup Printer - Admin Office',
    model: 'Epson EcoTank ET-4760',
    status: 'offline',
    ipAddress: '192.168.1.102',
    location: 'Admin Office - 2nd Floor',
    supplies: {
      blackInk: 0,
      colorInk: 0,
      paper: 100,
    },
    lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    errors: [
      {
        code: 'OFFLINE',
        message: 'Printer is not responding',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    jobsCompleted: 23,
    totalPages: 456,
  },
];

const Printers = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, printer: null });
  const [workerStatus, setWorkerStatus] = useState(null);
  
  const { socket } = useSocket();

  const fetchPrinterStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For now, use mock data
      // In production, this would call an API endpoint like:
      // const data = await adminAPI.getPrinterStatus();
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPrinters(mockPrinters);
      
      // Also get worker status
      const workerData = await adminAPI.getWorkerStatus();
      setWorkerStatus(workerData);
      
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to fetch printer status';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinterStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrinterStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time printer updates
  useEffect(() => {
    if (socket) {
      socket.on('printerStatusUpdate', (data) => {
        setPrinters(prev => 
          prev.map(printer => 
            printer.id === data.printerId 
              ? { ...printer, ...data.status }
              : printer
          )
        );
      });

      return () => {
        socket.off('printerStatusUpdate');
      };
    }
  }, [socket]);

  const openDetailsDialog = (printer) => {
    setDetailsDialog({ open: true, printer });
  };

  const getPrinterIcon = (status) => {
    switch (status) {
      case 'online': return <OnlineIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'offline': return <ErrorIcon color="error" />;
      case 'printing': return <PrintIcon color="info" />;
      default: return <PrintIcon />;
    }
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
          Printer Status
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPrinterStatus}
          disabled={loading}
        >
          Refresh Status
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Worker Status Card */}
      {workerStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                <Typography variant="body2">Queue Worker:</Typography>
                <Chip 
                  label={workerStatus.queueWorker?.isRunning ? 'Running' : 'Stopped'}
                  color={workerStatus.queueWorker?.isRunning ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box display="flex" alignItems="center">
                <Typography variant="body2">Cleanup Worker:</Typography>
                <Chip 
                  label={workerStatus.documentCleanupWorker?.isRunning ? 'Running' : 'Stopped'}
                  color={workerStatus.documentCleanupWorker?.isRunning ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                Uptime: {Math.floor(workerStatus.serverUptime / 3600)}h {Math.floor((workerStatus.serverUptime % 3600) / 60)}m
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Printers Grid */}
      <Grid container spacing={3}>
        {printers.map((printer) => (
          <Grid item xs={12} md={6} lg={4} key={printer.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    {getPrinterIcon(printer.status)}
                    <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                      {printer.name}
                    </Typography>
                  </Box>
                  <PrinterStatusChip status={printer.status} />
                </Box>
                
                <Typography color="text.secondary" gutterBottom>
                  {printer.model}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {printer.location}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <SupplyLevel
                    label="Black Ink"
                    level={printer.supplies.blackInk}
                    icon={<InkIcon fontSize="small" />}
                  />
                  <SupplyLevel
                    label="Paper"
                    level={printer.supplies.paper}
                    icon={<PaperIcon fontSize="small" />}
                  />
                </Box>

                {printer.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {printer.errors.length} error(s) detected
                  </Alert>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Jobs: {printer.jobsCompleted} | Pages: {printer.totalPages}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated: {format(new Date(printer.lastUpdated), 'HH:mm')}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => openDetailsDialog(printer)}
                >
                  Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {printers.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PrintIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Printers Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No printers are currently registered in the system.
          </Typography>
        </Paper>
      )}

      <PrinterDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, printer: null })}
        printer={detailsDialog.printer}
      />
    </Box>
  );
};

export default Printers;