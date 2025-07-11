import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Sos as EmergencyIcon,
  LocalHospital,
  Security,
  Flight,
  Warning,
  Phone,
  Cancel
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../store/hooks';
import { triggerEmergency, triggerSOS, cancelEmergency } from '../../store/slices/emergencySlice';

interface EmergencyButtonProps {
  isActive?: boolean;
  onEmergencyTriggered?: () => void;
  flightCompanionRequestId?: number;
  pickupRequestId?: number;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  isActive = false,
  onEmergencyTriggered,
  flightCompanionRequestId,
  pickupRequestId
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<number | null>(null);

  const emergencyTypes = [
    {
      type: 'Medical',
      icon: <LocalHospital sx={{ fontSize: 40, color: 'error.main' }} />,
      title: t('emergency.medical'),
      description: t('emergency.medicalDesc'),
      color: '#f44336'
    },
    {
      type: 'Safety',
      icon: <Security sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: t('emergency.safety'),
      description: t('emergency.safetyDesc'),
      color: '#ff9800'
    },
    {
      type: 'Travel',
      icon: <Flight sx={{ fontSize: 40, color: 'info.main' }} />,
      title: t('emergency.travel'),
      description: t('emergency.travelDesc'),
      color: '#2196f3'
    },
    {
      type: 'SOS',
      icon: <Warning sx={{ fontSize: 40, color: 'error.main' }} />,
      title: t('emergency.sos'),
      description: t('emergency.sosDesc'),
      color: '#d32f2f'
    }
  ];

  const handleEmergencyTrigger = async (type: string, description: string) => {
    setLoading(true);
    try {
      const emergencyData = {
        type,
        description,
        location: await getCurrentLocation(),
        flightCompanionRequestId,
        pickupRequestId
      };

      const result = await dispatch(triggerEmergency(emergencyData)).unwrap();
      setActiveEmergencyId(result.id);
      setOpen(false);
      onEmergencyTriggered?.();
    } catch (error) {
      console.error('Failed to trigger emergency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSOSTrigger = async () => {
    setSosLoading(true);
    try {
      const location = await getCurrentLocation();
      const result = await dispatch(triggerSOS({ location })).unwrap();
      setActiveEmergencyId(result.id);
      onEmergencyTriggered?.();
    } catch (error) {
      console.error('Failed to trigger SOS:', error);
    } finally {
      setSosLoading(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeEmergencyId) return;
    
    try {
      await dispatch(cancelEmergency(activeEmergencyId)).unwrap();
      setActiveEmergencyId(null);
    } catch (error) {
      console.error('Failed to cancel emergency:', error);
    }
  };

  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve(`${latitude}, ${longitude}`);
          },
          () => resolve('Location unavailable')
        );
      } else {
        resolve('Geolocation not supported');
      }
    });
  };

  if (activeEmergencyId) {
    return (
      <Box className="fixed bottom-4 right-4 z-50">
        <Card sx={{ 
          bgcolor: 'error.main', 
          color: 'white',
          minWidth: 280,
          animation: 'pulse 2s infinite'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <EmergencyIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {t('emergency.active')}
                </Typography>
                <Typography variant="body2">
                  {t('emergency.helpOnWay')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              color="inherit"
              size="small"
              startIcon={<Cancel />}
              onClick={handleCancelEmergency}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              {t('emergency.cancel')}
            </Button>
          </CardActions>
        </Card>
      </Box>
    );
  }

  return (
    <>
      {/* Main Emergency Button */}
      <Tooltip title={t('emergency.help')}>
        <IconButton
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50"
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            width: 64,
            height: 64,
            '&:hover': {
              bgcolor: 'error.dark',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease',
            boxShadow: 3
          }}
        >
          <EmergencyIcon sx={{ fontSize: 32 }} />
        </IconButton>
      </Tooltip>

      {/* Quick SOS Button for critical situations */}
      <Tooltip title={t('emergency.quickSOS')}>
        <Button
          variant="contained"
          color="error"
          size="large"
          className="fixed bottom-20 right-4 z-50"
          onClick={handleSOSTrigger}
          disabled={sosLoading}
          startIcon={sosLoading ? <CircularProgress size={20} color="inherit" /> : <Warning />}
          sx={{
            minWidth: 100,
            height: 48,
            fontWeight: 'bold',
            boxShadow: 3,
            animation: isActive ? 'pulse 2s infinite' : 'none'
          }}
        >
          {sosLoading ? t('emergency.sending') : 'SOS'}
        </Button>
      </Tooltip>

      {/* Emergency Type Selection Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <EmergencyIcon color="error" />
            <Typography variant="h5" fontWeight="bold">
              {t('emergency.selectType')}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {t('emergency.warningMessage')}
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            {emergencyTypes.map((emergency) => (
              <Grid item xs={12} sm={6} key={emergency.type}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: 2,
                    borderColor: 'transparent',
                    '&:hover': {
                      borderColor: emergency.color,
                      transform: 'scale(1.02)',
                      boxShadow: 3
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleEmergencyTrigger(emergency.type, emergency.description)}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      textAlign="center"
                      gap={2}
                    >
                      {emergency.icon}
                      <Typography variant="h6" fontWeight="bold">
                        {emergency.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {emergency.description}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box mt={3}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t('emergency.responseInfo')}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};
