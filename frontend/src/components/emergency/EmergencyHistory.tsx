import React, { useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  LocalHospital,
  Security,
  Flight,
  Warning,
  CheckCircle,
  Cancel,
  Pending
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyEmergencies, resolveEmergency } from '../../store/slices/emergencySlice';
import { Emergency } from '../../store/slices/emergencySlice';

export const EmergencyHistory: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { emergencies, loading } = useAppSelector(state => state.emergency);
  const [resolveDialog, setResolveDialog] = React.useState<{
    open: boolean;
    emergency: Emergency | null;
  }>({ open: false, emergency: null });
  const [resolution, setResolution] = React.useState('');

  useEffect(() => {
    dispatch(fetchMyEmergencies());
  }, [dispatch]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Pending color="warning" />;
      case 'Resolved':
        return <CheckCircle color="success" />;
      case 'Cancelled':
        return <Cancel color="disabled" />;
      default:
        return <Pending />;
    }
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'Active':
        return 'warning';
      case 'Resolved':
        return 'success';
      case 'Cancelled':
        return 'default';
      default:
        return 'default';
    }
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
    } catch (error) {
      console.error('Failed to resolve emergency:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  if (emergencies.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          {t('emergency.noHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={2}>
          {t('emergency.noHistoryDesc')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {t('emergency.history')}
      </Typography>

      <Grid container spacing={3}>
        {emergencies.map((emergency) => (
          <Grid item xs={12} md={6} lg={4} key={emergency.id}>
            <Card 
              elevation={emergency.status === 'Active' ? 6 : 2}
              sx={{
                border: emergency.status === 'Active' ? 2 : 0,
                borderColor: emergency.status === 'Active' ? 'warning.main' : 'transparent'
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getEmergencyIcon(emergency.type)}
                    <Typography variant="h6">
                      {t(`emergency.${emergency.type.toLowerCase()}`)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(emergency.status)}
                    <Chip
                      label={t(`emergency.status.${emergency.status.toLowerCase()}`)}
                      color={getStatusColor(emergency.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {emergency.description}
                </Typography>

                {emergency.location && (
                  <Typography variant="caption" display="block" mb={1}>
                    📍 {emergency.location}
                  </Typography>
                )}

                <Typography variant="caption" display="block" color="text.secondary">
                  {t('emergency.createdAt')}: {new Date(emergency.createdAt).toLocaleString()}
                </Typography>

                {emergency.resolvedAt && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {t('emergency.resolvedAt')}: {new Date(emergency.resolvedAt).toLocaleString()}
                  </Typography>
                )}

                {emergency.resolution && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {emergency.resolution}
                    </Typography>
                  </Alert>
                )}

                <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                  {emergency.emergencyContactNotified && (
                    <Chip
                      label={t('emergency.contactNotified')}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {emergency.adminNotified && (
                    <Chip
                      label={t('emergency.adminNotified')}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Box>

                {emergency.status === 'Active' && (
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => setResolveDialog({ open: true, emergency })}
                    >
                      {t('emergency.markResolved')}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Resolve Emergency Dialog */}
      <Dialog
        open={resolveDialog.open}
        onClose={() => setResolveDialog({ open: false, emergency: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('emergency.resolveTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('emergency.resolveDesc')}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('emergency.resolutionDetails')}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder={t('emergency.resolutionPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, emergency: null })}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleResolve}
            variant="contained"
            color="success"
            disabled={!resolution.trim()}
          >
            {t('emergency.resolve')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
