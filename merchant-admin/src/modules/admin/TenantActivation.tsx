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
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { tenantApi, TenantInfo, subscriptionApi, invoiceApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

const TenantActivation: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  // Details dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTenant, setMenuTenant] = useState<TenantInfo | null>(null);
  const menuOpen = Boolean(anchorEl);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tenant: TenantInfo) => {
    setAnchorEl(event.currentTarget);
    setMenuTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTenant(null);
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
    handleMenuClose();
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

  const handleOpenDetailsDialog = async (tenant: TenantInfo) => {
    handleMenuClose();
    setSelectedTenant(tenant);
    setDetailsDialogOpen(true);
    setDetailsLoading(true);

    try {
      // Load subscription data
      const subResponse = await subscriptionApi.getActiveSubscription(tenant.id);
      if (subResponse.success && subResponse.data) {
        setSubscription(subResponse.data);
      } else {
        setSubscription(null);
      }

      // Load invoices data
      const invoiceResponse = await invoiceApi.getInvoicesByTenantId(tenant.id);
      if (invoiceResponse.success && invoiceResponse.data) {
        setInvoices(invoiceResponse.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to load tenant details:', error);
      setSubscription(null);
      setInvoices([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
  };

  const handleDetailsDialogExited = () => {
    setSelectedTenant(null);
    setSubscription(null);
    setInvoices([]);
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
            fontWeight: 600,
            color: '#0D9488',
            mb: 0.5,
          }}
        >
          {t('admin.tenantActivation.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
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
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, tenant)}
                          sx={{
                            color: '#6B7280',
                            padding: '4px',
                            '&:hover': {
                              backgroundColor: alpha('#14B8A6', 0.08),
                              color: '#14B8A6',
                            },
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem
          onClick={() => menuTenant && handleOpenDetailsDialog(menuTenant)}
          sx={{
            py: 0.75,
            px: 1.5,
            fontSize: '0.875rem',
            '&:hover': {
              backgroundColor: alpha('#14B8A6', 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <VisibilityIcon sx={{ fontSize: 18, color: '#14B8A6' }} />
          </ListItemIcon>
          <ListItemText
            primary={t('admin.tenantActivation.viewDetails')}
            primaryTypographyProps={{
              fontSize: '0.875rem',
            }}
          />
        </MenuItem>

        {menuTenant && menuTenant.status === 'INACTIVE' ? (
          <MenuItem
            onClick={() => menuTenant && handleOpenDialog(menuTenant, 'activate')}
            sx={{
              py: 0.75,
              px: 1.5,
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: alpha('#10B981', 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CheckCircleIcon sx={{ fontSize: 18, color: '#10B981' }} />
            </ListItemIcon>
            <ListItemText
              primary={t('admin.tenantActivation.activate')}
              primaryTypographyProps={{
                fontSize: '0.875rem',
              }}
            />
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => menuTenant && handleOpenDialog(menuTenant, 'deactivate')}
            sx={{
              py: 0.75,
              px: 1.5,
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: alpha('#EF4444', 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CancelIcon sx={{ fontSize: 18, color: '#EF4444' }} />
            </ListItemIcon>
            <ListItemText
              primary={t('admin.tenantActivation.deactivate')}
              primaryTypographyProps={{
                fontSize: '0.875rem',
              }}
            />
          </MenuItem>
        )}
      </Menu>

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

      {/* Tenant Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        TransitionProps={{
          onExited: handleDetailsDialogExited,
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
              {t('admin.tenantActivation.tenantDetails')}
            </Typography>
            <IconButton onClick={handleCloseDetailsDialog}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Tenant Basic Info */}
          {selectedTenant && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: alpha('#14B8A6', 0.05), borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {t('admin.tenantActivation.basicInfo')}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('admin.tenantActivation.tenantCode')}:</strong> {selectedTenant.tenantCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('admin.tenantActivation.tenantName')}:</strong> {selectedTenant.tenantName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('admin.tenantActivation.contactPerson')}:</strong> {selectedTenant.contactPerson}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('admin.tenantActivation.contactPhone')}:</strong> {selectedTenant.contactPhone}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                  <strong>{t('admin.tenantActivation.contactEmail')}:</strong> {selectedTenant.contactEmail}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Subscription Plan */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {t('admin.tenantActivation.subscriptionPlan')}
            </Typography>
            {detailsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={30} />
              </Box>
            ) : subscription ? (
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: alpha('#14B8A6', 0.2) }}>
                    <CardContent>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t('admin.tenantActivation.planName')}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {i18n.language === 'zh-CN'
                              ? (subscription.plan?.planNameZh || subscription.plan?.planNameEn || 'N/A')
                              : (subscription.plan?.planNameEn || subscription.plan?.planNameZh || 'N/A')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t('admin.tenantActivation.planStatus')}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {subscription.status === 'ACTIVE' ? (
                              <Chip label={t('admin.tenantActivation.statusActive')} color="success" size="small" />
                            ) : subscription.status === 'TRIAL' ? (
                              <Chip label="Trial" color="info" size="small" />
                            ) : subscription.status === 'PAST_DUE' ? (
                              <Chip label="Past Due" color="warning" size="small" />
                            ) : (
                              <Chip label={subscription.status} size="small" />
                            )}
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t('admin.tenantActivation.startDate')}
                          </Typography>
                          <Typography variant="body1">
                            {subscription.trialStartDate || subscription.currentPeriodStart || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t('admin.tenantActivation.endDate')}
                          </Typography>
                          <Typography variant="body1">
                            {subscription.trialEndDate || subscription.currentPeriodEnd || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t('admin.tenantActivation.price')}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981' }}>
                            ${subscription.billingCycle === 'MONTHLY'
                              ? (subscription.plan?.monthlyPrice || 0).toFixed(2)
                              : (subscription.plan?.yearlyPrice || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {t('admin.tenantActivation.billingCycle')}
                          </Typography>
                          <Typography variant="body1">
                            {subscription.billingCycle === 'MONTHLY' ? t('billing.monthly') : subscription.billingCycle === 'YEARLY' ? t('billing.yearly') : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="info">
                    {t('admin.tenantActivation.noActiveSubscription')}
                  </Alert>
                )}
              </Box>

          {/* Invoice History */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {t('admin.tenantActivation.invoiceHistory')}
            </Typography>
            {detailsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={30} />
              </Box>
            ) : invoices.length > 0 ? (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: alpha('#14B8A6', 0.2), borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: alpha('#14B8A6', 0.05) }}>
                          <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.invoiceNumber')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.amount')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.billingPeriod')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.invoiceStatus')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('admin.tenantActivation.paymentDate')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id} hover>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                                ${invoice.amount.toFixed(2)} {invoice.currency}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {invoice.billingPeriodStart} ~ {invoice.billingPeriodEnd}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {invoice.status === 'PAID' ? (
                                <Chip label={t('admin.tenantActivation.invoicePaid')} color="success" size="small" />
                              ) : invoice.status === 'PENDING' ? (
                                <Chip label={t('admin.tenantActivation.invoicePending')} color="warning" size="small" />
                              ) : (
                                <Chip label={invoice.status} size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {invoice.paymentDate || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    {t('admin.tenantActivation.noInvoices')}
                  </Alert>
                )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDetailsDialog}
            variant="contained"
            sx={{
              backgroundColor: '#14B8A6',
              '&:hover': {
                backgroundColor: '#0D9488',
              },
              textTransform: 'none',
            }}
          >
            {t('common.close')}
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
