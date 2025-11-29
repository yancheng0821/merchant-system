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
  Description as CertificateIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { costsApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { useTheme } from '../../../contexts/ThemeContext';

interface Certificate {
  id?: number;
  tenantId?: number;
  certificateName: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  renewalFee?: number | null;
  status: string;
  notes: string;
}

const CertificateManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#DC2626';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#B91C1C';

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState<Certificate>({
    certificateName: '',
    certificateType: 'BUSINESS_LICENSE',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    renewalFee: null,
    status: 'VALID',
    notes: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCertificate, setMenuCertificate] = useState<Certificate | null>(null);

  const certificateTypes = [
    { value: 'BUSINESS_LICENSE', label: t('costs.certificates.types.businessLicense') },
    { value: 'HEALTH_PERMIT', label: t('costs.certificates.types.healthPermit') },
    { value: 'FIRE_PERMIT', label: t('costs.certificates.types.firePermit') },
    { value: 'OTHER', label: t('costs.certificates.types.other') },
  ];

  const statusOptions = [
    { value: 'VALID', label: t('costs.certificates.status.valid'), color: '#10B981' },
    { value: 'EXPIRING_SOON', label: t('costs.certificates.status.expiringSoon'), color: '#F59E0B' },
    { value: 'EXPIRED', label: t('costs.certificates.status.expired'), color: '#EF4444' },
  ];

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await costsApi.getCertificates(user!.tenantId);
      setCertificates(data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      showSnackbar(t('costs.certificates.loadFailed', 'Failed to load certificates'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // 搜索过滤
  const filteredCertificates = useMemo(() => {
    if (!searchTerm) return certificates;
    const term = searchTerm.toLowerCase();
    return certificates.filter(cert =>
      cert.certificateName.toLowerCase().includes(term) ||
      cert.certificateNumber.toLowerCase().includes(term) ||
      cert.issuingAuthority.toLowerCase().includes(term)
    );
  }, [certificates, searchTerm]);

  const handleOpenDialog = (certificate?: Certificate) => {
    if (certificate) {
      setEditingCertificate(certificate);
      setFormData(certificate);
    } else {
      setEditingCertificate(null);
      setFormData({
        certificateName: '',
        certificateType: 'BUSINESS_LICENSE',
        certificateNumber: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: '',
        renewalFee: null,
        status: 'VALID',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDialogExited = () => {
    setEditingCertificate(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.certificateName?.trim()) {
      showSnackbar(t('costs.certificates.nameRequired', 'Certificate name is required'), 'error');
      return;
    }
    if (!formData.certificateNumber?.trim()) {
      showSnackbar(t('costs.certificates.numberRequired', 'Certificate number is required'), 'error');
      return;
    }

    try {
      // 如果 renewalFee 为空或null，默认设为0
      const dataToSave = {
        ...formData,
        renewalFee: formData.renewalFee ?? 0,
        tenantId: user!.tenantId
      };
      if (editingCertificate) {
        await costsApi.updateCertificate(editingCertificate.id!, dataToSave);
        showSnackbar(t('costs.certificates.updateSuccess', 'Certificate updated successfully'), 'success');
      } else {
        await costsApi.createCertificate(dataToSave);
        showSnackbar(t('costs.certificates.createSuccess', 'Certificate created successfully'), 'success');
      }
      fetchCertificates();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save certificate:', error);
      const message = error.message || t('costs.certificates.saveFailed', 'Failed to save certificate');
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!editingCertificate) return;

    try {
      await costsApi.deleteCertificate(editingCertificate.id!, user!.tenantId);
      showSnackbar(t('costs.certificates.deleteSuccess', 'Certificate deleted successfully'), 'success');
      setOpenDeleteDialog(false);
      setEditingCertificate(null);
      fetchCertificates();
    } catch (error: any) {
      console.error('Failed to delete certificate:', error);
      const message = error.message || t('costs.certificates.deleteFailed', 'Failed to delete certificate');
      showSnackbar(message, 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, certificate: Certificate) => {
    setAnchorEl(event.currentTarget);
    setMenuCertificate(certificate);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCertificate(null);
  };

  const handleEditFromMenu = () => {
    if (menuCertificate) {
      handleOpenDialog(menuCertificate);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (menuCertificate) {
      setEditingCertificate(menuCertificate);
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
      {/* 简约搜索和操作区域 */}
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
                placeholder={t('costs.certificates.searchPlaceholder', 'Search certificates...')}
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
                {hasPermission('costs:create_certificate') && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
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
                    {t('costs.certificates.addCertificate')}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                  {t('costs.certificates.certificateName')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                  {t('costs.certificates.certificateType')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                  {t('costs.certificates.certificateNumber')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                  {t('costs.certificates.expiryDate')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                  {t('costs.certificates.statusLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }} align="right">
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress sx={{ color: THEME_COLOR }} />
                  </TableCell>
                </TableRow>
              ) : filteredCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#888' }}>
                      {searchTerm
                        ? t('costs.certificates.noSearchResults', 'No certificates match your search')
                        : t('costs.noData', 'No certificates found')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCertificates.map((cert) => (
                  <TableRow
                    key={cert.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      '& td': { py: 1.5, fontSize: '0.875rem' }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a' }}>
                        {cert.certificateName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={certificateTypes.find(t => t.value === cert.certificateType)?.label}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 22,
                          bgcolor: alpha(THEME_COLOR, 0.1),
                          color: THEME_COLOR,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                        {cert.certificateNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                        {cert.expiryDate ? format(new Date(cert.expiryDate), 'yyyy-MM-dd') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusOptions.find(s => s.value === cert.status)?.label}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(cert.status), 0.1),
                          color: getStatusColor(cert.status),
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, cert)}
                        sx={{
                          color: '#999',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
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

      {/* Actions Menu - 简约风格 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 140,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          },
        }}
      >
        {hasPermission('costs:update_certificate') && (
          <MenuItem
            onClick={handleEditFromMenu}
            sx={{ py: 1, px: 1.5, fontSize: '0.875rem', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 16, color: THEME_COLOR }} />
            {t('common.edit', 'Edit')}
          </MenuItem>
        )}
        {hasPermission('costs:delete_certificate') && (
          <MenuItem
            onClick={handleDeleteFromMenu}
            sx={{ py: 1, px: 1.5, fontSize: '0.875rem', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 16, color: '#EF4444' }} />
            {t('common.delete', 'Delete')}
          </MenuItem>
        )}
      </Menu>

      {/* Add/Edit Dialog - 简约风格 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onExited: handleDialogExited,
        }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <CertificateIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {editingCertificate
                  ? t('costs.certificates.editCertificate')
                  : t('costs.certificates.addCertificate')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleCloseDialog}
              sx={{ color: '#999' }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('costs.certificates.certificateName')}
                value={formData.certificateName}
                onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label={t('costs.certificates.certificateType')}
                value={formData.certificateType}
                onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              >
                {certificateTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('costs.certificates.certificateNumber')}
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('costs.certificates.issuingAuthority')}
                value={formData.issuingAuthority}
                onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('costs.certificates.issueDate')}
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={t('costs.certificates.expiryDate')}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={t('costs.certificates.renewalFee')}
                value={formData.renewalFee ?? ''}
                onChange={(e) => setFormData({ ...formData, renewalFee: e.target.value === '' ? null : Number(e.target.value) })}
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label={t('costs.certificates.statusLabel')}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label={t('costs.certificates.notes')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={handleCloseDialog}
            sx={{ textTransform: 'none', color: '#666', fontSize: '0.875rem' }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: THEME_COLOR,
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': { bgcolor: THEME_COLOR_DARK, boxShadow: 'none' },
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog - 简约风格 */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('costs.confirmDelete')}
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
            {t('costs.certificates.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={() => setOpenDeleteDialog(false)}
            disabled={loading}
            sx={{ textTransform: 'none', color: '#666', fontSize: '0.875rem' }}
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
              px: 2.5,
              py: 0.75,
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: '#EF4444',
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': { bgcolor: '#DC2626', boxShadow: 'none' },
            }}
          >
            {loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : t('common.delete')}
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

export default CertificateManagement;
