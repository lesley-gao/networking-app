import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
  lastUpdated: string;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details?: string;
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalBookings: number;
  totalRevenue: number;
  successRate: number;
  avgResponseTime: number;
}

interface PlatformMonitoringProps {
  className?: string;
}

const PlatformMonitoring: React.FC<PlatformMonitoringProps> = ({ className }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    fetchMonitoringData();
    // Set up real-time updates (in a real app, use WebSocket or Server-Sent Events)
    const interval = setInterval(fetchMonitoringData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // In a real implementation, these would be separate API calls
      const [statsResponse, metricsResponse, logsResponse] = await Promise.allSettled([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/metrics', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/logs', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      // For demo purposes, use mock data
      setStats(generateMockStats());
      setMetrics(generateMockMetrics());
      setActivityLogs(generateMockLogs());
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      showSnackbar(t('admin.monitoring.fetchError', 'Failed to fetch monitoring data'), 'error');
      // Set mock data as fallback
      setStats(generateMockStats());
      setMetrics(generateMockMetrics());
      setActivityLogs(generateMockLogs());
    } finally {
      setLoading(false);
    }
  };

  const generateMockStats = (): PlatformStats => ({
    totalUsers: 1247,
    activeUsers: 423,
    totalBookings: 856,
    totalRevenue: 12450.75,
    successRate: 94.2,
    avgResponseTime: 245,
  });

  const generateMockMetrics = (): SystemMetric[] => [
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 65,
      unit: '%',
      status: 'healthy',
      threshold: 80,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 78,
      unit: '%',
      status: 'warning',
      threshold: 75,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'disk',
      name: 'Disk Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      threshold: 90,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'database',
      name: 'Database Connections',
      value: 23,
      unit: 'connections',
      status: 'healthy',
      threshold: 100,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'api',
      name: 'API Response Time',
      value: 245,
      unit: 'ms',
      status: 'healthy',
      threshold: 500,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'errors',
      name: 'Error Rate',
      value: 2.1,
      unit: '%',
      status: 'warning',
      threshold: 5,
      lastUpdated: new Date().toISOString(),
    },
  ];

  const generateMockLogs = (): ActivityLog[] => [
    {
      id: 1,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      level: 'info',
      source: 'Authentication',
      message: 'User login successful',
      details: 'User ID: 1247, IP: 192.168.1.100',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      level: 'warning',
      source: 'Payment',
      message: 'Payment processing delayed',
      details: 'Payment ID: PAY_789, Amount: $75.00',
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      level: 'error',
      source: 'Database',
      message: 'Connection timeout',
      details: 'Connection to primary database timed out after 30 seconds',
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      level: 'info',
      source: 'Booking',
      message: 'New booking created',
      details: 'Booking ID: BK_456, Service: Flight Companion',
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      level: 'info',
      source: 'Verification',
      message: 'User verification approved',
      details: 'User ID: 892, Document: Passport',
    },
  ];

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon className="text-green-500" />;
      case 'warning':
        return <WarningIcon className="text-yellow-500" />;
      case 'critical':
        return <ErrorIcon className="text-red-500" />;
      default:
        return <HealthyIcon className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <ErrorIcon className="text-red-500" />;
      case 'warning':
        return <WarningIcon className="text-yellow-500" />;
      case 'info':
      default:
        return <HealthyIcon className="text-blue-500" />;
    }
  };

  const activityColumns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: t('admin.monitoring.columns.timestamp', 'Time'),
      width: 140,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleTimeString();
      },
    },
    {
      field: 'level',
      headerName: t('admin.monitoring.columns.level', 'Level'),
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex items-center space-x-1">
          {getLevelIcon(params.value)}
          <Chip
            label={params.value.toUpperCase()}
            size="small"
            color={getStatusColor(params.value === 'info' ? 'healthy' : params.value)}
          />
        </Box>
      ),
    },
    {
      field: 'source',
      headerName: t('admin.monitoring.columns.source', 'Source'),
      width: 120,
    },
    {
      field: 'message',
      headerName: t('admin.monitoring.columns.message', 'Message'),
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'details',
      headerName: t('admin.monitoring.columns.details', 'Details'),
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" className="text-gray-600 truncate" title={params.value}>
          {params.value || '-'}
        </Typography>
      ),
    },
  ];

  if (!stats) {
    return (
      <Box className="flex justify-center items-center min-h-96">
        <Typography variant="h6">
          {t('admin.monitoring.loading', 'Loading monitoring data...')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Box className="mb-6">
        <Typography variant="h6" className="font-semibold mb-4">
          {t('admin.monitoring.title', 'Platform Monitoring')}
        </Typography>

        {/* Platform Statistics */}
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent className="text-center">
                <Typography variant="h4" className="font-bold text-blue-600 mb-1">
                  {stats.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {t('admin.monitoring.stats.totalUsers', 'Total Users')}
                </Typography>
                <Box className="flex items-center justify-center mt-1">
                  <TrendingUpIcon className="text-green-500 text-sm mr-1" />
                  <Typography variant="caption" className="text-green-600">
                    +12%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent className="text-center">
                <Typography variant="h4" className="font-bold text-green-600 mb-1">
                  {stats.activeUsers.toLocaleString()}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {t('admin.monitoring.stats.activeUsers', 'Active Users')}
                </Typography>
                <Box className="flex items-center justify-center mt-1">
                  <TrendingUpIcon className="text-green-500 text-sm mr-1" />
                  <Typography variant="caption" className="text-green-600">
                    +8%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent className="text-center">
                <Typography variant="h4" className="font-bold text-purple-600 mb-1">
                  {stats.totalBookings.toLocaleString()}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {t('admin.monitoring.stats.totalBookings', 'Total Bookings')}
                </Typography>
                <Box className="flex items-center justify-center mt-1">
                  <TrendingUpIcon className="text-green-500 text-sm mr-1" />
                  <Typography variant="caption" className="text-green-600">
                    +15%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent className="text-center">
                <Typography variant="h4" className="font-bold text-orange-600 mb-1">
                  ${stats.totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {t('admin.monitoring.stats.totalRevenue', 'Total Revenue')}
                </Typography>
                <Box className="flex items-center justify-center mt-1">
                  <TrendingUpIcon className="text-green-500 text-sm mr-1" />
                  <Typography variant="caption" className="text-green-600">
                    +22%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent className="text-center">
                <Typography variant="h4" className="font-bold text-teal-600 mb-1">
                  {stats.successRate}%
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {t('admin.monitoring.stats.successRate', 'Success Rate')}
                </Typography>
                <Box className="flex items-center justify-center mt-1">
                  <TrendingDownIcon className="text-red-500 text-sm mr-1" />
                  <Typography variant="caption" className="text-red-600">
                    -1.2%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent className="text-center">
                <Typography variant="h4" className="font-bold text-indigo-600 mb-1">
                  {stats.avgResponseTime}ms
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  {t('admin.monitoring.stats.avgResponseTime', 'Avg Response')}
                </Typography>
                <Box className="flex items-center justify-center mt-1">
                  <TrendingUpIcon className="text-green-500 text-sm mr-1" />
                  <Typography variant="caption" className="text-green-600">
                    -5%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Metrics */}
        <Typography variant="h6" className="font-semibold mb-3">
          {t('admin.monitoring.systemMetrics', 'System Metrics')}
        </Typography>
        <Grid container spacing={3} className="mb-6">
          {metrics.map((metric) => (
            <Grid item xs={12} sm={6} md={4} key={metric.id}>
              <Card>
                <CardContent>
                  <Box className="flex items-center justify-between mb-2">
                    <Typography variant="body1" className="font-medium">
                      {metric.name}
                    </Typography>
                    {getStatusIcon(metric.status)}
                  </Box>
                  <Typography variant="h5" className="font-bold mb-1">
                    {metric.value} {metric.unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(metric.value / metric.threshold) * 100}
                    color={getStatusColor(metric.status) as any}
                    className="mb-2"
                  />
                  <Box className="flex justify-between items-center">
                    <Typography variant="caption" className="text-gray-600">
                      Threshold: {metric.threshold} {metric.unit}
                    </Typography>
                    <Chip
                      label={metric.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(metric.status) as any}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Activity Logs */}
        <Typography variant="h6" className="font-semibold mb-3">
          {t('admin.monitoring.activityLogs', 'Recent Activity')}
        </Typography>
        <Box style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={activityLogs}
            columns={activityColumns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            className="bg-white dark:bg-gray-800"
          />
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PlatformMonitoring;
