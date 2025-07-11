import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  LocalHospital,
  Security,
  Flight,
  Warning,
  CheckCircle,
  Cancel,
  Pending,
  Refresh,
  ContactPhone,
  Email,
  Person
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchActiveEmergencies, resolveEmergency } from '../../store/slices/emergencySlice';
import { Emergency } from '../../store/slices/emergencySlice';

export const EmergencyDashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { emergencies, loading } = useAppSelector(state => state.emergency);
  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean;
    emergency: Emergency | null;
  }>({ open: false, emergency: null });
  const [resolution, setResolution] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      await dispatch(fetchActiveEmergencies());
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmergencies();
    setRefreshing(false);
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'Medical':
        return <LocalHospital color="error" />;
      case 'Safety':
        return <Security color="warning" />;
      case 'Travel':
        return <Flight color="info" />;
      case 'SOS':
        return <Warning color="error" />;
      default:
        return <Warning />;
    }
  };

  const getPriorityColor = (type: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'Medical':
      case 'SOS':
        return 'error';
      case 'Safety':
        return 'warning';
      case 'Travel':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTimeSinceCreated = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  const handleResolve = async () => {
    if (!resolveDialog.emergency || !resolution.trim()) return;

    try {
      await dispatch(resolveEmergency({
        emergencyId: resolveDialog.emergency.id,
        resolution: resolution.trim()
      })).unwrap();

      setResolveDialog({ open: false, emergency: null });
      setResolution('');
      await fetchEmergencies(); // Refresh the list
    } catch (error) {
      console.error('Failed to resolve emergency:', error);
    }
  };

  const activeEmergencies = emergencies.filter(e => e.status === 'Active');
  const criticalEmergencies = activeEmergencies.filter(e => e.type === 'Medical' || e.type === 'SOS');

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('emergency.dashboard')} 
          <Badge badgeContent={activeEmergencies.length} color="error" sx={{ ml: 2 }}>
            <Warning />
          </Badge>
        </Typography>
        <Tooltip title={t('common.refresh')}>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Critical Alerts */}
      {criticalEmergencies.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🚨 {criticalEmergencies.length} Critical Emergency(ies) Require Immediate Attention
          </Typography>
          <Typography variant="body2">
            Medical emergencies and SOS alerts need urgent response.
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography variant="h4">{activeEmergencies.length}</Typography>
              <Typography variant="body2">Active Emergencies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h4">{criticalEmergencies.length}</Typography>
              <Typography variant="body2">Critical Cases</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h4">
                {activeEmergencies.filter(e => e.emergencyContactNotified).length}
              </Typography>
              <Typography variant="body2">Contacts Notified</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h4">
                {emergencies.filter(e => e.status === 'Resolved').length}
              </Typography>
              <Typography variant="body2">Resolved Today</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emergency Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notifications</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {emergencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" py={4}>
                    {loading ? 'Loading emergencies...' : 'No emergencies found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              emergencies.map((emergency) => (
                <TableRow 
                  key={emergency.id}
                  sx={{ 
                    bgcolor: emergency.status === 'Active' && (emergency.type === 'Medical' || emergency.type === 'SOS') 
                      ? 'error.light' 
                      : emergency.status === 'Active' 
                        ? 'warning.light' 
                        : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getEmergencyIcon(emergency.type)}
                      <Chip 
                        label={emergency.type} 
                        color={getPriorityColor(emergency.type)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {emergency.userName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {emergency.userId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {emergency.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 150 }}>
                      {emergency.location || 'Not specified'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getTimeSinceCreated(emergency.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={emergency.status}
                      color={emergency.status === 'Active' ? 'warning' : emergency.status === 'Resolved' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {emergency.emergencyContactNotified && (
                        <Tooltip title="Emergency contact notified">
                          <ContactPhone color="success" fontSize="small" />
                        </Tooltip>
                      )}
                      {emergency.adminNotified && (
                        <Tooltip title="Admins notified">
                          <Person color="info" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {emergency.status === 'Active' && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => setResolveDialog({ open: true, emergency })}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resolve Emergency Dialog */}
      <Dialog
        open={resolveDialog.open}
        onClose={() => setResolveDialog({ open: false, emergency: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Resolve Emergency - {resolveDialog.emergency?.type}
        </DialogTitle>
        <DialogContent>
          {resolveDialog.emergency && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>User:</strong> {resolveDialog.emergency.userName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Description:</strong> {resolveDialog.emergency.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                <strong>Time:</strong> {new Date(resolveDialog.emergency.createdAt).toLocaleString()}
              </Typography>
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please provide details about how this emergency was resolved and any actions taken.
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Details"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe the actions taken, outcome, and any follow-up required..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, emergency: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            variant="contained"
            color="success"
            disabled={!resolution.trim()}
          >
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
