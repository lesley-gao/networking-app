import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Gavel as ResolveIcon,
  Visibility as ViewIcon,
  AttachMoney as RefundIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Dispute {
  id: number;
  paymentId: number;
  raisedByUserId: number;
  raisedByUser: {
    name: string;
    email: string;
    avatar?: string;
  };
  reason: string;
  evidenceUrl?: string;
  status: 'Open' | 'UnderReview' | 'Resolved' | 'Refunded' | 'Rejected';
  adminNotes?: string;
  resolvedByAdminId?: number;
  createdAt: string;
  resolvedAt?: string;
  paymentAmount: number;
  serviceName: string;
}

interface DisputeManagementProps {
  className?: string;
}

const DisputeManagement: React.FC<DisputeManagementProps> = ({ className }) => {
  const { t } = useTranslation();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'Resolved' | 'Refunded' | 'Rejected'>('Resolved');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dispute', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }

      const data = await response.json();
      setDisputes(data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      showSnackbar(t('admin.disputes.fetchError', 'Failed to fetch disputes'), 'error');
      // For demo purposes, set mock data
      setDisputes(generateMockDisputes());
    } finally {
      setLoading(false);
    }
  };

  const generateMockDisputes = (): Dispute[] => [
    {
      id: 1,
      paymentId: 101,
      raisedByUserId: 2,
      raisedByUser: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      reason: 'Service not provided as agreed',
      status: 'Open',
      createdAt: '2024-07-11T10:30:00Z',
      paymentAmount: 50.00,
      serviceName: 'Airport Pickup Service',
    },
    {
      id: 2,
      paymentId: 102,
      raisedByUserId: 3,
      raisedByUser: {
        name: 'Wei Li',
        email: 'wei.li@example.com',
      },
      reason: 'Driver was late and unprofessional',
      evidenceUrl: 'https://example.com/evidence/photos.jpg',
      status: 'UnderReview',
      adminNotes: 'Reviewing evidence provided by both parties.',
      createdAt: '2024-07-10T16:45:00Z',
      paymentAmount: 75.00,
      serviceName: 'Flight Companion Service',
    },
    {
      id: 3,
      paymentId: 103,
      raisedByUserId: 4,
      raisedByUser: {
        name: 'Chen Wei',
        email: 'chen.wei@example.com',
      },
      reason: 'Payment charged twice for same service',
      status: 'Resolved',
      adminNotes: 'Duplicate charge confirmed. Refund processed.',
      resolvedByAdminId: 1,
      createdAt: '2024-07-09T14:20:00Z',
      resolvedAt: '2024-07-10T09:15:00Z',
      paymentAmount: 40.00,
      serviceName: 'Airport Pickup Service',
    },
  ];

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleReviewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.adminNotes || '');
    setResolutionStatus('Resolved');
    setReviewDialogOpen(true);
  };

  const handleResolveDispute = async (disputeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dispute/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          disputeId,
          status: resolutionStatus,
          adminNotes,
          adminId: 1, // In real app, get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve dispute');
      }

      // Update local state
      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId 
          ? { 
              ...dispute, 
              status: resolutionStatus,
              adminNotes,
              resolvedAt: new Date().toISOString(),
              resolvedByAdminId: 1,
            }
          : dispute
      ));

      showSnackbar(
        t('admin.disputes.resolveSuccess', 'Dispute resolved successfully'),
        'success'
      );
      setReviewDialogOpen(false);
    } catch (error) {
      console.error('Error resolving dispute:', error);
      showSnackbar(
        t('admin.disputes.resolveError', 'Failed to resolve dispute'),
        'error'
      );
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      Open: { color: 'error' as const, label: t('admin.disputes.status.open', 'Open') },
      UnderReview: { color: 'warning' as const, label: t('admin.disputes.status.underReview', 'Under Review') },
      Resolved: { color: 'success' as const, label: t('admin.disputes.status.resolved', 'Resolved') },
      Refunded: { color: 'info' as const, label: t('admin.disputes.status.refunded', 'Refunded') },
      Rejected: { color: 'default' as const, label: t('admin.disputes.status.rejected', 'Rejected') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Open;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('admin.disputes.columns.id', 'ID'),
      width: 70,
    },
    {
      field: 'raisedByUser',
      headerName: t('admin.disputes.columns.user', 'Reported By'),
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex items-center space-x-2">
          <Avatar 
            src={params.row.raisedByUser.avatar}
            alt={params.row.raisedByUser.name}
            sx={{ width: 32, height: 32 }}
          >
            {params.row.raisedByUser.name.split(' ').map((n: string) => n[0]).join('')}
          </Avatar>
          <Box>
            <Typography variant="body2" className="font-medium">
              {params.row.raisedByUser.name}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {params.row.raisedByUser.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'serviceName',
      headerName: t('admin.disputes.columns.service', 'Service'),
      width: 160,
    },
    {
      field: 'paymentAmount',
      headerName: t('admin.disputes.columns.amount', 'Amount'),
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" className="font-medium">
          ${params.value.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'reason',
      headerName: t('admin.disputes.columns.reason', 'Reason'),
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" className="truncate" title={params.value}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: t('admin.disputes.columns.status', 'Status'),
      width: 130,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value),
    },
    {
      field: 'createdAt',
      headerName: t('admin.disputes.columns.createdAt', 'Created'),
      width: 120,
      valueFormatter: (params: any) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: t('admin.disputes.columns.actions', 'Actions'),
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex space-x-1">
          {params.row.status === 'Open' || params.row.status === 'UnderReview' ? (
            <Button
              size="small"
              startIcon={<ResolveIcon />}
              onClick={() => handleReviewDispute(params.row)}
              className="text-blue-600"
            >
              {t('admin.disputes.actions.resolve', 'Resolve')}
            </Button>
          ) : (
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => handleReviewDispute(params.row)}
              className="text-gray-600"
            >
              {t('admin.disputes.actions.view', 'View')}
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box className={className}>
      <Box className="mb-4 flex justify-between items-center">
        <Typography variant="h6" className="font-semibold">
          {t('admin.disputes.title', 'Dispute Management')}
        </Typography>
      </Box>

      <Box style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={disputes}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
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

      {/* Review/Resolve Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDispute?.status === 'Open' || selectedDispute?.status === 'UnderReview'
            ? t('admin.disputes.resolveDialog.title', 'Resolve Dispute')
            : t('admin.disputes.resolveDialog.viewTitle', 'View Dispute Details')
          }
        </DialogTitle>
        <DialogContent>
          {selectedDispute && (
            <Box className="mt-4">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card className="mb-4">
                    <CardContent>
                      <Typography variant="h6" className="mb-2">
                        {t('admin.disputes.resolveDialog.disputeInfo', 'Dispute Information')}
                      </Typography>
                      <Box className="space-y-2">
                        <Typography variant="body2">
                          <strong>{t('admin.disputes.resolveDialog.disputeId', 'Dispute ID')}:</strong> #{selectedDispute.id}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('admin.disputes.resolveDialog.paymentId', 'Payment ID')}:</strong> #{selectedDispute.paymentId}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('admin.disputes.resolveDialog.amount', 'Amount')}:</strong> ${selectedDispute.paymentAmount.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('admin.disputes.resolveDialog.service', 'Service')}:</strong> {selectedDispute.serviceName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('admin.disputes.resolveDialog.status', 'Status')}:</strong> {getStatusChip(selectedDispute.status)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card className="mb-4">
                    <CardContent>
                      <Typography variant="h6" className="mb-2">
                        {t('admin.disputes.resolveDialog.userInfo', 'Reported By')}
                      </Typography>
                      <Box className="flex items-center space-x-2">
                        <Avatar src={selectedDispute.raisedByUser.avatar}>
                          {selectedDispute.raisedByUser.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" className="font-medium">
                            {selectedDispute.raisedByUser.name}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600">
                            {selectedDispute.raisedByUser.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box className="mt-3">
                        <Typography variant="body2">
                          <strong>{t('admin.disputes.resolveDialog.createdAt', 'Created At')}:</strong> {new Date(selectedDispute.createdAt).toLocaleString()}
                        </Typography>
                        {selectedDispute.resolvedAt && (
                          <Typography variant="body2">
                            <strong>{t('admin.disputes.resolveDialog.resolvedAt', 'Resolved At')}:</strong> {new Date(selectedDispute.resolvedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card className="mb-4">
                    <CardContent>
                      <Typography variant="h6" className="mb-2">
                        {t('admin.disputes.resolveDialog.reason', 'Dispute Reason')}
                      </Typography>
                      <Typography variant="body2" className="bg-gray-50 p-3 rounded">
                        {selectedDispute.reason}
                      </Typography>
                      {selectedDispute.evidenceUrl && (
                        <Box className="mt-2">
                          <Typography variant="body2" className="mb-1">
                            <strong>{t('admin.disputes.resolveDialog.evidence', 'Evidence')}:</strong>
                          </Typography>
                          <Button
                            size="small"
                            href={selectedDispute.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('admin.disputes.resolveDialog.viewEvidence', 'View Evidence')}
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {(selectedDispute.status === 'Open' || selectedDispute.status === 'UnderReview') && (
                  <Grid item xs={12}>
                    <FormControl fullWidth className="mb-4">
                      <InputLabel>{t('admin.disputes.resolveDialog.resolution', 'Resolution')}</InputLabel>
                      <Select
                        value={resolutionStatus}
                        onChange={(e) => setResolutionStatus(e.target.value as 'Resolved' | 'Refunded' | 'Rejected')}
                        label={t('admin.disputes.resolveDialog.resolution', 'Resolution')}
                      >
                        <MenuItem value="Resolved">
                          {t('admin.disputes.resolution.resolved', 'Resolved - No refund')}
                        </MenuItem>
                        <MenuItem value="Refunded">
                          {t('admin.disputes.resolution.refunded', 'Refunded - Issue refund')}
                        </MenuItem>
                        <MenuItem value="Rejected">
                          {t('admin.disputes.resolution.rejected', 'Rejected - Invalid dispute')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t('admin.disputes.resolveDialog.adminNotes', 'Admin Notes')}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={t('admin.disputes.resolveDialog.notesPlaceholder', 'Add resolution notes...')}
                    variant="outlined"
                    disabled={selectedDispute.status !== 'Open' && selectedDispute.status !== 'UnderReview'}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setReviewDialogOpen(false)}>
            {t('cancel', 'Cancel')}
          </Button>
          {selectedDispute && (selectedDispute.status === 'Open' || selectedDispute.status === 'UnderReview') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={resolutionStatus === 'Refunded' ? <RefundIcon /> : <ResolveIcon />}
              onClick={() => selectedDispute && handleResolveDispute(selectedDispute.id)}
            >
              {resolutionStatus === 'Refunded' 
                ? t('admin.disputes.actions.refund', 'Issue Refund')
                : t('admin.disputes.actions.resolve', 'Resolve Dispute')
              }
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default DisputeManagement;
