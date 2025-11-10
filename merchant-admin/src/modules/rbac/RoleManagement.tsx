import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  alpha,
  Tooltip,
  InputAdornment,
  Paper,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as RoleIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  TrendingUp as LevelIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { roleApi, Role } from '../../services/permissionApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';

const RoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    roleName: '',
    roleCode: '',
    displayName: '',
    description: '',
    level: 50,
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await roleApi.getAllRoles(user?.tenantId);
      if (response.success && response.data) {
        setRoles(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!hasPermission('rbac:create_role')) {
      showSnackbar(t('common.noPermission'), 'error');
      return;
    }
    setEditingRole(null);
    setFormData({
      roleName: '',
      roleCode: '',
      displayName: '',
      description: '',
      level: 50,
    });
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    if (!hasPermission('rbac:update_role')) {
      showSnackbar(t('common.noPermission'), 'error');
      return;
    }
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      roleCode: role.roleCode,
      displayName: role.displayName || '',
      description: role.description || '',
      level: role.level || 50,
    });
    setDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (!hasPermission('rbac:delete_role')) {
      showSnackbar(t('common.noPermission'), 'error');
      return;
    }
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRole) return;

    try {
      await roleApi.deleteRole(deletingRole.id);
      showSnackbar(t('rbac.roleDeletedSuccess'), 'success');
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      loadRoles();
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.saveError'), 'error');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const roleData = {
        roleName: formData.roleName,
        roleCode: formData.roleCode,
        displayName: formData.displayName,
        description: formData.description,
        level: formData.level,
        tenantId: user?.tenantId,
        isSystem: false,
        status: 'ACTIVE' as const,
      };

      if (editingRole) {
        await roleApi.updateRole(editingRole.id, roleData);
        showSnackbar(t('rbac.roleUpdatedSuccess'), 'success');
      } else {
        await roleApi.createRole(roleData);
        showSnackbar(t('rbac.roleCreatedSuccess'), 'success');
      }

      setDialogOpen(false);
      loadRoles();
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const translateRoleName = (roleName: string): string => {
    const translationKey = `rbac.roleNames.${roleName}`;
    const translated = t(translationKey);
    return translated === translationKey ? roleName : translated;
  };

  // 过滤角色
  const filteredRoles = roles.filter(
    role =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* 搜索和创建区域 - 匹配User Management风格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              fullWidth
              placeholder={t('rbac.searchRoles')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
                    borderColor: '#6366F1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366F1',
                  },
                },
              }}
            />
            {hasPermission('rbac:create_role') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  px: 3,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                  },
                }}
              >
                {t('rbac.createRole')}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 角色列表 - 匹配User Management风格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : filteredRoles.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <RoleIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
              <Typography color="text.secondary">
                {searchTerm ? t('rbac.noSearchResults') : t('rbac.noRoles')}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                      {t('rbac.roleName')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.roleCode')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.displayName')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.description')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.level')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.isSystem')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.status')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow
                      key={role.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#6366F1', 0.04),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {translateRoleName(role.roleName)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.roleCode}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#6366F1', 0.1),
                            color: '#6366F1',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {role.displayName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {role.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={role.level}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Chip
                            label={t('rbac.systemRole')}
                            size="small"
                            sx={{
                              backgroundColor: alpha('#8B5CF6', 0.1),
                              color: '#8B5CF6',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        ) : (
                          <Chip
                            label={t('rbac.customRole')}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 24 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {role.status === 'ACTIVE' ? (
                          <Chip
                            label={t('rbac.active')}
                            size="small"
                            sx={{
                              backgroundColor: alpha('#10B981', 0.1),
                              color: '#10B981',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        ) : (
                          <Chip
                            label={t('rbac.inactive')}
                            size="small"
                            sx={{
                              backgroundColor: alpha('#EF4444', 0.1),
                              color: '#EF4444',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          {hasPermission('rbac:update_role') && (
                            <Tooltip title={t('common.update')}>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(role)}
                                sx={{
                                  color: '#6366F1',
                                  '&:hover': { backgroundColor: alpha('#6366F1', 0.1) },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {hasPermission('rbac:delete_role') && !role.isSystem && (
                            <Tooltip title={t('common.delete')}>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(role)}
                                sx={{
                                  color: '#EF4444',
                                  '&:hover': { backgroundColor: alpha('#EF4444', 0.1) },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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

      {/* 创建/编辑对话框 - 现代化风格 */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            bgcolor: 'background.paper',
          },
        }}
      >
        {/* 现代化对话框标题 */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${alpha('#6366F1', 0.08)}, ${alpha('#8B5CF6', 0.08)})`,
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
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <SecurityIcon sx={{ fontSize: 24 }} />
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
                  {editingRole ? t('rbac.editRole') : t('rbac.createRole')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingRole ? t('rbac.editRoleSubtitle') : t('rbac.createRoleSubtitle')}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              sx={{
                '&:hover': {
                  backgroundColor: alpha('#6366F1', 0.1),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* 基本信息 */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid',
                borderColor: alpha('#6366F1', 0.2),
                borderRadius: 2,
                background: alpha('#6366F1', 0.02),
              }}
            >
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#6366F1' }}>
                  {t('rbac.basicInfo')}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('rbac.roleName')}
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <RoleIcon sx={{ color: '#6366F1' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('rbac.roleCode')}
                    value={formData.roleCode}
                    onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                    required
                    disabled={!!editingRole}
                    helperText={t('rbac.roleCodeHelper')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CodeIcon sx={{ color: editingRole ? 'text.disabled' : '#6366F1' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: editingRole ? undefined : '#6366F1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: editingRole ? undefined : '#6366F1',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('rbac.displayName')}
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon sx={{ color: '#6366F1' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('rbac.level')}
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                    helperText={t('rbac.levelHelper')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LevelIcon sx={{ color: '#6366F1' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('rbac.description')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: alpha('#6366F1', 0.02),
          }}
        >
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
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
            disabled={saving || !formData.roleName || !formData.roleCode}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: `0 4px 15px ${alpha('#6366F1', 0.3)}`,
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: `0 6px 20px ${alpha('#6366F1', 0.4)}`,
              },
            }}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              editingRole ? t('common.update') : t('common.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, color: '#EF4444' }}>
          {t('common.confirm')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('rbac.confirmDeleteRole', { name: deletingRole?.roleName })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              boxShadow: `0 4px 15px ${alpha('#EF4444', 0.3)}`,
              '&:hover': {
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                boxShadow: `0 6px 20px ${alpha('#EF4444', 0.4)}`,
              },
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;
