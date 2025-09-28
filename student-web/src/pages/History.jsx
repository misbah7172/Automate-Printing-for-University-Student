import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Print as ReprintIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
// Temporarily commented out due to dependency issues
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { printJobService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const History = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: null,
    endDate: null,
    searchTerm: '',
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showReprintDialog, setShowReprintDialog] = useState(false);
  const [reprintJob, setReprintJob] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, [page, rowsPerPage, filters]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await printJobService.getHistory({
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      });

      if (response.success) {
        setJobs(response.data.jobs);
        setTotalCount(response.data.total);
      } else {
        toast.error(response.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load print history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleReprintRequest = (job) => {
    setReprintJob(job);
    setShowReprintDialog(true);
  };

  const confirmReprint = async () => {
    if (!reprintJob) return;

    try {
      const response = await printJobService.reprint(reprintJob.id);
      
      if (response.success) {
        toast.success('Reprint job created successfully!');
        navigate('/payment-submit', { 
          state: { 
            jobId: response.data.id,
            totalCost: reprintJob.totalCost,
            files: reprintJob.files?.map(f => ({ name: f.name, size: f.size })),
            printOptions: reprintJob.printOptions 
          } 
        });
      } else {
        toast.error(response.error || 'Failed to create reprint job');
      }
    } catch (error) {
      console.error('Reprint error:', error);
      toast.error('Failed to create reprint job');
    } finally {
      setShowReprintDialog(false);
      setReprintJob(null);
    }
  };

  const handleDownloadReceipt = async (jobId) => {
    try {
      const response = await printJobService.downloadReceipt(jobId);
      
      if (response.success) {
        // Create and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Receipt downloaded successfully');
      } else {
        toast.error(response.error || 'Failed to download receipt');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download receipt');
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

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      startDate: null,
      endDate: null,
      searchTerm: '',
    });
  };

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Print History
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search jobs"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Job ID, file name..."
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="in_queue">In Queue</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<FilterIcon />}
                >
                  Clear
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadJobs}
                  startIcon={<RefreshIcon />}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : jobs.length === 0 ? (
              <Alert severity="info">
                No print jobs found. Try adjusting your filters or create your first print job!
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Files</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              #{job.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(job.createdAt).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {job.fileCount} files
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {job.totalCopies} copies
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={formatStatus(job.status)} 
                              color={getStatusColor(job.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              ৳{job.totalCost}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewDetails(job)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {job.status === 'completed' && (
                                <>
                                  <Tooltip title="Reprint">
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleReprintRequest(job)}
                                    >
                                      <ReprintIcon />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Download Receipt">
                                    <IconButton 
                                      size="small" 
                                      color="secondary"
                                      onClick={() => handleDownloadReceipt(job.id)}
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Job Details Dialog */}
        <Dialog 
          open={showJobDetails} 
          onClose={() => setShowJobDetails(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Job Details - #{selectedJob?.id}
          </DialogTitle>
          <DialogContent>
            {selectedJob && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Job Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Status" 
                        secondary={
                          <Chip 
                            label={formatStatus(selectedJob.status)} 
                            color={getStatusColor(selectedJob.status)}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Created" 
                        secondary={new Date(selectedJob.createdAt).toLocaleString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Total Cost" 
                        secondary={`৳${selectedJob.totalCost}`}
                      />
                    </ListItem>
                    {selectedJob.completedAt && (
                      <ListItem>
                        <ListItemText 
                          primary="Completed" 
                          secondary={new Date(selectedJob.completedAt).toLocaleString()}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Print Options
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Copies" 
                        secondary={selectedJob.printOptions?.copies || 1}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Color Mode" 
                        secondary={selectedJob.printOptions?.color || 'grayscale'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Paper Size" 
                        secondary={selectedJob.printOptions?.paperSize || 'A4'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Double-sided" 
                        secondary={selectedJob.printOptions?.duplex ? 'Yes' : 'No'}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {selectedJob.files && selectedJob.files.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Files ({selectedJob.files.length})
                    </Typography>
                    <List dense>
                      {selectedJob.files.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={file.name}
                            secondary={`${file.size} bytes • ${file.type}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowJobDetails(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reprint Confirmation Dialog */}
        <Dialog 
          open={showReprintDialog} 
          onClose={() => setShowReprintDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Confirm Reprint
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Do you want to reprint job #{reprintJob?.id}?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This will create a new print job with the same files and settings.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Cost:</strong> ৳{reprintJob?.totalCost}<br/>
                <strong>Files:</strong> {reprintJob?.fileCount} files<br/>
                <strong>Copies:</strong> {reprintJob?.totalCopies} copies
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowReprintDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={confirmReprint}
              startIcon={<ReprintIcon />}
            >
              Reprint - ৳{reprintJob?.totalCost}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default History;