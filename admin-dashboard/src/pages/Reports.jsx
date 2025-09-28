import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  TrendingUp as RevenueIcon,
  Print as PrintIcon,
  People as UsersIcon,
  Assessment as ReportsIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

import * as adminAPI from '../services/adminAPI';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: `${color}.main` }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Mock report data - replace with actual API calls
const generateMockData = (dateRange) => {
  const days = Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    summary: {
      totalRevenue: Math.floor(Math.random() * 5000) + 1000,
      totalPrintJobs: Math.floor(Math.random() * 200) + 50,
      totalPages: Math.floor(Math.random() * 1000) + 200,
      uniqueUsers: Math.floor(Math.random() * 50) + 10,
    },
    dailyData: Array.from({ length: days }, (_, i) => {
      const date = new Date(dateRange.startDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 300) + 50,
        printJobs: Math.floor(Math.random() * 20) + 5,
        pages: Math.floor(Math.random() * 100) + 20,
        users: Math.floor(Math.random() * 10) + 2,
      };
    }),
    topUsers: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      email: `student${i + 1}@university.edu`,
      printJobs: Math.floor(Math.random() * 20) + 5,
      pages: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 200) + 30,
    })),
    recentJobs: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      upid: `ABCD${1000 + i}`,
      user: `student${Math.floor(Math.random() * 50) + 1}@university.edu`,
      document: `document_${i + 1}.pdf`,
      pages: Math.floor(Math.random() * 10) + 1,
      amount: Math.floor(Math.random() * 20) + 5,
      status: ['completed', 'cancelled', 'failed'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    })),
  };
};

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    preset: 'today',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const datePresets = {
    today: {
      label: 'Today',
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    },
    yesterday: {
      label: 'Yesterday',
      startDate: startOfDay(subDays(new Date(), 1)),
      endDate: endOfDay(subDays(new Date(), 1)),
    },
    last7days: {
      label: 'Last 7 Days',
      startDate: startOfDay(subDays(new Date(), 6)),
      endDate: endOfDay(new Date()),
    },
    thisWeek: {
      label: 'This Week',
      startDate: startOfWeek(new Date()),
      endDate: endOfDay(new Date()),
    },
    thisMonth: {
      label: 'This Month',
      startDate: startOfMonth(new Date()),
      endDate: endOfDay(new Date()),
    },
    custom: {
      label: 'Custom Range',
      startDate: null,
      endDate: null,
    },
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const startDate = dateRange.preset === 'custom' 
        ? new Date(dateRange.startDate)
        : datePresets[dateRange.preset].startDate;
        
      const endDate = dateRange.preset === 'custom'
        ? new Date(dateRange.endDate)
        : datePresets[dateRange.preset].endDate;

      // For now, use mock data
      // In production, this would call:
      // const data = await adminAPI.getReports({ startDate, endDate });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const mockData = generateMockData({ startDate, endDate });
      setReportData(mockData);
      
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to fetch reports';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePresetChange = (preset) => {
    if (preset === 'custom') {
      setDateRange({
        preset,
        startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      const presetData = datePresets[preset];
      setDateRange({
        preset,
        startDate: format(presetData.startDate, 'yyyy-MM-dd'),
        endDate: format(presetData.endDate, 'yyyy-MM-dd'),
      });
    }
  };

  const handleExport = async () => {
    try {
      toast.success('Export functionality would be implemented here');
      // In production:
      // const blob = await adminAPI.exportReports(dateRange);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `autoprint-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
      // a.click();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExport}
          disabled={loading || !reportData}
        >
          Export
        </Button>
      </Box>

      {/* Date Range Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={dateRange.preset}
                label="Time Period"
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                {Object.entries(datePresets).map(([key, preset]) => (
                  <MenuItem key={key} value={key}>
                    {preset.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {dateRange.preset === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchReports}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && !reportData && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      )}

      {reportData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Revenue"
                value={`৳${reportData.summary.totalRevenue.toLocaleString()}`}
                icon={<RevenueIcon sx={{ fontSize: 40 }} />}
                color="success"
                subtitle={`${reportData.summary.totalPrintJobs} print jobs`}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Print Jobs"
                value={reportData.summary.totalPrintJobs.toLocaleString()}
                icon={<PrintIcon sx={{ fontSize: 40 }} />}
                color="primary"
                subtitle={`${reportData.summary.totalPages} pages printed`}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Pages"
                value={reportData.summary.totalPages.toLocaleString()}
                icon={<ReportsIcon sx={{ fontSize: 40 }} />}
                color="info"
                subtitle={`Avg ${Math.round(reportData.summary.totalPages / reportData.summary.totalPrintJobs)} pages/job`}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Active Users"
                value={reportData.summary.uniqueUsers.toLocaleString()}
                icon={<UsersIcon sx={{ fontSize: 40 }} />}
                color="warning"
                subtitle={`Avg ৳${Math.round(reportData.summary.totalRevenue / reportData.summary.uniqueUsers)} per user`}
              />
            </Grid>
          </Grid>

          {/* Daily Breakdown Table */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper>
                <Box p={2}>
                  <Typography variant="h6" gutterBottom>
                    Daily Breakdown
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Print Jobs</TableCell>
                        <TableCell align="right">Pages</TableCell>
                        <TableCell align="right">Users</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.dailyData.map((day) => (
                        <TableRow key={day.date} hover>
                          <TableCell>
                            {format(new Date(day.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell align="right">৳{day.revenue}</TableCell>
                          <TableCell align="right">{day.printJobs}</TableCell>
                          <TableCell align="right">{day.pages}</TableCell>
                          <TableCell align="right">{day.users}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper>
                <Box p={2}>
                  <Typography variant="h6" gutterBottom>
                    Top Users
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell align="right">Jobs</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.topUsers.slice(0, 10).map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{user.printJobs}</TableCell>
                          <TableCell align="right">৳{user.revenue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Jobs */}
          <Paper sx={{ mt: 3 }}>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Recent Print Jobs
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>UPID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Document</TableCell>
                    <TableCell align="right">Pages</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.recentJobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {job.upid}
                        </Typography>
                      </TableCell>
                      <TableCell>{job.user}</TableCell>
                      <TableCell>{job.document}</TableCell>
                      <TableCell align="right">{job.pages}</TableCell>
                      <TableCell align="right">৳{job.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.status.toUpperCase()}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(job.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Reports;