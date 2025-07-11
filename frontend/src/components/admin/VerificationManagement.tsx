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
  Avatar,
  Grid,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface VerificationDocument {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  isApproved: boolean;
  isRejected: boolean;
  adminComment?: string;
  documentReferences: string;
}

interface VerificationManagementProps {
  className?: string;
}

const VerificationManagement: React.FC<VerificationManagementProps> = ({ className }) => {
  const { t } = useTranslation();
  const [verifications, setVerifications] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VerificationDocument | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/verification/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification documents');
      }

      const data = await response.json();
      setVerifications(data);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      showSnackbar(t('admin.verifications.fetchError', 'Failed to fetch verification documents'), 'error');
      // For demo purposes, set mock data
      setVerifications(generateMockVerifications());
    } finally {
      setLoading(false);
    }
  };

  const generateMockVerifications = (): VerificationDocument[] => [
    {
      id: 1,
      userId: 2,
      userName: 'Jane Smith',
      userEmail: 'jane.smith@example.com',
      fileName: 'passport_jane_smith.pdf',
      contentType: 'application/pdf',
      uploadedAt: '2024-07-11T09:30:00Z',
      isApproved: false,
      isRejected: false,
      documentReferences: 'Passport: P123456789, issued by New Zealand Government, expires 2029-05-15',
    },
    {
      id: 2,
      userId: 4,
      userName: 'Chen Wei',
      userEmail: 'chen.wei@example.com',
      fileName: 'drivers_license_chen.jpg',
      contentType: 'image/jpeg',
      uploadedAt: '2024-07-11T14:15:00Z',
      isApproved: false,
      isRejected: false,
      documentReferences: 'Driver License: DL987654321, issued by Auckland Council, expires 2026-12-31',
    },
    {
      id: 3,
      userId: 5,
      userName: 'Sarah Johnson',
      userEmail: 'sarah.johnson@example.com',
      fileName: 'id_card_sarah.png',
      contentType: 'image/png',
      uploadedAt: '2024-07-10T16:45:00Z',
      isApproved: true,
      isRejected: false,
      adminComment: 'Document verified successfully. Clear photo and valid ID.',
    },
  ];

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleReviewVerification = (verification: VerificationDocument) => {
    setSelectedVerification(verification);
    setAdminComment(verification.adminComment || '');
    setReviewDialogOpen(true);
  };

  const handleApproveVerification = async (verificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/verification/review/${verificationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          approve: true,
          comment: adminComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve verification');
      }

      // Update local state
      setVerifications(prev => prev.map(verification => 
        verification.id === verificationId 
          ? { ...verification, isApproved: true, isRejected: false, adminComment }
          : verification
      ));

      showSnackbar(
        t('admin.verifications.approveSuccess', 'Verification approved successfully'),
        'success'
      );
      setReviewDialogOpen(false);
    } catch (error) {
      console.error('Error approving verification:', error);
      showSnackbar(
        t('admin.verifications.approveError', 'Failed to approve verification'),
        'error'
      );
    }
  };

  const handleRejectVerification = async (verificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/verification/review/${verificationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          approve: false,
          comment: adminComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject verification');
      }

      // Update local state
      setVerifications(prev => prev.map(verification => 
        verification.id === verificationId 
          ? { ...verification, isApproved: false, isRejected: true, adminComment }
          : verification
      ));

      showSnackbar(
        t('admin.verifications.rejectSuccess', 'Verification rejected'),
        'info'
      );
      setReviewDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting verification:', error);
      showSnackbar(
        t('admin.verifications.rejectError', 'Failed to reject verification'),
        'error'
      );
    }
  };

  const getStatusChip = (verification: VerificationDocument) => {
    if (verification.isApproved) {
      return <Chip label={t('approved', 'Approved')} color="success" size="small" />;
    }
    if (verification.isRejected) {
      return <Chip label={t('rejected', 'Rejected')} color="error" size="small" />;
    }
    return <Chip label={t('pending', 'Pending')} color="warning" size="small" />;
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('admin.verifications.columns.id', 'ID'),
      width: 70,
    },
    {
      field: 'user',
      headerName: t('admin.verifications.columns.user', 'User'),
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex items-center space-x-2">
          <Avatar 
            src={params.row.userAvatar}
            alt={params.row.userName}
            sx={{ width: 32, height: 32 }}
          >
            {params.row.userName.split(' ').map((n: string) => n[0]).join('')}
          </Avatar>
          <Box>
            <Typography variant="body2" className="font-medium">
              {params.row.userName}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {params.row.userEmail}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'fileName',
      headerName: t('admin.verifications.columns.document', 'Document'),
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" className="font-medium">
            {params.value}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {params.row.contentType}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'uploadedAt',
      headerName: t('admin.verifications.columns.uploadedAt', 'Uploaded'),
      width: 140,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'status',
      headerName: t('admin.verifications.columns.status', 'Status'),
      width: 120,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.row),
    },
    {
      field: 'adminComment',
      headerName: t('admin.verifications.columns.comment', 'Comment'),
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" className="text-gray-600 truncate">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: t('admin.verifications.columns.actions', 'Actions'),
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex space-x-1">
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => handleReviewVerification(params.row)}
            className="text-blue-600"
          >
            {t('admin.verifications.actions.review', 'Review')}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box className={className}>
      <Box className="mb-4 flex justify-between items-center">
        <Typography variant="h6" className="font-semibold">
          {t('admin.verifications.title', 'Verification Management')}
        </Typography>
      </Box>

      <Box style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={verifications}
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

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('admin.verifications.reviewDialog.title', 'Review Verification Document')}
        </DialogTitle>
        <DialogContent>
          {selectedVerification && (
            <Box className="mt-4">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card className="mb-4">
                    <CardContent>
                      <Typography variant="h6" className="mb-2">
                        {t('admin.verifications.reviewDialog.userInfo', 'User Information')}
                      </Typography>
                      <Box className="space-y-2">
                        <Box className="flex items-center space-x-2">
                          <Avatar src={selectedVerification.userAvatar}>
                            {selectedVerification.userName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" className="font-medium">
                              {selectedVerification.userName}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {selectedVerification.userEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card className="mb-4">
                    <CardContent>
                      <Typography variant="h6" className="mb-2">
                        {t('admin.verifications.reviewDialog.documentInfo', 'Document Information')}
                      </Typography>
                      <Box className="space-y-2">
                        <Typography variant="body2">
                          <strong>{t('fileName', 'File Name')}:</strong> {selectedVerification.fileName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('fileType', 'File Type')}:</strong> {selectedVerification.contentType}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('uploadedAt', 'Uploaded At')}:</strong> {new Date(selectedVerification.uploadedAt).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t('status', 'Status')}:</strong> {getStatusChip(selectedVerification)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card className="mb-4">
                    <CardContent>
                      <Typography variant="h6" className="mb-2">
                        {t('admin.verifications.reviewDialog.documentReferences', 'Document References')}
                      </Typography>
                      <Typography variant="body2" className="bg-gray-50 p-3 rounded">
                        {selectedVerification.documentReferences}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t('admin.verifications.reviewDialog.adminComment', 'Admin Comment')}
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder={t('admin.verifications.reviewDialog.commentPlaceholder', 'Add your review comments here...')}
                    variant="outlined"
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
          <Button
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => selectedVerification && handleRejectVerification(selectedVerification.id)}
            className="mr-2"
          >
            {t('admin.verifications.actions.reject', 'Reject')}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => selectedVerification && handleApproveVerification(selectedVerification.id)}
          >
            {t('admin.verifications.actions.approve', 'Approve')}
          </Button>
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

export default VerificationManagement;
