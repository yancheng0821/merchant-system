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
  Pagination,
  Grid,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Sms as SmsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '../../services/api';

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
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    templateCode: '',
    type: '',
    status: '',
    recipient: '',
    businessId: ''
  });

  // 紫色主题色
  const themeColor = '#A855F7';

  const templateCodes = [
    { value: 'APPOINTMENT_CONFIRMED', label: t('notifications.templateCodes.appointmentConfirmed') },
    { value: 'APPOINTMENT_CANCELLED', label: t('notifications.templateCodes.appointmentCancelled') },
    { value: 'APPOINTMENT_COMPLETED', label: t('notifications.templateCodes.appointmentCompleted') },
    { value: 'APPOINTMENT_REMINDER', label: t('notifications.templateCodes.appointmentReminder') }
  ];

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const tenantId = 4; // 使用租户4的测试数据
      const params = {
        tenantId,
        page: page - 1,
        size: 20,
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
      
      setLogs(sortedLogs);
      // 由于后端返回的是数组，暂时使用简单的分页计算
      setTotalPages(Math.ceil(sortedLogs.length / 20));
      setError(null);
    } catch (err) {
      setError(t('notifications.fetchTemplatesFailed'));
      console.error('Error fetching notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = (log: NotificationLog) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleRetryFailed = async () => {
    try {
      await notificationApi.retryFailedNotifications();
      await fetchLogs();
    } catch (err) {
      setError(t('notifications.retryFailedNotifications'));
      console.error('Error retrying failed notifications:', err);
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
                  mr: 2,
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
              <Button
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
              </Button>
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
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('notifications.templateType')}</InputLabel>
                <Select
                  value={filters.templateCode}
                  onChange={(e) => handleFilterChange('templateCode', e.target.value)}
                  label={t('notifications.templateType')}
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
                  {templateCodes.map((code) => (
                    <MenuItem key={code.value} value={code.value}>
                      {code.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
            <Grid item xs={12} sm={6} md={2}>
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
                  background: `linear-gradient(135deg, ${themeColor}, #7C3AED)`,
                  boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
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
                  {t('notifications.templateType')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.notificationType')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.recipient')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.status')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.businessId')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('notifications.retryCount')}
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
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {t('notifications.noLogs')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
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
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getTemplateLabel(log.templateCode)}
                      </Typography>
                    </TableCell>
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
                        {log.businessId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.retryCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(log.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewLog(log)}
                        sx={{
                          color: themeColor,
                          '&:hover': {
                            backgroundColor: alpha(themeColor, 0.1),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ViewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box 
          display="flex" 
          justifyContent="center" 
          sx={{ 
            p: 3, 
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#f8fafc',
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_event, value) => setPage(value)}
            sx={{
              '& .MuiPaginationItem-root': {
                '&.Mui-selected': {
                  backgroundColor: themeColor,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: `${themeColor}dd`,
                  }
                }
              }
            }}
          />
        </Box>
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
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${themeColor}20`,
          color: themeColor,
          fontWeight: 600
        }}>
          {t('notifications.notificationDetails')}
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">{t('notifications.templateType')}:</Typography>
                  <Typography>{getTemplateLabel(selectedLog.templateCode)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">{t('notifications.notificationType')}:</Typography>
                  <Typography>{getTypeLabel(selectedLog.type)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">{t('notifications.recipient')}:</Typography>
                  <Typography>{selectedLog.recipient}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">{t('notifications.status')}:</Typography>
                  <Chip
                    label={getStatusLabel(selectedLog.status)}
                    color={getStatusColor(selectedLog.status) as any}
                    size="small"
                  />
                </Grid>
                {selectedLog.subject && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">{t('notifications.subject')}:</Typography>
                    <Typography>{selectedLog.subject}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2">{t('notifications.content')}:</Typography>
                  <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography
                      component="pre"
                      sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}
                    >
                      {selectedLog.content}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedLog.errorMessage && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error">{t('notifications.errorMessage')}:</Typography>
                    <Typography color="error">{selectedLog.errorMessage}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="subtitle2">{t('notifications.createdAt')}:</Typography>
                  <Typography>{new Date(selectedLog.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">{t('notifications.sentAt')}:</Typography>
                  <Typography>
                    {selectedLog.sentAt ? new Date(selectedLog.sentAt).toLocaleString() : t('notifications.notSent')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColor}20` }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ color: 'text.secondary' }}
          >
            {t('notifications.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationLogManagement;