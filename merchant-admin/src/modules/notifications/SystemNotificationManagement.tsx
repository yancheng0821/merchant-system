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
  Card,
  CardContent,
  alpha,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#F97316';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#EA6A0A';
  const THEME_COLOR_LIGHT = isMonochrome ? '#666' : '#FB923C';

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
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('notifications.systemNotifications')}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 1.5,
              px: 2,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8125rem',
              bgcolor: THEME_COLOR,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: THEME_COLOR_DARK,
                boxShadow: 'none',
              },
            }}
          >
            {t('common.create')}
          </Button>
        </Box>
      </Paper>

      {/* 表格/卡片列表 */}
      {isMobile ? (
        /* 移动端卡片列表 */
        <Box>
          {notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {t('notifications.noSystemNotifications')}
              </Typography>
            </Box>
          ) : (
            <>
              {notifications
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((notification) => {
                  const localizedText = getLocalizedText(notification);
                  return (
                    <Card
                      key={notification.id}
                      sx={{
                        mb: 1.5,
                        borderRadius: 1.5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        {/* 第一行：标题 + 级别 */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography sx={{ fontSize: '0.8rem', color: '#1a1a1a', fontWeight: 500, flex: 1 }} noWrap>
                            {localizedText.title}
                          </Typography>
                          <Chip
                            label={levelOptions.find(opt => opt.value === notification.level)?.label}
                            size="small"
                            sx={{
                              backgroundColor: alpha(getLevelColor(notification.level), 0.1),
                              color: getLevelColor(notification.level),
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 20,
                              ml: 1,
                            }}
                          />
                        </Box>
                        {/* 第二行：内容预览 */}
                        <Typography sx={{ fontSize: '0.7rem', color: '#666', mb: 1 }} noWrap>
                          {localizedText.content}
                        </Typography>
                        {/* 第三行：时间 + 操作按钮 */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                            {notification.createdAt
                              ? formatUtcToMerchantTime(notification.createdAt, 'yyyy-MM-dd HH:mm')
                              : '-'}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(notification)}
                              sx={{ color: THEME_COLOR, p: 0.5 }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(notification)}
                              sx={{ color: '#EF4444', p: 0.5, ml: 0.5 }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

              {/* 移动端简化分页 */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: '#fff',
                  borderRadius: 1.5,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, notifications.length)} / {notifications.length}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem', color: '#666', borderRadius: 1 }}
                  >
                    {t('common.previousPage')}
                  </Button>
                  <Button
                    size="small"
                    disabled={(page + 1) * rowsPerPage >= notifications.length}
                    onClick={() => setPage(page + 1)}
                    sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem', color: THEME_COLOR, borderRadius: 1 }}
                  >
                    {t('common.nextPage')}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      ) : (
        /* 桌面端表格 */
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>{t('notifications.title')}</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>{t('notifications.content')}</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>{t('notifications.level')}</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>{t('notifications.createdAt')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>
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
                          sx={{ color: THEME_COLOR }}
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
            labelRowsPerPage={t('common.rowsPerPage')}
            sx={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              backgroundColor: '#fafafa',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.8125rem',
                color: '#666',
              },
            }}
          />
        </TableContainer>
      )}

      {/* 创建/编辑对话框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 2 : 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
            m: isMobile ? 2 : 3,
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {editingNotification
              ? t('notifications.editSystemNotification')
              : t('notifications.createSystemNotification')}
          </Typography>
        </Box>
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
                  borderRadius: 1.5,
                  '&:hover fieldset': {
                    borderColor: THEME_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME_COLOR,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: THEME_COLOR,
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
                  borderRadius: 1.5,
                  '&:hover fieldset': {
                    borderColor: THEME_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME_COLOR,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: THEME_COLOR,
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
                  borderRadius: 1.5,
                  '&:hover fieldset': {
                    borderColor: THEME_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME_COLOR,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: THEME_COLOR,
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
                  borderRadius: 1.5,
                  '&:hover fieldset': {
                    borderColor: THEME_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME_COLOR,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: THEME_COLOR,
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
                  borderRadius: 1.5,
                  '&:hover fieldset': {
                    borderColor: THEME_COLOR,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME_COLOR,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: THEME_COLOR,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            onClick={handleCloseDialog}
            disabled={loading}
            size="small"
            sx={{
              borderRadius: 1.5,
              px: 2,
              color: '#666',
              textTransform: 'none',
              fontSize: '0.8125rem',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={loading}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8125rem',
              bgcolor: THEME_COLOR,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: THEME_COLOR_DARK,
                boxShadow: 'none',
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
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            mx: isMobile ? 2 : 0,
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('common.confirmDelete')}
          </Typography>
        </Box>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.deleteConfirmMessage', {
              title: notificationToDelete?.titleEn || notificationToDelete?.title
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            onClick={handleCloseDeleteDialog}
            size="small"
            sx={{ color: '#666', borderRadius: 1.5, textTransform: 'none', fontSize: '0.8125rem' }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            size="small"
            disabled={loading}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.8125rem',
              bgcolor: '#EF4444',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#DC2626',
                boxShadow: 'none',
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
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
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
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemNotificationManagement;
