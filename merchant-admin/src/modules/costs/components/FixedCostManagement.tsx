import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  alpha,
  Menu,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  AccountBalance as CostIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { costsApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { useTheme } from '../../../contexts/ThemeContext';
import { CurrencyUtils } from '../../../config/constants';

interface FixedCost {
  id?: number;
  tenantId?: number;
  costType: string;
  costName: string;
  amount: number | null;
  billingCycle: string;
  paymentDate: string;
  startDate: string;
  endDate: string;
  vendor: string;
  paymentMethod: string;
  status: string;
  notes: string;
}

const FixedCostManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#DC2626';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#B91C1C';

  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [formData, setFormData] = useState<FixedCost>({
    costType: 'RENT',
    costName: '',
    amount: null,
    billingCycle: 'MONTHLY',
    paymentDate: '',
    startDate: '',
    endDate: '',
    vendor: '',
    paymentMethod: 'TRANSFER',
    status: 'PAID',
    notes: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCost, setMenuCost] = useState<FixedCost | null>(null);

  const costTypes = [
    { value: 'RENT', label: t('costs.fixedCosts.types.rent') },
    { value: 'UTILITIES', label: t('costs.fixedCosts.types.utilities') },
    { value: 'INSURANCE', label: t('costs.fixedCosts.types.insurance') },
    { value: 'PROPERTY_FEE', label: t('costs.fixedCosts.types.propertyFee') },
    { value: 'OTHER', label: t('costs.fixedCosts.types.other') },
  ];

  const billingCycles = [
    { value: 'MONTHLY', label: t('costs.fixedCosts.billingCycle.monthly') },
    { value: 'QUARTERLY', label: t('costs.fixedCosts.billingCycle.quarterly') },
    { value: 'YEARLY', label: t('costs.fixedCosts.billingCycle.yearly') },
    { value: 'ONE_TIME', label: t('costs.fixedCosts.billingCycle.oneTime') },
  ];

  const statusOptions = [
    { value: 'PAID', label: t('costs.fixedCosts.status.paid'), color: '#10B981' },
    { value: 'PENDING', label: t('costs.fixedCosts.status.pending'), color: '#F59E0B' },
    { value: 'OVERDUE', label: t('costs.fixedCosts.status.overdue'), color: '#EF4444' },
  ];

  const paymentMethods = [
    { value: 'CASH', label: t('costs.fixedCosts.paymentMethods.cash') },
    { value: 'TRANSFER', label: t('costs.fixedCosts.paymentMethods.transfer') },
    { value: 'CREDIT_CARD', label: t('costs.fixedCosts.paymentMethods.creditCard') },
    { value: 'DEBIT_CARD', label: t('costs.fixedCosts.paymentMethods.debitCard') },
    { value: 'CHECK', label: t('costs.fixedCosts.paymentMethods.check') },
    { value: 'OTHER', label: t('costs.fixedCosts.paymentMethods.other') },
  ];

  useEffect(() => {
    fetchFixedCosts();
  }, []);

  const fetchFixedCosts = async () => {
    setLoading(true);
    try {
      const data = await costsApi.getFixedCosts(user!.tenantId);
      setFixedCosts(data);
    } catch (error) {
      console.error('Failed to fetch fixed costs:', error);
      showSnackbar(t('costs.fixedCosts.loadFailed', 'Failed to load fixed costs'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // 搜索过滤
  const filteredCosts = useMemo(() => {
    if (!searchTerm) return fixedCosts;
    const term = searchTerm.toLowerCase();
    return fixedCosts.filter(cost =>
      cost.costName.toLowerCase().includes(term) ||
      cost.vendor.toLowerCase().includes(term) ||
      costTypes.find(t => t.value === cost.costType)?.label.toLowerCase().includes(term)
    );
  }, [fixedCosts, searchTerm]);

  const handleOpenDialog = (cost?: FixedCost) => {
    if (cost) {
      setEditingCost(cost);
      setFormData(cost);
    } else {
      setEditingCost(null);
      setFormData({
        costType: 'RENT',
        costName: '',
        amount: null,
        billingCycle: 'MONTHLY',
        paymentDate: '',
        startDate: '',
        endDate: '',
        vendor: '',
        paymentMethod: 'TRANSFER',
        status: 'PAID',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDialogExited = () => {
    setEditingCost(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.costName?.trim()) {
      showSnackbar(t('costs.fixedCosts.nameRequired', 'Cost name is required'), 'error');
      return;
    }
    try {
      // 如果金额为空或null，默认设为0
      const dataToSave = {
        ...formData,
        amount: formData.amount ?? 0,
        tenantId: user!.tenantId
      };
      if (editingCost) {
        await costsApi.updateFixedCost(editingCost.id!, dataToSave);
        showSnackbar(t('costs.fixedCosts.updateSuccess', 'Fixed cost updated successfully'), 'success');
      } else {
        await costsApi.createFixedCost(dataToSave);
        showSnackbar(t('costs.fixedCosts.createSuccess', 'Fixed cost created successfully'), 'success');
      }
      fetchFixedCosts();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save fixed cost:', error);
      const message = error.message || t('costs.fixedCosts.saveFailed', 'Failed to save fixed cost');
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingCost) return;

    try {
      await costsApi.deleteFixedCost(editingCost.id!, user!.tenantId);
      showSnackbar(t('costs.fixedCosts.deleteSuccess', 'Fixed cost deleted successfully'), 'success');
      setOpenDeleteDialog(false);
      setEditingCost(null);
      fetchFixedCosts();
    } catch (error: any) {
      console.error('Failed to delete fixed cost:', error);
      const message = error.message || t('costs.fixedCosts.deleteFailed', 'Failed to delete fixed cost');
      showSnackbar(message, 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, cost: FixedCost) => {
    setAnchorEl(event.currentTarget);
    setMenuCost(cost);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCost(null);
  };

  const handleEditFromMenu = () => {
    if (menuCost) {
      handleOpenDialog(menuCost);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (menuCost) {
      setEditingCost(menuCost);
      setOpenDeleteDialog(true);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || '#6B7280';
  };

  return (
    <Box>
      {/* 搜索和操作区域 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('costs.fixedCosts.searchPlaceholder', 'Search fixed costs...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                {hasPermission('costs:create_fixed_cost') && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      borderRadius: 1.5,
                      height: 36,
                      px: 2,
                      fontSize: '0.875rem',
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
                    {t('costs.fixedCosts.addFixedCost')}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                  {t('costs.fixedCosts.costName')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                  {t('costs.fixedCosts.costType')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }} align="right">
                  {t('costs.fixedCosts.amount')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                  {t('costs.fixedCosts.billingCycleLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                  {t('costs.fixedCosts.paymentDate')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                  {t('costs.fixedCosts.paymentMethod')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                  {t('costs.fixedCosts.statusLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 1.5 }} align="right">
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} sx={{ color: THEME_COLOR }} />
                  </TableCell>
                </TableRow>
              ) : filteredCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm
                        ? t('costs.fixedCosts.noSearchResults', 'No fixed costs match your search')
                        : t('costs.noData', 'No fixed costs found')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCosts.map((cost) => (
                  <TableRow
                    key={cost.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(THEME_COLOR, 0.04),
                      },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {cost.costName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={costTypes.find(t => t.value === cost.costType)?.label}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                          bgcolor: alpha(THEME_COLOR, 0.1),
                          color: THEME_COLOR,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: THEME_COLOR }}>
                        {CurrencyUtils.formatAmountWithCommas(Number(cost.amount ?? 0))}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#666' }}>
                        {billingCycles.find(b => b.value === cost.billingCycle)?.label}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {cost.paymentDate ? format(new Date(cost.paymentDate), 'yyyy-MM-dd') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#666' }}>
                        {paymentMethods.find(p => p.value === cost.paymentMethod)?.label || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={statusOptions.find(s => s.value === cost.status)?.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(cost.status), 0.1),
                          color: getStatusColor(cost.status),
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, cost)}
                        sx={{
                          color: '#888',
                          '&:hover': {
                            bgcolor: alpha(THEME_COLOR, 0.08),
                            color: THEME_COLOR,
                          },
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
            minWidth: 140,
            mt: 0.5,
          },
        }}
      >
        {hasPermission('costs:update_fixed_cost') && (
          <MenuItem
            onClick={handleEditFromMenu}
            sx={{
              fontSize: '0.875rem',
              py: 1,
              '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.08) },
            }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 16, color: THEME_COLOR }} />
            {t('common.edit', 'Edit')}
          </MenuItem>
        )}
        {hasPermission('costs:delete_fixed_cost') && (
          <MenuItem
            onClick={handleDeleteFromMenu}
            sx={{
              fontSize: '0.875rem',
              py: 1,
              '&:hover': { backgroundColor: alpha('#EF4444', 0.08) },
            }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 16, color: '#EF4444' }} />
            {t('common.delete', 'Delete')}
          </MenuItem>
        )}
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionProps={{
          onExited: handleDialogExited,
        }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
            pt: 2.5,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <CostIcon sx={{ fontSize: 20, color: THEME_COLOR }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: 'text.primary',
                }}
              >
                {editingCost
                  ? t('costs.fixedCosts.editFixedCost')
                  : t('costs.fixedCosts.addFixedCost')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleCloseDialog}
              sx={{
                color: '#888',
                '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.08) },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('costs.fixedCosts.costName')}
                  value={formData.costName}
                  onChange={(e) => setFormData({ ...formData, costName: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label={t('costs.fixedCosts.costType')}
                  value={formData.costType}
                  onChange={(e) => setFormData({ ...formData, costType: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                >
                  {costTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.875rem' }}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t('costs.fixedCosts.amount')}
                  value={formData.amount ?? ''}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? null : Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label={t('costs.fixedCosts.billingCycleLabel')}
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                >
                  {billingCycles.map((cycle) => (
                    <MenuItem key={cycle.value} value={cycle.value} sx={{ fontSize: '0.875rem' }}>
                      {cycle.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('costs.fixedCosts.paymentDate')}
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('costs.fixedCosts.vendor')}
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('costs.fixedCosts.startDate')}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('costs.fixedCosts.endDate')}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label={t('costs.fixedCosts.statusLabel')}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value} sx={{ fontSize: '0.875rem' }}>
                      {status.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label={t('costs.fixedCosts.paymentMethod')}
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value} sx={{ fontSize: '0.875rem' }}>
                      {method.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label={t('costs.fixedCosts.notes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.875rem',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            size="small"
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 1.5,
              px: 2,
              fontSize: '0.875rem',
              color: '#666',
              textTransform: 'none',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2,
              fontSize: '0.875rem',
              bgcolor: THEME_COLOR,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: THEME_COLOR_DARK,
                boxShadow: 'none',
              },
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxWidth: 360,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
          {t('costs.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {t('costs.fixedCosts.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            size="small"
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              borderRadius: 1.5,
              px: 2,
              fontSize: '0.875rem',
              color: '#666',
              textTransform: 'none',
            }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={handleDelete}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 1.5,
              px: 2,
              fontSize: '0.875rem',
              textTransform: 'none',
              boxShadow: 'none',
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
                boxShadow: 'none',
              },
            }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : t('common.delete')}
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

export default FixedCostManagement;
