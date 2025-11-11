import React, { useState, useEffect } from 'react';
import { businessNotificationApi, handleApiError } from '../../services/api';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';

interface SystemNotification {
  id?: number;
  notificationType: string;
  title: string;
  titleEn: string;
  titleZh: string;
  content: string;
  contentEn: string;
  contentZh: string;
  level: string;
  createdAt?: string;
  updatedAt?: string;
}

const SystemNotificationManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<SystemNotification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<SystemNotification | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<SystemNotification>({
    notificationType: 'SYSTEM_NOTIFICATION',
    title: '',
    titleEn: '',
    titleZh: '',
    content: '',
    contentEn: '',
    contentZh: '',
    level: 'INFO',
  });

  const levelOptions = [
    { value: 'INFO', label: t('notifications.levels.info'), color: '#3B82F6' },
    { value: 'WARNING', label: t('notifications.levels.warning'), color: '#F59E0B' },
    { value: 'SUCCESS', label: t('notifications.levels.success'), color: '#10B981' },
    { value: 'ERROR', label: t('notifications.levels.error'), color: '#EF4444' },
  ];

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await businessNotificationApi.getSystemNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching system notifications:', error);
      setError(t('notifications.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleOpenDialog = (notification?: SystemNotification) => {
    // 清空之前的消息
    setError(null);
    setSuccessMessage(null);

    if (notification) {
      setEditingNotification(notification);
      setFormData(notification);
    } else {
      setEditingNotification(null);
      setFormData({
        notificationType: 'SYSTEM_NOTIFICATION',
        title: '',
        titleEn: '',
        titleZh: '',
        content: '',
        contentEn: '',
        contentZh: '',
        level: 'INFO',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotification(null);
    setError(null);
    // 注意：不清空 successMessage，因为保存成功后需要显示
  };

  const handleFormChange = (field: keyof SystemNotification, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);

    // 验证必填字段
    if (!formData.titleEn || !formData.titleZh || !formData.contentEn || !formData.contentZh) {
      setError(t('notifications.requiredFieldsError'));
      return;
    }

    setLoading(true);
    try {
      const notificationData = {
        ...formData,
        title: formData.titleEn, // 默认使用英文
        content: formData.contentEn,
      };

      if (editingNotification) {
        await businessNotificationApi.updateSystemNotification(editingNotification.id!, notificationData);
      } else {
        await businessNotificationApi.createSystemNotification(notificationData);
      }

      handleCloseDialog();
      fetchNotifications();
      setSuccessMessage(editingNotification ? t('notifications.updateSuccess') : t('notifications.createSuccess'));
    } catch (error) {
      console.error('Error saving system notification:', error);
      setError(t('notifications.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (notification: SystemNotification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete?.id) return;

    setLoading(true);
    setError(null);
    try {
      await businessNotificationApi.deleteSystemNotification(notificationToDelete.id);

      setSuccessMessage(t('notifications.deleteSuccess'));
      handleCloseDeleteDialog();
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting system notification:', error);
      setError(t('notifications.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getLevelColor = (level: string) => {
    return levelOptions.find(opt => opt.value === level)?.color || '#3B82F6';
  };

  const getLocalizedText = (notification: SystemNotification) => {
    const isZh = i18n.language === 'zh' || i18n.language === 'zh-CN';
    return {
      title: isZh ? (notification.titleZh || notification.title) : (notification.titleEn || notification.title),
      content: isZh ? (notification.contentZh || notification.content) : (notification.contentEn || notification.content),
    };
  };

  return (
    <Box>
      {/* 操作栏 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569' }}>
          {t('notifications.systemNotifications')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(45deg, #F97316, #FB923C)',
            color: 'white',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #EA6A0A, #F97316)',
              boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {t('common.create')}
        </Button>
      </Box>

      {/* 表格 */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t('notifications.title')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t('notifications.content')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t('notifications.level')}</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{t('notifications.createdAt')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>
                {t('common.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((notification) => {
                const localizedText = getLocalizedText(notification);
                return (
                  <TableRow key={notification.id} hover>
                    <TableCell>{notification.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {localizedText.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {localizedText.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={levelOptions.find(opt => opt.value === notification.level)?.label}
                        size="small"
                        sx={{
                          backgroundColor: `${getLevelColor(notification.level)}15`,
                          color: getLevelColor(notification.level),
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {notification.createdAt
                        ? formatUtcToMerchantTime(notification.createdAt, 'yyyy-MM-dd HH:mm:ss')
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(notification)}
                        sx={{ color: '#3B82F6' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(notification)}
                        sx={{ color: '#EF4444', ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            {notifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('notifications.noSystemNotifications')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={notifications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* 创建/编辑对话框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#1e293b',
          pb: 2,
        }}>
          {editingNotification
            ? t('notifications.editSystemNotification')
            : t('notifications.createSystemNotification')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 级别选择 */}
            <TextField
              select
              label={t('notifications.level')}
              value={formData.level}
              onChange={(e) => handleFormChange('level', e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#F97316',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F97316',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#F97316',
                },
              }}
            >
              {levelOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: option.color,
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            {/* 英文标题 */}
            <TextField
              label={t('notifications.titleEn')}
              value={formData.titleEn}
              onChange={(e) => handleFormChange('titleEn', e.target.value)}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#F97316',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F97316',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#F97316',
                },
              }}
            />

            {/* 中文标题 */}
            <TextField
              label={t('notifications.titleZh')}
              value={formData.titleZh}
              onChange={(e) => handleFormChange('titleZh', e.target.value)}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#F97316',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F97316',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#F97316',
                },
              }}
            />

            {/* 英文内容 */}
            <TextField
              label={t('notifications.contentEn')}
              value={formData.contentEn}
              onChange={(e) => handleFormChange('contentEn', e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#F97316',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F97316',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#F97316',
                },
              }}
            />

            {/* 中文内容 */}
            <TextField
              label={t('notifications.contentZh')}
              value={formData.contentZh}
              onChange={(e) => handleFormChange('contentZh', e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#F97316',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#F97316',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#F97316',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9',
              },
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(45deg, #F97316, #FB923C)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #EA6A0A, #F97316)',
                boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
              },
            }}
          >
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, color: '#EF4444' }}>
          {t('common.confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('notifications.deleteConfirmMessage', {
              title: notificationToDelete?.titleEn || notificationToDelete?.title
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
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
            {loading ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功提示 Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* 错误提示 Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemNotificationManagement;
