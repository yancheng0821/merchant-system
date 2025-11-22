import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  alpha,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { tenantApi, TenantInfo } from '../../services/api';
import { useTranslation } from 'react-i18next';

const TenantActivation: React.FC = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate'>('activate');
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadTenants = async () => {
    setLoading(true);
    try {
      const response = await tenantApi.getAllTenants();
      if (response.success && response.data) {
        setTenants(response.data);
      } else {
        showSnackbar(t('admin.tenantActivation.loadFailed'), 'error');
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
      showSnackbar(t('admin.tenantActivation.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleOpenDialog = (tenant: TenantInfo, type: 'activate' | 'deactivate') => {
    setSelectedTenant(tenant);
    setActionType(type);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleDialogExited = () => {
    setSelectedTenant(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedTenant) return;

    setProcessing(true);
    try {
      const response = actionType === 'activate'
        ? await tenantApi.activateTenant(selectedTenant.id)
        : await tenantApi.deactivateTenant(selectedTenant.id);

      if (response.success) {
        showSnackbar(
          t(`admin.tenantActivation.${actionType}Success`),
          'success'
        );
        handleCloseDialog();
        loadTenants(); // Reload the list
      } else {
        showSnackbar(
          t(`admin.tenantActivation.${actionType}Failed`),
          'error'
        );
      }
    } catch (error) {
      console.error(`Failed to ${actionType} tenant:`, error);
      showSnackbar(
        t(`admin.tenantActivation.${actionType}Failed`),
        'error'
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
      'ACTIVE': { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('admin.tenantActivation.statusActive') },
      'INACTIVE': { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('admin.tenantActivation.statusInactive') },
      'SUSPENDED': { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('admin.tenantActivation.statusSuspended') },
    };

    const config = statusConfig[status] || { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: status };

    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
    );
  };

  // Filter and sort tenants
  const getFilteredAndSortedTenants = () => {
    let filtered = tenants;

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter);
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  };

  const filteredTenants = getFilteredAndSortedTenants();

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box mb={4}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #0D9488, #14B8A6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            fontSize: 26
          }}
        >
          {t('admin.tenantActivation.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: 15 }}>
          {t('admin.tenantActivation.subtitle')}
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 3,
          borderRadius: 2,
          backgroundColor: alpha('#14B8A6', 0.08),
          border: 'none',
        }}
      >
        {t('admin.tenantActivation.infoMessage')}
      </Alert>

      {/* Filter and Sort Controls */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            {/* Status Filter */}
            <FormControl
              sx={{
                minWidth: 200,
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#14B8A6',
                },
              }}
            >
              <InputLabel>{t('admin.tenantActivation.filterByStatus')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('admin.tenantActivation.filterByStatus')}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#14B8A6',
                  },
                }}
              >
                <MenuItem value="ALL">{t('admin.tenantActivation.allStatus')}</MenuItem>
                <MenuItem value="ACTIVE">{t('admin.tenantActivation.statusActive')}</MenuItem>
                <MenuItem value="INACTIVE">{t('admin.tenantActivation.statusInactive')}</MenuItem>
                <MenuItem value="SUSPENDED">{t('admin.tenantActivation.statusSuspended')}</MenuItem>
              </Select>
            </FormControl>

            {/* Results Count */}
            <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'left' } }}>
              <Typography variant="body2" color="text.secondary">
                {t('admin.tenantActivation.showing')} <strong>{filteredTenants.length}</strong> {t('admin.tenantActivation.merchants')}
              </Typography>
            </Box>

            {/* Sort Order */}
            <Button
              variant="outlined"
              startIcon={sortOrder === 'desc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                borderColor: alpha('#14B8A6', 0.3),
                color: '#14B8A6',
                '&:hover': {
                  borderColor: '#14B8A6',
                  backgroundColor: alpha('#14B8A6', 0.05),
                },
              }}
            >
              {t('admin.tenantActivation.sortByDate')} ({sortOrder === 'desc' ? t('admin.tenantActivation.newest') : t('admin.tenantActivation.oldest')})
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: alpha('#14B8A6', 0.1),
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : filteredTenants.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Typography variant="body1" color="text.secondary">
                {statusFilter !== 'ALL'
                  ? t('admin.tenantActivation.noTenantsWithFilter')
                  : t('admin.tenantActivation.noTenants')}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha('#14B8A6', 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.tenantCode')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.tenantName')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.contactPerson')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.contactPhone')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.contactEmail')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.createdAt')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id} hover>
                      <TableCell>{tenant.tenantCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {tenant.tenantName}
                        </Typography>
                      </TableCell>
                      <TableCell>{tenant.contactPerson}</TableCell>
                      <TableCell>{tenant.contactPhone}</TableCell>
                      <TableCell>{tenant.contactEmail}</TableCell>
                      <TableCell>{getStatusChip(tenant.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {tenant.createdAt}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {tenant.status === 'INACTIVE' ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleOpenDialog(tenant, 'activate')}
                              sx={{
                                backgroundColor: '#10B981',
                                '&:hover': {
                                  backgroundColor: '#059669',
                                },
                                textTransform: 'none',
                                borderRadius: 1.5,
                              }}
                            >
                              {t('admin.tenantActivation.activate')}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CancelIcon />}
                              onClick={() => handleOpenDialog(tenant, 'deactivate')}
                              sx={{
                                backgroundColor: '#EF4444',
                                '&:hover': {
                                  backgroundColor: '#DC2626',
                                },
                                textTransform: 'none',
                                borderRadius: 1.5,
                              }}
                            >
                              {t('admin.tenantActivation.deactivate')}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onExited: handleDialogExited,
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t(`admin.tenantActivation.${actionType}Confirm`)}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t(`admin.tenantActivation.${actionType}ConfirmMessage`, {
              tenantName: selectedTenant?.tenantName
            })}
          </Typography>
          {selectedTenant && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: alpha('#14B8A6', 0.05), borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('admin.tenantActivation.tenantCode')}:</strong> {selectedTenant.tenantCode}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{t('admin.tenantActivation.tenantName')}:</strong> {selectedTenant.tenantName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('admin.tenantActivation.contactPerson')}:</strong> {selectedTenant.contactPerson}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={processing}
            sx={{ textTransform: 'none' }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmAction}
            disabled={processing}
            variant="contained"
            sx={{
              backgroundColor: actionType === 'activate' ? '#10B981' : '#EF4444',
              '&:hover': {
                backgroundColor: actionType === 'activate' ? '#059669' : '#DC2626',
              },
              textTransform: 'none',
            }}
          >
            {processing ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              t('common.confirm')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TenantActivation;
