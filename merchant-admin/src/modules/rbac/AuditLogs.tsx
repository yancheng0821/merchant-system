import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Block as DeniedIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

interface AuditLog {
  id: number;
  userId: number;
  username?: string;
  tenantId: number;
  resource: string;
  action: string;
  resourceId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  status: 'success' | 'failed' | 'denied';
  errorMessage?: string;
  createdAt: string;
}

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const oldValueScrollRef = React.useRef<HTMLDivElement>(null);
  const newValueScrollRef = React.useRef<HTMLDivElement>(null);

  const loadAuditLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        tenantId: user?.tenantId?.toString() || '1',
      });

      if (resourceFilter !== 'all') {
        params.append('resource', resourceFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // Get user-friendly error messages
        let errorMessage = t('errors.unexpectedError');

        if (response.status === 503) {
          errorMessage = t('errors.serviceUnavailable');
        } else if (response.status === 500) {
          errorMessage = t('errors.serverError');
        } else if (response.status === 404) {
          errorMessage = t('errors.notFound');
        } else if (response.status === 403) {
          errorMessage = t('errors.forbidden');
        } else if (response.status === 401) {
          errorMessage = t('errors.unauthorized');
        }

        console.error('Error loading audit logs:', errorMessage);
        setError(errorMessage);
        setLogs([]);
        setTotalCount(0);
        return;
      }

      const data = await response.json();
      setLogs(data.content || []);
      setTotalCount(data.totalElements || 0);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      // Network errors
      let errorMessage = t('errors.unexpectedError');
      if (err.message === 'Failed to fetch' || err.message.includes('Network')) {
        errorMessage = t('errors.networkError');
      }
      setError(errorMessage);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, resourceFilter, statusFilter, actionFilter, searchTerm, startDate, endDate, user?.tenantId, t]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    loadAuditLogs();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        tenantId: user?.tenantId?.toString() || '1',
      });

      if (resourceFilter !== 'all') {
        params.append('resource', resourceFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/audit-logs/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
    }
  };

  const getStatusChip = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'unknown';

    const config = {
      success: {
        icon: <SuccessIcon sx={{ fontSize: 16 }} />,
        color: '#10B981',
        bg: alpha('#10B981', 0.1),
        label: t('audit.status.success'),
      },
      failed: {
        icon: <ErrorIcon sx={{ fontSize: 16 }} />,
        color: '#EF4444',
        bg: alpha('#EF4444', 0.1),
        label: t('audit.status.failed'),
      },
      denied: {
        icon: <DeniedIcon sx={{ fontSize: 16 }} />,
        color: '#F59E0B',
        bg: alpha('#F59E0B', 0.1),
        label: t('audit.status.denied'),
      },
    }[normalizedStatus] || {
      icon: undefined,
      color: '#10B981',
      bg: alpha('#10B981', 0.1),
      label: normalizedStatus,
    };

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': { px: 1.5 },
          '& .MuiChip-icon': { color: config.color, ml: 0.5 },
        }}
      />
    );
  };

  const getActionLabel = (action: string): string => {
    const actionMap: Record<string, string> = {
      CREATE: t('audit.action.create'),
      UPDATE: t('audit.action.update'),
      UPDATE_STATUS: t('audit.action.updateStatus'),
      DELETE: t('audit.action.delete'),
      ASSIGN_ROLES: t('audit.action.assignRoles'),
      ASSIGN_PERMISSIONS: t('audit.action.assignPermissions'),
      PURCHASE: t('audit.action.purchase'),
      PAYMENT: t('audit.action.payment'),
      REFUND: t('audit.action.refund'),
      CANCEL: t('audit.action.cancel'),
      RETRY: t('audit.action.retry'),
      INIT: t('audit.action.init'),
      LOGIN: t('audit.action.login'),
      LOGOUT: t('audit.action.logout'),
      BATCH_CREATE: t('audit.action.batchCreate'),
    };
    return actionMap[action] || action;
  };

  const getResourceLabel = (resource: string): string => {
    const resourceMap: Record<string, string> = {
      // RBAC Resources
      USER: t('audit.resource.user'),
      USER_ROLE: t('audit.resource.userRole'),
      // Business Resources
      CUSTOMER: t('audit.resource.customer'),
      CUSTOMER_PACKAGE: t('audit.resource.customerPackage'),
      APPOINTMENT: t('audit.resource.appointment'),
      SERVICE: t('audit.resource.service'),
      SERVICE_PACKAGE: t('audit.resource.servicePackage'),
      SERVICE_CATEGORY: t('audit.resource.serviceCategory'),
      RESOURCE: t('audit.resource.resource'),
      RESOURCE_SCHEDULE: t('audit.resource.resourceSchedule'),
      // Notification Resources
      NOTIFICATION_TEMPLATE: t('audit.resource.notificationTemplate'),
      NOTIFICATION_LOG: t('audit.resource.notificationLog'),
      // Merchant Resources
      MERCHANT: t('audit.resource.merchant'),
      MERCHANT_CONFIG_ITEM: t('audit.resource.merchantConfigItem'),
    };
    return resourceMap[resource] || resource;
  };

  const getResourceColor = (resource: string): { bg: string; color: string } => {
    const normalizedResource = resource.toUpperCase();

    // Customer-related resources - Pink
    if (normalizedResource.includes('CUSTOMER')) {
      return { bg: alpha('#DB2777', 0.1), color: '#DB2777' };
    }

    // Appointment and scheduling resources - Purple
    if (normalizedResource.includes('APPOINTMENT') || normalizedResource.includes('SHIFT') || normalizedResource.includes('SCHEDULE')) {
      return { bg: alpha('#7C3AED', 0.1), color: '#7C3AED' };
    }

    // Order and payment resources - Green
    if (normalizedResource.includes('ORDER') || normalizedResource.includes('PAYMENT')) {
      return { bg: alpha('#059669', 0.1), color: '#059669' };
    }

    // Staff/Room resources - Blue
    if (normalizedResource === 'RESOURCE') {
      return { bg: alpha('#2563EB', 0.1), color: '#2563EB' };
    }

    // Service and package resources - Cyan
    if (normalizedResource.includes('SERVICE') || normalizedResource.includes('PACKAGE')) {
      return { bg: alpha('#0891B2', 0.1), color: '#0891B2' };
    }

    // Notification resources - Orange
    if (normalizedResource.includes('NOTIFICATION')) {
      return { bg: alpha('#F97316', 0.1), color: '#F97316' };
    }

    // Merchant/Settings resources - Teal
    if (normalizedResource.includes('MERCHANT')) {
      return { bg: alpha('#14B8A6', 0.1), color: '#14B8A6' };
    }

    // RBAC resources (users, roles, permissions) - Indigo
    if (normalizedResource.includes('USER') || normalizedResource.includes('ROLE') || normalizedResource.includes('PERMISSION')) {
      return { bg: alpha('#6366F1', 0.1), color: '#6366F1' };
    }

    // Default - Blue
    return { bg: alpha('#3B82F6', 0.1), color: '#3B82F6' };
  };

  const formatDate = (dateString: string): string => {
    // AuditLog 的 createdAt 是 UTC 时间，需要转换为商户时区
    return formatUtcToMerchantTime(dateString, 'yyyy-MM-dd HH:mm:ss');
  };

  const handleViewChanges = (log: AuditLog) => {
    setSelectedLog(log);
    setChangeDialogOpen(true);
  };

  // 同步左右两侧的滚动
  const handleScroll = (source: 'old' | 'new') => (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    if (source === 'old' && newValueScrollRef.current) {
      newValueScrollRef.current.scrollTop = scrollTop;
    } else if (source === 'new' && oldValueScrollRef.current) {
      oldValueScrollRef.current.scrollTop = scrollTop;
    }
  };

  // 智能格式化复杂数据类型
  const formatComplexData = (data: any, resource: string): any => {
    if (!data) return null;

    // 处理RESOURCE_SCHEDULE - 周排班数据
    if (resource === 'RESOURCE_SCHEDULE' && data.weekDays) {
      const formatted: any = {
        resourceId: data.resourceId,
        resourceName: data.resourceName,
      };

      // 只显示有排班的天
      data.weekDays.forEach((day: any) => {
        if (day.segments && day.segments.length > 0) {
          const timeSlots = day.segments
            .map((seg: any) => `${seg.startTime}-${seg.endTime}`)
            .join(', ');
          formatted[`${day.dayName} (${t('schedule.day' + day.dayOfWeek)})`] = timeSlots;
        }
      });

      return formatted;
    }

    // 处理包含weekDays的数据（可能没有明确的resource类型）
    if (data.weekDays && Array.isArray(data.weekDays)) {
      const formatted: any = {};
      if (data.resourceId) formatted.resourceId = data.resourceId;
      if (data.resourceName) formatted.resourceName = data.resourceName;

      data.weekDays.forEach((day: any) => {
        if (day.segments && day.segments.length > 0) {
          const timeSlots = day.segments
            .map((seg: any) => `${seg.startTime}-${seg.endTime}`)
            .join(', ');
          formatted[`${day.dayName}`] = timeSlots;
        } else {
          formatted[`${day.dayName}`] = t('schedule.noSchedule') || 'No schedule';
        }
      });

      return formatted;
    }

    return data;
  };

  const renderChanges = (log: AuditLog) => {
    if (!log.oldValue && !log.newValue) {
      return (
        <Typography color="text.secondary" variant="body2">
          {t('audit.noChanges')}
        </Typography>
      );
    }

    try {
      let oldData = log.oldValue ? JSON.parse(log.oldValue) : null;
      let newData = log.newValue ? JSON.parse(log.newValue) : null;

      // 智能格式化复杂数据
      oldData = formatComplexData(oldData, log.resource);
      newData = formatComplexData(newData, log.resource);

      // 找出变更的字段（后端已经只返回核心字段）
      const changedFields = new Set<string>();
      const allKeys = new Set([
        ...Object.keys(oldData || {}),
        ...Object.keys(newData || {})
      ]);

      allKeys.forEach(key => {
        if (JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key])) {
          changedFields.add(key);
        }
      });

      return (
        <Box>
          {/* 高亮显示变更字段 */}
          {changedFields.size > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t('audit.changedFields')}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {Array.from(changedFields).map(field => (
                  <Chip
                    key={field}
                    label={field}
                    size="small"
                    sx={{
                      backgroundColor: alpha('#F59E0B', 0.1),
                      color: '#F59E0B',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* 左右对比视图 - 同步滚动 */}
          <Grid container spacing={2}>
            {oldData && (
              <Grid item xs={12} md={newData ? 6 : 12}>
                <Box
                  sx={{
                    border: '2px solid',
                    borderColor: alpha('#EF4444', 0.3),
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: alpha('#EF4444', 0.1),
                      borderBottom: '1px solid',
                      borderColor: alpha('#EF4444', 0.2),
                      px: 1.5,
                      py: 0.75,
                    }}
                  >
                    <Typography variant="subtitle2" color="error.main" fontWeight={600} fontSize="0.875rem">
                      {t('audit.oldValue')}
                    </Typography>
                  </Box>
                  <Box
                    ref={oldValueScrollRef}
                    onScroll={handleScroll('old')}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      px: 1.5,
                      py: 1,
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    {Object.entries(oldData).map(([key, value]) => {
                      const isChanged = changedFields.has(key);
                      return (
                        <Box
                          key={key}
                          sx={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 1,
                            py: 0.5,
                            px: 0.75,
                            borderRadius: 0.5,
                            backgroundColor: isChanged ? alpha('#EF4444', 0.08) : 'transparent',
                            borderLeft: isChanged ? `3px solid ${alpha('#EF4444', 0.5)}` : 'none',
                            pl: isChanged ? 1 : 0.75,
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 600,
                              color: isChanged ? '#EF4444' : 'text.secondary',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              minWidth: 'fit-content',
                            }}
                          >
                            {key}:
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: isChanged ? '#DC2626' : 'text.primary',
                              wordBreak: 'break-word',
                              flex: 1,
                            }}
                          >
                            {typeof value === 'object' && value !== null
                              ? JSON.stringify(value)
                              : String(value)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
            )}
            {newData && (
              <Grid item xs={12} md={oldData ? 6 : 12}>
                <Box
                  sx={{
                    border: '2px solid',
                    borderColor: alpha('#10B981', 0.3),
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: alpha('#10B981', 0.1),
                      borderBottom: '1px solid',
                      borderColor: alpha('#10B981', 0.2),
                      px: 1.5,
                      py: 0.75,
                    }}
                  >
                    <Typography variant="subtitle2" color="success.main" fontWeight={600} fontSize="0.875rem">
                      {t('audit.newValue')}
                    </Typography>
                  </Box>
                  <Box
                    ref={newValueScrollRef}
                    onScroll={handleScroll('new')}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      px: 1.5,
                      py: 1,
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    {Object.entries(newData).map(([key, value]) => {
                      const isChanged = changedFields.has(key);
                      return (
                        <Box
                          key={key}
                          sx={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 1,
                            py: 0.5,
                            px: 0.75,
                            borderRadius: 0.5,
                            backgroundColor: isChanged ? alpha('#10B981', 0.08) : 'transparent',
                            borderLeft: isChanged ? `3px solid ${alpha('#10B981', 0.5)}` : 'none',
                            pl: isChanged ? 1 : 0.75,
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 600,
                              color: isChanged ? '#10B981' : 'text.secondary',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              minWidth: 'fit-content',
                            }}
                          >
                            {key}:
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: isChanged ? '#059669' : 'text.primary',
                              wordBreak: 'break-word',
                              flex: 1,
                            }}
                          >
                            {typeof value === 'object' && value !== null
                              ? JSON.stringify(value)
                              : String(value)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      );
    } catch (e) {
      return (
        <Box>
          {log.oldValue && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="error.main" gutterBottom>
                {t('audit.oldValue')}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {log.oldValue}
              </Typography>
            </Box>
          )}
          {log.newValue && (
            <Box>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                {t('audit.newValue')}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {log.newValue}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Filter Bar */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder={t('audit.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label={t('audit.startDate') || 'Start Date'}
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366F1',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366F1',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#6366F1',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label={t('audit.endDate') || 'End Date'}
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  minDate={startDate || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366F1',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366F1',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#6366F1',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    '&.Mui-focused': {
                      color: '#6366F1',
                    },
                  }}
                >
                  {t('audit.resourceLabel')}
                </InputLabel>
                <Select
                  value={resourceFilter}
                  label={t('audit.resourceLabel')}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                  }}
                >
                  <MenuItem value="all">{t('audit.all')}</MenuItem>
                  {/* RBAC Resources */}
                  <MenuItem value="USER">{t('audit.resource.user')}</MenuItem>
                  <MenuItem value="USER_ROLE">{t('audit.resource.userRole')}</MenuItem>
                  {/* Business Resources */}
                  <MenuItem value="CUSTOMER">{t('audit.resource.customer')}</MenuItem>
                  <MenuItem value="CUSTOMER_PACKAGE">{t('audit.resource.customerPackage')}</MenuItem>
                  <MenuItem value="APPOINTMENT">{t('audit.resource.appointment')}</MenuItem>
                  <MenuItem value="SERVICE">{t('audit.resource.service')}</MenuItem>
                  <MenuItem value="SERVICE_PACKAGE">{t('audit.resource.servicePackage')}</MenuItem>
                  <MenuItem value="SERVICE_CATEGORY">{t('audit.resource.serviceCategory')}</MenuItem>
                  <MenuItem value="RESOURCE">{t('audit.resource.resource')}</MenuItem>
                  <MenuItem value="RESOURCE_SCHEDULE">{t('audit.resource.resourceSchedule')}</MenuItem>
                  {/* Notification Resources */}
                  <MenuItem value="NOTIFICATION_TEMPLATE">{t('audit.resource.notificationTemplate')}</MenuItem>
                  <MenuItem value="NOTIFICATION_LOG">{t('audit.resource.notificationLog')}</MenuItem>
                  {/* Merchant Resources */}
                  <MenuItem value="MERCHANT">{t('audit.resource.merchant')}</MenuItem>
                  <MenuItem value="MERCHANT_CONFIG_ITEM">{t('audit.resource.merchantConfigItem')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    '&.Mui-focused': {
                      color: '#6366F1',
                    },
                  }}
                >
                  {t('audit.actionLabel')}
                </InputLabel>
                <Select
                  value={actionFilter}
                  label={t('audit.actionLabel')}
                  onChange={(e) => setActionFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                  }}
                >
                  <MenuItem value="all">{t('audit.all')}</MenuItem>
                  <MenuItem value="CREATE">{t('audit.action.create')}</MenuItem>
                  <MenuItem value="UPDATE">{t('audit.action.update')}</MenuItem>
                  <MenuItem value="UPDATE_STATUS">{t('audit.action.updateStatus')}</MenuItem>
                  <MenuItem value="DELETE">{t('audit.action.delete')}</MenuItem>
                  <MenuItem value="ASSIGN_ROLES">{t('audit.action.assignRoles')}</MenuItem>
                  <MenuItem value="ASSIGN_PERMISSIONS">{t('audit.action.assignPermissions')}</MenuItem>
                  <MenuItem value="PURCHASE">{t('audit.action.purchase')}</MenuItem>
                  <MenuItem value="PAYMENT">{t('audit.action.payment')}</MenuItem>
                  <MenuItem value="REFUND">{t('audit.action.refund')}</MenuItem>
                  <MenuItem value="CANCEL">{t('audit.action.cancel')}</MenuItem>
                  <MenuItem value="RETRY">{t('audit.action.retry')}</MenuItem>
                  <MenuItem value="INIT">{t('audit.action.init')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    '&.Mui-focused': {
                      color: '#6366F1',
                    },
                  }}
                >
                  {t('audit.statusLabel')}
                </InputLabel>
                <Select
                  value={statusFilter}
                  label={t('audit.statusLabel')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366F1',
                    },
                  }}
                >
                  <MenuItem value="all">{t('audit.all')}</MenuItem>
                  <MenuItem value="success">{t('audit.status.success')}</MenuItem>
                  <MenuItem value="failed">{t('audit.status.failed')}</MenuItem>
                  <MenuItem value="denied">{t('audit.status.denied')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={3}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Tooltip title={t('audit.refresh')}>
                  <IconButton
                    onClick={loadAuditLogs}
                    sx={{
                      backgroundColor: alpha('#6366F1', 0.1),
                      '&:hover': { backgroundColor: alpha('#6366F1', 0.2) },
                    }}
                  >
                    <RefreshIcon sx={{ color: '#6366F1' }} />
                  </IconButton>
                </Tooltip>
                {/* Temporarily disabled export functionality */}
                {/* <Tooltip title={t('audit.export')}>
                  <IconButton
                    onClick={handleExport}
                    sx={{
                      backgroundColor: alpha('#10B981', 0.1),
                      '&:hover': { backgroundColor: alpha('#10B981', 0.2) },
                    }}
                  >
                    <DownloadIcon sx={{ color: '#10B981' }} />
                  </IconButton>
                </Tooltip> */}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          {error && (
            <Box p={3}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
                action={
                  <Tooltip title={t('audit.refresh')}>
                    <IconButton
                      onClick={loadAuditLogs}
                      size="small"
                      sx={{ color: 'error.main' }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    {t('audit.loadError')}
                  </Typography>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                </Box>
              </Alert>
            </Box>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : logs.length === 0 && !error ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <FilterIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
              <Typography color="text.secondary">{t('audit.noLogs')}</Typography>
            </Box>
          ) : logs.length > 0 && !error ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                        {t('audit.dateTime')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.user')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.resourceLabel')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.actionLabel')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.resourceId')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.statusLabel')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.changes')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {t('audit.ipAddress')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        sx={{
                          '&:hover': { backgroundColor: alpha('#6366F1', 0.04) },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.813rem' }}>
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {log.username || `User #${log.userId}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {log.userId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const colors = getResourceColor(log.resource);
                            return (
                              <Chip
                                label={getResourceLabel(log.resource)}
                                size="small"
                                sx={{
                                  backgroundColor: colors.bg,
                                  color: colors.color,
                                  fontWeight: 500,
                                }}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {getActionLabel(log.action)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: log.resourceId ? 'monospace' : 'inherit',
                              color: log.resourceId ? 'text.primary' : 'text.secondary',
                              fontWeight: log.resourceId ? 500 : 400
                            }}
                          >
                            {log.resourceId ? `#${log.resourceId}` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(log.status)}</TableCell>
                        <TableCell>
                          {(log.oldValue || log.newValue) ? (
                            <Tooltip title={t('audit.viewChanges')}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewChanges(log)}
                                sx={{
                                  color: '#6366F1',
                                  '&:hover': {
                                    backgroundColor: alpha('#6366F1', 0.1),
                                  },
                                }}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.813rem' }}>
                            {log.ipAddress || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage={t('audit.rowsPerPage')}
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTablePagination-select': {
                    borderRadius: 1,
                  },
                }}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Change Comparison Dialog */}
      <Dialog
        open={changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon sx={{ color: '#6366F1' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('audit.changeHistory')}
            </Typography>
          </Box>
          {selectedLog && (
            <Box mt={1}>
              <Typography variant="body2" color="text.secondary">
                {getResourceLabel(selectedLog.resource)} - {getActionLabel(selectedLog.action)}
                {selectedLog.resourceId && ` #${selectedLog.resourceId}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(selectedLog.createdAt)} • {selectedLog.username || `User #${selectedLog.userId}`}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedLog && renderChanges(selectedLog)}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button
            onClick={() => setChangeDialogOpen(false)}
            sx={{
              color: '#6366F1',
              '&:hover': {
                backgroundColor: alpha('#6366F1', 0.1),
              },
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;
