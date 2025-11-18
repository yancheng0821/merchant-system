import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TablePagination,
  Grid,
  Divider,
  alpha,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Snackbar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Replay as RetryIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';

interface NotificationLog {
  id: number;
  tenantId: number;
  templateCode: string;
  type: 'SMS' | 'EMAIL';
  recipient: string;
  subject?: string;
  content: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  businessId: string;
  businessType: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  sentAt?: string;
}

const NotificationLogManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState({
    templateCode: '',
    type: '',
    status: '',
    recipient: '',
    businessId: '',
    businessType: ''
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 橙色主题色，确保文字清晰
  const themeColor = '#F97316';

  // 获取租户ID
  const tenantId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(user.tenantId || 1);
  }, []);

  const templateCodes = [
    { value: 'APPOINTMENT_CONFIRMED', label: t('notifications.templateCodes.appointmentConfirmed') },
    { value: 'APPOINTMENT_CANCELLED', label: t('notifications.templateCodes.appointmentCancelled') },
    { value: 'APPOINTMENT_COMPLETED', label: t('notifications.templateCodes.appointmentCompleted') },
    { value: 'APPOINTMENT_REMINDER', label: t('notifications.templateCodes.appointmentReminder') }
  ];

  const businessTypes = [
    { value: 'APPOINTMENT_CANCELLATION', label: t('notifications.businessTypes.APPOINTMENT_CANCELLATION', 'Appointment Cancellation') },
    { value: 'APPOINTMENT_COMPLETION', label: t('notifications.businessTypes.APPOINTMENT_COMPLETION', 'Appointment Completion') },
    { value: 'APPOINTMENT_CONFIRMATION', label: t('notifications.businessTypes.APPOINTMENT_CONFIRMATION', 'Appointment Confirmation') },
    { value: 'APPOINTMENT_REMINDER', label: t('notifications.businessTypes.APPOINTMENT_REMINDER', 'Appointment Reminder') },
    { value: 'PACKAGE_VERIFICATION', label: t('notifications.businessTypes.PACKAGE_VERIFICATION', 'Package Verification') },
    { value: 'PACKAGE_PURCHASE_SUCCESS', label: t('notifications.businessTypes.PACKAGE_PURCHASE_SUCCESS', 'Package Purchase Success') }
  ];

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      // 传递一个大的size值来获取所有数据（后端默认size=20）
      const params = {
        tenantId,
        page: 0,
        size: 10000, // 获取足够多的数据，支持客户端分页
        ...filters
      };

      const logs = await notificationApi.getLogs(params);
      const logsArray = Array.isArray(logs) ? logs : [];

      // 按创建时间降序排序，确保最新的记录显示在前面
      const sortedLogs = logsArray.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // 降序排序
      });

      // 设置所有日志数据和总数
      setLogs(sortedLogs);
      setTotalElements(sortedLogs.length);
      setError(null);
    } catch (err) {
      setError(t('notifications.fetchTemplatesFailed'));
      console.error('Error fetching notification logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, tenantId, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewLog = (log: NotificationLog) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // 延迟清空selectedLog，等待Dialog关闭动画完成
    setTimeout(() => {
      setSelectedLog(null);
    }, 200);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPage(0);
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleRetryFailed = async () => {
    try {
      await notificationApi.retryFailedNotifications();
      setSuccessMessage(t('notifications.retryFailedSuccess'));
      await fetchLogs();
    } catch (err) {
      setError(t('notifications.retryFailedNotifications'));
      console.error('Error retrying failed notifications:', err);
    }
  };

  const handleRetrySingle = async (logId: number) => {
    try {
      setLoading(true);
      await notificationApi.retrySingleNotification(logId);
      setSuccessMessage(t('notifications.retrySingleSuccess'));
      await fetchLogs();
      setError(null);
    } catch (err) {
      setError(t('notifications.retrySingleFailed', 'Failed to retry notification'));
      console.error('Error retrying single notification:', err);
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, logId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedLogId(logId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLogId(null);
  };

  const handleMenuViewDetails = () => {
    const log = logs.find(l => l.id === selectedLogId);
    if (log) {
      handleViewLog(log);
    }
    handleMenuClose();
  };

  const handleMenuRetry = () => {
    if (selectedLogId) {
      handleRetrySingle(selectedLogId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT':
        return t('notifications.sent');
      case 'FAILED':
        return t('notifications.failed');
      case 'PENDING':
        return t('notifications.pending');
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'SMS' ? t('notifications.sms') : t('notifications.email');
  };

  const getTemplateLabel = (templateCode: string) => {
    const template = templateCodes.find(t => t.value === templateCode);
    return template ? template.label : templateCode;
  };

  // 掩码处理验证码内容
  const maskVerificationCode = (content: string, templateCode: string): string => {
    // 只对 PACKAGE_VERIFICATION 类型的通知进行掩码处理
    if (templateCode !== 'PACKAGE_VERIFICATION') {
      return content;
    }

    // 使用正则表达式匹配6位连续数字并替换为掩码
    return content.replace(/\b\d{6}\b/g, '******');
  };

  // 获取业务类型标签
  const getBusinessTypeLabel = (businessType: string) => {
    const type = businessTypes.find(t => t.value === businessType);
    return type ? type.label : businessType;
  };

  if (loading && logs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: themeColor }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* 操作按钮区域 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('notifications.notificationLogs')}
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchLogs}
                sx={{
                  borderRadius: 2,
                  borderColor: themeColor,
                  color: themeColor,
                  '&:hover': {
                    borderColor: themeColor,
                    backgroundColor: alpha(themeColor, 0.08),
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('notifications.refresh')}
              </Button>
              {/* 批量重试功能已注释 - 使用单条重试按钮代替 */}
              {/* <Button
                variant="contained"
                onClick={handleRetryFailed}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #EA580C, #C2410C)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('notifications.retryFailedNotifications')}
              </Button> */}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#EF4444',
            }
          }}
        >
          {error}
        </Alert>
      )}

      {/* 现代化搜索和过滤区域 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* 第一行 */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('notifications.notificationType')}</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label={t('notifications.notificationType')}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                  }}
                >
                  <MenuItem value="">{t('notifications.all')}</MenuItem>
                  <MenuItem value="SMS">{t('notifications.sms')}</MenuItem>
                  <MenuItem value="EMAIL">{t('notifications.email')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('notifications.status')}</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={t('notifications.status')}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                  }}
                >
                  <MenuItem value="">{t('notifications.all')}</MenuItem>
                  <MenuItem value="SENT">{t('notifications.sent')}</MenuItem>
                  <MenuItem value="FAILED">{t('notifications.failed')}</MenuItem>
                  <MenuItem value="PENDING">{t('notifications.pending')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('notifications.businessType', 'Business Type')}</InputLabel>
                <Select
                  value={filters.businessType}
                  onChange={(e) => handleFilterChange('businessType', e.target.value)}
                  label={t('notifications.businessType', 'Business Type')}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                  }}
                >
                  <MenuItem value="">{t('notifications.all')}</MenuItem>
                  {businessTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label={t('notifications.recipient')}
                value={filters.recipient}
                onChange={(e) => handleFilterChange('recipient', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label={t('notifications.businessId')}
                value={filters.businessId}
                onChange={(e) => handleFilterChange('businessId', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                  boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #F97316, #FB923C)',
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('notifications.search')}
              </Button>
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
                  {t('notifications.notificationType')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.recipient')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.status')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.businessType', 'Business Type')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.businessId')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.createdAt')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.sentAt')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {t('notifications.noLogs')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                  <TableRow
                    key={log.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(themeColor, 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {log.type === 'SMS' ? (
                          <SmsIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                        ) : (
                          <EmailIcon sx={{ fontSize: 16, color: '#10B981' }} />
                        )}
                        <Typography variant="body2">
                          {getTypeLabel(log.type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.recipient}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(log.status)}
                        sx={{
                          backgroundColor: getStatusColor(log.status) === 'success'
                            ? alpha('#10B981', 0.1)
                            : getStatusColor(log.status) === 'error'
                            ? alpha('#EF4444', 0.1)
                            : alpha('#F59E0B', 0.1),
                          color: getStatusColor(log.status) === 'success'
                            ? '#10B981'
                            : getStatusColor(log.status) === 'error'
                            ? '#EF4444'
                            : '#F59E0B',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          '& .MuiChip-label': {
                            px: 2,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.businessType ? getBusinessTypeLabel(log.businessType) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.businessId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                          {formatUtcToMerchantTime(log.createdAt, 'yyyy-MM-dd')}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                          {formatUtcToMerchantTime(log.createdAt, 'HH:mm:ss')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {log.sentAt ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {formatUtcToMerchantTime(log.sentAt, 'yyyy-MM-dd')}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                            {formatUtcToMerchantTime(log.sentAt, 'HH:mm:ss')}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, log.id)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: alpha(themeColor, 0.1),
                            color: themeColor,
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              minWidth: 160,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuViewDetails}>
            <ListItemIcon>
              <ViewIcon sx={{ fontSize: 18, color: themeColor }} />
            </ListItemIcon>
            <Typography variant="body2">{t('notifications.viewDetails', 'View Details')}</Typography>
          </MenuItem>
          {hasPermission('notifications:retry') &&
           selectedLogId && logs.find(l => l.id === selectedLogId)?.status &&
           (logs.find(l => l.id === selectedLogId)!.status === 'FAILED' ||
            logs.find(l => l.id === selectedLogId)!.status === 'PENDING') && (
            <MenuItem onClick={handleMenuRetry}>
              <ListItemIcon>
                <RetryIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
              </ListItemIcon>
              <Typography variant="body2">{t('notifications.retrySingle', 'Retry Send')}</Typography>
            </MenuItem>
          )}
        </Menu>

        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#f8fafc',
          }}
        />
      </Card>

      {/* 通知详情弹窗 */}
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
        {/* 对话框标题 */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.02)})`,
            borderBottom: `2px solid ${alpha(themeColor, 0.1)}`,
            pb: 2,
            pt: 2.5,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${alpha(themeColor, 0.3)}`,
                }}
              >
                <InfoIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {t('notifications.notificationDetails')}
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseDialog}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: alpha(themeColor, 0.1),
                  color: themeColor,
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          {selectedLog && (
            <Box>
              {/* 基本信息 */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(themeColor, 0.1)}`,
                  background: alpha(themeColor, 0.02),
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: themeColor,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <InfoIcon sx={{ fontSize: 18 }} />
                  {t('notifications.basicInfo')}
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.notificationType')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {selectedLog.type === 'SMS' ? (
                          <SmsIcon sx={{ fontSize: 16, color: themeColor }} />
                        ) : (
                          <EmailIcon sx={{ fontSize: 16, color: themeColor }} />
                        )}
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {getTypeLabel(selectedLog.type)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.recipient')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon sx={{ fontSize: 16, color: themeColor }} />
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {selectedLog.recipient}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.status')}
                      </Typography>
                      <Chip
                        label={getStatusLabel(selectedLog.status)}
                        size="small"
                        sx={{
                          height: 26,
                          backgroundColor: getStatusColor(selectedLog.status) === 'success'
                            ? alpha('#10B981', 0.15)
                            : getStatusColor(selectedLog.status) === 'error'
                            ? alpha('#EF4444', 0.15)
                            : alpha('#F59E0B', 0.15),
                          color: getStatusColor(selectedLog.status) === 'success'
                            ? '#10B981'
                            : getStatusColor(selectedLog.status) === 'error'
                            ? '#EF4444'
                            : '#F59E0B',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          borderRadius: 1.5,
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.businessType', 'Business Type')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {selectedLog.businessType ? getBusinessTypeLabel(selectedLog.businessType) : '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.businessId')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {selectedLog.businessId || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.templateType')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {getTemplateLabel(selectedLog.templateCode)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* 内容信息 */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(themeColor, 0.1)}`,
                  background: alpha(themeColor, 0.02),
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: themeColor,
                    mb: 2,
                  }}
                >
                  {t('notifications.contentInfo')}
                </Typography>

                {selectedLog.subject && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {t('notifications.subject')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {selectedLog.subject}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    {t('notifications.content')}
                  </Typography>

                  {/* 如果是EMAIL类型且包含HTML，显示渲染预览 */}
                  {selectedLog.type === 'EMAIL' && selectedLog.content.includes('<') ? (
                    <Box>
                      {/* HTML 渲染预览 */}
                      <Box
                        sx={{
                          border: '1px solid',
                          borderColor: alpha(themeColor, 0.2),
                          borderRadius: 2,
                          overflow: 'hidden',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            backgroundColor: alpha(themeColor, 0.05),
                            borderBottom: '1px solid',
                            borderColor: alpha(themeColor, 0.2),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <EmailIcon sx={{ fontSize: 16, color: themeColor }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: themeColor }}>
                            {t('notifications.htmlPreview')}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: '#ffffff',
                            maxHeight: 400,
                            overflowY: 'auto',
                          }}
                          dangerouslySetInnerHTML={{ __html: maskVerificationCode(selectedLog.content, selectedLog.templateCode) }}
                        />
                      </Box>

                      {/* 原始代码（可折叠） */}
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: '#f8f9fa',
                          borderRadius: 2,
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            display: 'block',
                            mb: 1,
                          }}
                        >
                          {t('notifications.sourceCode', 'Source Code')}
                        </Typography>
                        <Typography
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'text.secondary',
                            margin: 0,
                            lineHeight: 1.4,
                            maxHeight: 200,
                            overflowY: 'auto',
                          }}
                        >
                          {maskVerificationCode(selectedLog.content, selectedLog.templateCode)}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    /* 非HTML内容，直接显示 */
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#ffffff',
                        borderRadius: 2,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <Typography
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          color: 'text.primary',
                          margin: 0,
                          lineHeight: 1.6,
                        }}
                      >
                        {maskVerificationCode(selectedLog.content, selectedLog.templateCode)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* 时间和错误信息 */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(themeColor, 0.1)}`,
                  background: alpha(themeColor, 0.02),
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: themeColor,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 18 }} />
                  {t('notifications.timeInfo')}
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.createdAt')}
                      </Typography>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {formatUtcToMerchantTime(selectedLog.createdAt, 'yyyy-MM-dd')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatUtcToMerchantTime(selectedLog.createdAt, 'HH:mm:ss')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.sentAt')}
                      </Typography>
                      {selectedLog.sentAt ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                            {formatUtcToMerchantTime(selectedLog.sentAt, 'yyyy-MM-dd')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatUtcToMerchantTime(selectedLog.sentAt, 'HH:mm:ss')}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {t('notifications.notSent')}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        {t('notifications.retryCount', 'Retry Count')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {selectedLog.retryCount || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  {selectedLog.errorMessage && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha('#EF4444', 0.08),
                          border: `1px solid ${alpha('#EF4444', 0.2)}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#EF4444',
                            fontWeight: 600,
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {t('notifications.errorMessage')}
                        </Typography>
                        <Box display="flex" alignItems="start" gap={1}>
                          <ErrorIcon sx={{ fontSize: 16, color: '#EF4444', mt: 0.2 }} />
                          <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 500 }}>
                            {selectedLog.errorMessage}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: `2px solid ${alpha(themeColor, 0.1)}`,
            background: alpha(themeColor, 0.02),
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
              boxShadow: `0 4px 12px ${alpha(themeColor, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, #EA580C, #C2410C)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 16px ${alpha(themeColor, 0.4)}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            {t('notifications.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationLogManagement;