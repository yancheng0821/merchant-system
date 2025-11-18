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
  ShoppingCart as MaterialIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { costsApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { CurrencyUtils } from '../../../config/constants';

interface MaterialPurchase {
  id?: number;
  tenantId?: number;
  materialName: string;
  materialCategory: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  totalAmount: number | null;
  supplier: string;
  purchaseDate: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
}

const MaterialPurchaseManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [materials, setMaterials] = useState<MaterialPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialPurchase | null>(null);
  const [formData, setFormData] = useState<MaterialPurchase>({
    materialName: '',
    materialCategory: 'CONSUMABLES',
    quantity: null,
    unit: 'PCS',
    unitPrice: null,
    totalAmount: null,
    supplier: '',
    purchaseDate: '',
    paymentStatus: 'PAID',
    paymentMethod: 'TRANSFER',
    notes: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMaterial, setMenuMaterial] = useState<MaterialPurchase | null>(null);

  const categories = [
    { value: 'CONSUMABLES', label: t('costs.materials.categories.consumables') },
    { value: 'TOOLS', label: t('costs.materials.categories.tools') },
    { value: 'EQUIPMENT', label: t('costs.materials.categories.equipment') },
    { value: 'OTHER', label: t('costs.materials.categories.other') },
  ];

  const statusOptions = [
    { value: 'PAID', label: t('costs.materials.status.paid'), color: '#10B981' },
    { value: 'PENDING', label: t('costs.materials.status.pending'), color: '#F59E0B' },
    { value: 'PARTIAL', label: t('costs.materials.status.partial'), color: '#3B82F6' },
  ];

  const units = [
    { value: 'PCS', label: t('costs.materials.units.pcs') },
    { value: 'KG', label: t('costs.materials.units.kg') },
    { value: 'G', label: t('costs.materials.units.g') },
    { value: 'L', label: t('costs.materials.units.l') },
    { value: 'ML', label: t('costs.materials.units.ml') },
    { value: 'M', label: t('costs.materials.units.m') },
    { value: 'BOX', label: t('costs.materials.units.box') },
    { value: 'BOTTLE', label: t('costs.materials.units.bottle') },
    { value: 'PACK', label: t('costs.materials.units.pack') },
    { value: 'SET', label: t('costs.materials.units.set') },
    { value: 'PAIR', label: t('costs.materials.units.pair') },
    { value: 'OTHER', label: t('costs.materials.units.other') },
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    // Auto-calculate total amount
    const qty = formData.quantity ?? 0;
    const price = formData.unitPrice ?? 0;
    const total = qty * price;
    if (total !== formData.totalAmount) {
      setFormData((prev) => ({ ...prev, totalAmount: total }));
    }
  }, [formData.quantity, formData.unitPrice]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await costsApi.getMaterialPurchases(user!.tenantId);
      setMaterials(data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      showSnackbar(t('costs.materials.loadFailed', 'Failed to load materials'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // 搜索过滤
  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materials;
    const term = searchTerm.toLowerCase();
    return materials.filter(material =>
      material.materialName.toLowerCase().includes(term) ||
      material.supplier.toLowerCase().includes(term) ||
      material.materialCategory.toLowerCase().includes(term)
    );
  }, [materials, searchTerm]);

  const handleOpenDialog = (material?: MaterialPurchase) => {
    if (material) {
      setEditingMaterial(material);
      setFormData(material);
    } else {
      setEditingMaterial(null);
      setFormData({
        materialName: '',
        materialCategory: 'CONSUMABLES',
        quantity: null,
        unit: 'PCS',
        unitPrice: null,
        totalAmount: null,
        supplier: '',
        purchaseDate: '',
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDialogExited = () => {
    setEditingMaterial(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.materialName?.trim()) {
      showSnackbar(t('costs.materials.nameRequired', 'Material name is required'), 'error');
      return;
    }

    try {
      // 如果数字字段为空或null，默认设为0
      const dataToSave = {
        ...formData,
        quantity: formData.quantity ?? 0,
        unitPrice: formData.unitPrice ?? 0,
        totalAmount: formData.totalAmount ?? 0,
        tenantId: user!.tenantId
      };
      if (editingMaterial) {
        await costsApi.updateMaterialPurchase(editingMaterial.id!, dataToSave);
        showSnackbar(t('costs.materials.updateSuccess', 'Material purchase updated successfully'), 'success');
      } else {
        await costsApi.createMaterialPurchase(dataToSave);
        showSnackbar(t('costs.materials.createSuccess', 'Material purchase created successfully'), 'success');
      }
      fetchMaterials();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save material:', error);
      const message = error.message || t('costs.materials.saveFailed', 'Failed to save material purchase');
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingMaterial) return;

    try {
      await costsApi.deleteMaterialPurchase(editingMaterial.id!, user!.tenantId);
      showSnackbar(t('costs.materials.deleteSuccess', 'Material purchase deleted successfully'), 'success');
      setOpenDeleteDialog(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      console.error('Failed to delete material:', error);
      const message = error.message || t('costs.materials.deleteFailed', 'Failed to delete material purchase');
      showSnackbar(message, 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, material: MaterialPurchase) => {
    setAnchorEl(event.currentTarget);
    setMenuMaterial(material);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMaterial(null);
  };

  const handleEditFromMenu = () => {
    if (menuMaterial) {
      handleOpenDialog(menuMaterial);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (menuMaterial) {
      setEditingMaterial(menuMaterial);
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
      {/* 现代化搜索和操作区域 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('costs.materials.searchPlaceholder', 'Search materials...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#DC2626',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#DC2626',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                {hasPermission('costs:create_material') && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                      boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #B91C1C, #991B1B)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                      minWidth: 140,
                    }}
                  >
                    {t('costs.materials.addMaterial')}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 现代化表格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.materials.materialName')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.materials.category')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }} align="right">
                  {t('costs.materials.quantity')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }} align="right">
                  {t('costs.materials.unitPrice')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }} align="right">
                  {t('costs.materials.totalAmount')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.materials.supplier')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.materials.purchaseDate')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.materials.statusLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }} align="right">
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#DC2626' }} />
                  </TableCell>
                </TableRow>
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm
                        ? t('costs.materials.noSearchResults', 'No materials match your search')
                        : t('costs.noData', 'No materials found')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow
                    key={material.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#DC2626', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {material.materialName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={categories.find(c => c.value === material.materialCategory)?.label}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: alpha('#DC2626', 0.1),
                          color: '#DC2626',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {material.quantity ?? 0} {units.find(u => u.value === material.unit)?.label || material.unit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {CurrencyUtils.formatAmountWithCommas(Number(material.unitPrice ?? 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>
                        {CurrencyUtils.formatAmountWithCommas(Number(material.totalAmount ?? 0))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {material.supplier || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {material.purchaseDate ? format(new Date(material.purchaseDate), 'yyyy-MM-dd') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusOptions.find(s => s.value === material.paymentStatus)?.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(material.paymentStatus), 0.1),
                          color: getStatusColor(material.paymentStatus),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, material)}
                        sx={{
                          color: '#6B7280',
                          '&:hover': {
                            bgcolor: alpha('#6B7280', 0.1),
                          },
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
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
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          },
        }}
      >
        {hasPermission('costs:update_material') && (
          <MenuItem
            onClick={handleEditFromMenu}
            sx={{ '&:hover': { backgroundColor: alpha('#DC2626', 0.08) } }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18, color: '#DC2626' }} />
            {t('common.edit', 'Edit')}
          </MenuItem>
        )}
        {hasPermission('costs:delete_material') && (
          <MenuItem
            onClick={handleDeleteFromMenu}
            sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
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
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(185, 28, 28, 0.08))',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 3,
            pt: 3,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <MaterialIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 0.5,
                  }}
                >
                  {editingMaterial
                    ? t('costs.materials.editMaterial')
                    : t('costs.materials.addMaterial')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingMaterial
                    ? t('costs.materials.editSubtitle', 'Update material purchase information')
                    : t('costs.materials.addSubtitle', 'Add new material purchase record')}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha('#DC2626', 0.08) },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('costs.materials.materialName')}
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label={t('costs.materials.category')}
                  value={formData.materialCategory}
                  onChange={(e) => setFormData({ ...formData, materialCategory: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('costs.materials.quantity')}
                  value={formData.quantity ?? ''}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? null : Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('costs.materials.unitPrice')}
                  value={formData.unitPrice ?? ''}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value === '' ? null : Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('costs.materials.totalAmount')}
                  value={formData.totalAmount ?? 0}
                  InputProps={{ readOnly: true }}
                  helperText={t('costs.materials.autoCalculated', 'Auto-calculated')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: alpha('#DC2626', 0.04),
                    },
                    '& .MuiInputBase-input': {
                      fontWeight: 600,
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('costs.materials.supplier')}
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('costs.materials.purchaseDate')}
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label={t('costs.materials.statusLabel')}
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label={t('costs.materials.unit')}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('costs.materials.notes')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#DC2626',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              px: 3,
              color: 'text.secondary',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C1C, #991B1B)',
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
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, color: '#EF4444' }}>
          {t('costs.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('costs.materials.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('common.delete')}
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

export default MaterialPurchaseManagement;
