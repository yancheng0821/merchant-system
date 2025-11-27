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
import { useTheme } from '../../contexts/ThemeContext';

const TenantActivation: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#14B8A6';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#0D9488';
  const SUCCESS_COLOR = isMonochrome ? '#1a1a1a' : '#10B981';

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
    <Box>
      {/* 页面标题 */}
      <Box mb={3}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 600,
            color: THEME_COLOR,
            mb: 0.5,
          }}
        >
          {t('admin.tenantActivation.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          {t('admin.tenantActivation.subtitle')}
        </Typography>
      </Box>

      {/* 提示信息 */}
      <Alert
        severity="info"
        icon={<InfoIcon sx={{ color: THEME_COLOR }} />}
        sx={{
          mb: 3,
          borderRadius: 2,
          backgroundColor: alpha(THEME_COLOR, 0.06),
          border: '1px solid',
          borderColor: alpha(THEME_COLOR, 0.15),
          '& .MuiAlert-message': {
            color: '#666',
            fontSize: '0.875rem',
          },
        }}
      >
        {t('admin.tenantActivation.infoMessage')}
      </Alert>

      {/* 简约筛选工具栏 */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff',
        }}
      >
        <CardContent sx={{ py: 2, px: 2.5 }}>
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 1.5,
                  bgcolor: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                }}
              >
                <MenuItem value="ALL">{t('admin.tenantActivation.allStatus')}</MenuItem>
                <MenuItem value="ACTIVE">{t('admin.tenantActivation.statusActive')}</MenuItem>
                <MenuItem value="INACTIVE">{t('admin.tenantActivation.statusInactive')}</MenuItem>
                <MenuItem value="SUSPENDED">{t('admin.tenantActivation.statusSuspended')}</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Order */}
            <Button
              size="small"
              variant="outlined"
              startIcon={sortOrder === 'desc' ? <ArrowDownwardIcon sx={{ fontSize: 16 }} /> : <ArrowUpwardIcon sx={{ fontSize: 16 }} />}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                borderColor: isMonochrome ? '#999' : THEME_COLOR,
                color: THEME_COLOR,
                fontSize: '0.8125rem',
                '&:hover': {
                  borderColor: THEME_COLOR_DARK,
                  backgroundColor: isMonochrome ? 'rgba(0,0,0,0.04)' : 'rgba(20, 184, 166, 0.08)',
                },
              }}
            >
              {sortOrder === 'desc' ? t('admin.tenantActivation.newest') : t('admin.tenantActivation.oldest')}
            </Button>

            {/* Results Count */}
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8125rem' }}>
              {t('admin.tenantActivation.showing')} <strong style={{ color: '#1a1a1a' }}>{filteredTenants.length}</strong> {t('admin.tenantActivation.merchants')}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 简约表格卡片 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress sx={{ color: THEME_COLOR }} />
            </Box>
          ) : filteredTenants.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <Typography variant="body2" sx={{ color: '#888' }}>
                {statusFilter !== 'ALL'
                  ? t('admin.tenantActivation.noTenantsWithFilter')
                  : t('admin.tenantActivation.noTenants')}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.tenantCode')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.tenantName')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.contactPerson')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.contactPhone')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.contactEmail')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.createdAt')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                        '& td': { py: 1.5, fontSize: '0.8125rem' }
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                          {tenant.tenantCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                          {tenant.tenantName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                          {tenant.contactPerson}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                          {tenant.contactPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                          {tenant.contactEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(tenant.status)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>
                          {tenant.createdAt}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, tenant)}
                          sx={{
                            color: '#999',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.04)',
                            },
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
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

      {/* Actions Menu - 简约风格 */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 140,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          }
        }}
      >
        <MenuItem
          onClick={() => menuTenant && handleOpenDetailsDialog(menuTenant)}
          sx={{
            py: 1,
            px: 1.5,
            fontSize: '0.8125rem',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <VisibilityIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
          </ListItemIcon>
          <ListItemText
            primary={t('admin.tenantActivation.viewDetails')}
            primaryTypographyProps={{ fontSize: '0.8125rem' }}
          />
        </MenuItem>

        {menuTenant && menuTenant.status === 'INACTIVE' ? (
          <MenuItem
            onClick={() => menuTenant && handleOpenDialog(menuTenant, 'activate')}
            sx={{
              py: 1,
              px: 1.5,
              fontSize: '0.8125rem',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
            </ListItemIcon>
            <ListItemText
              primary={t('admin.tenantActivation.activate')}
              primaryTypographyProps={{ fontSize: '0.8125rem' }}
            />
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => menuTenant && handleOpenDialog(menuTenant, 'deactivate')}
            sx={{
              py: 1,
              px: 1.5,
              fontSize: '0.8125rem',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CancelIcon sx={{ fontSize: 16, color: '#EF4444' }} />
            </ListItemIcon>
            <ListItemText
              primary={t('admin.tenantActivation.deactivate')}
              primaryTypographyProps={{ fontSize: '0.8125rem' }}
            />
          </MenuItem>
        )}
      </Menu>

      {/* Confirmation Dialog - 简约风格 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        TransitionProps={{ onExited: handleDialogExited }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
              {t(`admin.tenantActivation.${actionType}Confirm`)}
            </Typography>
            <IconButton size="small" onClick={handleCloseDialog} sx={{ color: '#999' }}>
              <CancelIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: '0.875rem', color: '#666', mb: 2 }}>
            {t(`admin.tenantActivation.${actionType}ConfirmMessage`, {
              tenantName: selectedTenant?.tenantName
            })}
          </Typography>
          {selectedTenant && (
            <Box sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: '#666', mb: 0.5 }}>
                <strong>{t('admin.tenantActivation.tenantCode')}:</strong> {selectedTenant.tenantCode}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#666', mb: 0.5 }}>
                <strong>{t('admin.tenantActivation.tenantName')}:</strong> {selectedTenant.tenantName}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                <strong>{t('admin.tenantActivation.contactPerson')}:</strong> {selectedTenant.contactPerson}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={handleCloseDialog}
            disabled={processing}
            sx={{
              textTransform: 'none',
              color: '#666',
              fontSize: '0.8125rem',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={handleConfirmAction}
            disabled={processing}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              bgcolor: actionType === 'activate' ? (isMonochrome ? '#1a1a1a' : '#10B981') : (isMonochrome ? '#1a1a1a' : '#EF4444'),
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                bgcolor: actionType === 'activate' ? (isMonochrome ? '#333' : '#059669') : (isMonochrome ? '#333' : '#DC2626'),
                boxShadow: 'none',
              },
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            ) : (
              t('common.confirm')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tenant Details Dialog - 简约风格 */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        TransitionProps={{ onExited: handleDetailsDialogExited }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
              {t('admin.tenantActivation.tenantDetails')}
            </Typography>
            <IconButton size="small" onClick={handleCloseDetailsDialog} sx={{ color: '#999' }}>
              <CancelIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {/* Tenant Basic Info */}
          {selectedTenant && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#fafafa', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', mb: 1.5 }}>
                {t('admin.tenantActivation.basicInfo')}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                  <strong>{t('admin.tenantActivation.tenantCode')}:</strong> {selectedTenant.tenantCode}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                  <strong>{t('admin.tenantActivation.tenantName')}:</strong> {selectedTenant.tenantName}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                  <strong>{t('admin.tenantActivation.contactPerson')}:</strong> {selectedTenant.contactPerson}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                  <strong>{t('admin.tenantActivation.contactPhone')}:</strong> {selectedTenant.contactPhone}
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#666', gridColumn: '1 / -1' }}>
                  <strong>{t('admin.tenantActivation.contactEmail')}:</strong> {selectedTenant.contactEmail}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Subscription Plan */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', mb: 1.5 }}>
              {t('admin.tenantActivation.subscriptionPlan')}
            </Typography>
            {detailsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} sx={{ color: THEME_COLOR }} />
              </Box>
            ) : subscription ? (
              <Box sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                      {t('admin.tenantActivation.planName')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                      {i18n.language === 'zh-CN'
                        ? (subscription.plan?.planNameZh || subscription.plan?.planNameEn || 'N/A')
                        : (subscription.plan?.planNameEn || subscription.plan?.planNameZh || 'N/A')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                      {t('admin.tenantActivation.planStatus')}
                    </Typography>
                    {getStatusChip(subscription.status)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                      {t('admin.tenantActivation.startDate')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                      {subscription.trialStartDate || subscription.currentPeriodStart || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                      {t('admin.tenantActivation.endDate')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                      {subscription.trialEndDate || subscription.currentPeriodEnd || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                      {t('admin.tenantActivation.price')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: SUCCESS_COLOR }}>
                      ${subscription.billingCycle === 'MONTHLY'
                        ? (subscription.plan?.monthlyPrice || 0).toFixed(2)
                        : (subscription.plan?.yearlyPrice || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                      {t('admin.tenantActivation.billingCycle')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                      {subscription.billingCycle === 'MONTHLY' ? t('billing.monthly') : subscription.billingCycle === 'YEARLY' ? t('billing.yearly') : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: '#888', p: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
                {t('admin.tenantActivation.noActiveSubscription')}
              </Typography>
            )}
          </Box>

          {/* Invoice History */}
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a', mb: 1.5 }}>
              {t('admin.tenantActivation.invoiceHistory')}
            </Typography>
            {detailsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} sx={{ color: THEME_COLOR }} />
              </Box>
            ) : invoices.length > 0 ? (
              <TableContainer sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.invoiceNumber')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.amount')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.billingPeriod')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.invoiceStatus')}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('admin.tenantActivation.paymentDate')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} hover sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell sx={{ fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: SUCCESS_COLOR }}>
                            ${invoice.amount.toFixed(2)} {invoice.currency}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {invoice.billingPeriodStart} ~ {invoice.billingPeriodEnd}
                        </TableCell>
                        <TableCell>{getStatusChip(invoice.status === 'PAID' ? 'ACTIVE' : invoice.status)}</TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem', color: '#888', py: 1.5 }}>
                          {invoice.paymentDate || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography sx={{ fontSize: '0.8125rem', color: '#888', p: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
                {t('admin.tenantActivation.noInvoices')}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={handleCloseDetailsDialog}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              bgcolor: THEME_COLOR,
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                bgcolor: THEME_COLOR_DARK,
                boxShadow: 'none',
              },
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
