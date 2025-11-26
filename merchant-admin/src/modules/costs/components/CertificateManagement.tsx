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
                placeholder={t('costs.certificates.searchPlaceholder', 'Search certificates...')}
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
                {hasPermission('costs:create_certificate') && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      borderRadius: 1.5,
                      height: 40,
                      px: 2,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      bgcolor: '#DC2626',
                      boxShadow: 'none',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#B91C1C',
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
                  {t('costs.certificates.certificateName')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.certificates.certificateType')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.certificates.certificateNumber')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.certificates.expiryDate')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('costs.certificates.statusLabel')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }} align="right">
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#DC2626' }} />
                  </TableCell>
                </TableRow>
              ) : filteredCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
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
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#DC2626', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {cert.certificateName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={certificateTypes.find(t => t.value === cert.certificateType)?.label}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: alpha('#DC2626', 0.1),
                          color: '#DC2626',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {cert.certificateNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
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
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, cert)}
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
        {hasPermission('costs:update_certificate') && (
          <MenuItem
            onClick={handleEditFromMenu}
            sx={{ '&:hover': { backgroundColor: alpha('#DC2626', 0.08) } }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18, color: '#DC2626' }} />
            {t('common.edit', 'Edit')}
          </MenuItem>
        )}
        {hasPermission('costs:delete_certificate') && (
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
                <CertificateIcon sx={{ fontSize: 24 }} />
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
                  {editingCertificate
                    ? t('costs.certificates.editCertificate')
                    : t('costs.certificates.addCertificate')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingCertificate
                    ? t('costs.certificates.editSubtitle', 'Update certificate information')
                    : t('costs.certificates.addSubtitle', 'Add new certificate or permit')}
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
                  label={t('costs.certificates.certificateName')}
                  value={formData.certificateName}
                  onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
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
                  label={t('costs.certificates.certificateType')}
                  value={formData.certificateType}
                  onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
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
                  {certificateTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('costs.certificates.certificateNumber')}
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
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
                  label={t('costs.certificates.issuingAuthority')}
                  value={formData.issuingAuthority}
                  onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
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
                  label={t('costs.certificates.issueDate')}
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
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
                  type="date"
                  label={t('costs.certificates.expiryDate')}
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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
                  type="number"
                  label={t('costs.certificates.renewalFee')}
                  value={formData.renewalFee ?? ''}
                  onChange={(e) => setFormData({ ...formData, renewalFee: e.target.value === '' ? null : Number(e.target.value) })}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label={t('costs.certificates.statusLabel')}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('costs.certificates.notes')}
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
            {t('costs.certificates.deleteConfirm')}
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

export default CertificateManagement;
