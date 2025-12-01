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
  Popover,
  useMediaQuery,
  useTheme as useMuiTheme,
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
  Event as EventIcon,
} from '@mui/icons-material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';
import { auditApi, handleApiError } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#4F46E5';

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

  // Date picker popover states
  const [startDateAnchorEl, setStartDateAnchorEl] = useState<null | HTMLElement>(null);
  const [endDateAnchorEl, setEndDateAnchorEl] = useState<null | HTMLElement>(null);

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

      // Convert params to object for API call
      const queryParams: any = {
        tenantId: user?.tenantId || 1,
        page: parseInt(params.get('page') || '0'),
        size: parseInt(params.get('size') || '10'),
      };
      const resource = params.get('resource');
      const status = params.get('status');
      const action = params.get('action');
      const search = params.get('search');
      const dateFrom = params.get('startDate');
      const dateTo = params.get('endDate');
      if (resource) queryParams.resource = resource;
      if (status) queryParams.status = status;
      if (action) queryParams.action = action;
      if (search) queryParams.search = search;
      if (dateFrom) queryParams.dateFrom = dateFrom;
      if (dateTo) queryParams.dateTo = dateTo;
      if (user?.timezone) queryParams.timezone = user.timezone;

      const data = await auditApi.getAuditLogs(queryParams);
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

      // Convert params to object for API call
      const exportParams: any = {
        tenantId: user?.tenantId || 1,
      };
      const resource = params.get('resource');
      const status = params.get('status');
      const search = params.get('search');
      const action = params.get('action');
      const dateFrom = params.get('startDate');
      const dateTo = params.get('endDate');

      if (resource) exportParams.resource = resource;
      if (status) exportParams.status = status;
      if (search) exportParams.search = search;
      if (action) exportParams.action = action;
      if (dateFrom) exportParams.dateFrom = dateFrom;
      if (dateTo) exportParams.dateTo = dateTo;
      if (user?.timezone) exportParams.timezone = user.timezone;

      await auditApi.exportAuditLogs(exportParams);
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
      SEND_SUMMARY: t('audit.action.sendSummary'),
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
      MEMBERSHIP_TIER: t('audit.resource.membershipTier'),
      APPOINTMENT: t('audit.resource.appointment'),
      ORDER: t('audit.resource.order'),
      SERVICE: t('audit.resource.service'),
      SERVICE_PACKAGE: t('audit.resource.servicePackage'),
      SERVICE_CATEGORY: t('audit.resource.serviceCategory'),
      RESOURCE: t('audit.resource.resource'),
      RESOURCE_SCHEDULE: t('audit.resource.resourceSchedule'),
      STAFF_ATTENDANCE: t('audit.resource.staffAttendance'),
      // Cost Management Resources
      COST_MANAGEMENT: t('audit.resource.costManagement'),
      // Notification Resources
      NOTIFICATION_TEMPLATE: t('audit.resource.notificationTemplate'),
      NOTIFICATION_LOG: t('audit.resource.notificationLog'),
      STAFF_NOTIFICATION: t('audit.resource.staffNotification'),
      // Merchant Resources
      MERCHANT: t('audit.resource.merchant'),
      MERCHANT_CONFIG_ITEM: t('audit.resource.merchantConfigItem'),
      MERCHANT_SETTINGS: t('audit.resource.merchantSettings'),
      TENANT: t('audit.resource.tenant'),
      // Marketing Resources
      MARKETING: t('audit.resource.marketing'),
    };
    return resourceMap[resource] || resource;
  };

  const getResourceColor = (resource: string): { bg: string; color: string } => {
    // 极简模式下统一使用黑色
    if (isMonochrome) {
      return { bg: alpha('#1a1a1a', 0.1), color: '#1a1a1a' };
    }

    const normalizedResource = resource.toUpperCase();

    // Customer-related resources - Pink
    if (normalizedResource.includes('CUSTOMER') || normalizedResource.includes('MEMBERSHIP')) {
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

    // Marketing resources - Pink/Magenta
    if (normalizedResource.includes('MARKETING')) {
      return { bg: alpha('#EC4899', 0.1), color: '#EC4899' };
    }

    // Cost Management resources - Red
    if (normalizedResource.includes('COST')) {
      return { bg: alpha('#EF4444', 0.1), color: '#EF4444' };
    }

    // Merchant/Settings resources - Teal
    if (normalizedResource.includes('MERCHANT') || normalizedResource === 'TENANT') {
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
          {/* 左右对比视图 */}
          <Grid container spacing={2}>
            {oldData && (
              <Grid item xs={12} md={newData ? 6 : 12}>
                <Box
                  sx={{
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: '#fef2f2',
                      px: 2,
                      py: 1,
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#dc2626' }}>
                      {t('audit.oldValue')}
                    </Typography>
                  </Box>
                  <Box
                    ref={oldValueScrollRef}
                    onScroll={handleScroll('old')}
                    sx={{
                      backgroundColor: '#fff',
                      px: 2,
                      py: 1.5,
                      maxHeight: 320,
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
                            py: 0.5,
                            backgroundColor: isChanged ? '#fef2f2' : 'transparent',
                            borderRadius: 1,
                            px: 1,
                            mx: -1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              color: '#666',
                              fontSize: '0.8125rem',
                              minWidth: 120,
                            }}
                          >
                            {key}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.8125rem',
                              color: isChanged ? '#dc2626' : '#1a1a1a',
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
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: '#f0fdf4',
                      px: 2,
                      py: 1,
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#16a34a' }}>
                      {t('audit.newValue')}
                    </Typography>
                  </Box>
                  <Box
                    ref={newValueScrollRef}
                    onScroll={handleScroll('new')}
                    sx={{
                      backgroundColor: '#fff',
                      px: 2,
                      py: 1.5,
                      maxHeight: 320,
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
                            py: 0.5,
                            backgroundColor: isChanged ? '#f0fdf4' : 'transparent',
                            borderRadius: 1,
                            px: 1,
                            mx: -1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              color: '#666',
                              fontSize: '0.8125rem',
                              minWidth: 120,
                            }}
                          >
                            {key}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.8125rem',
                              color: isChanged ? '#16a34a' : '#1a1a1a',
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
        {/* Filter Bar - 简约风格 */}
        <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', mb: isMobile ? 2 : 3 }}>
          <CardContent sx={{ py: isMobile ? 1.5 : 2, px: isMobile ? 1.5 : 2.5 }}>
            <Grid container spacing={isMobile ? 1.5 : 2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('audit.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#999', fontSize: isMobile ? 18 : 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
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
              <Grid item xs={6} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('audit.startDate') || 'Start Date'}
                  value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                  onClick={(e) => setStartDateAnchorEl(e.currentTarget)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      cursor: 'pointer',
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
                    '& .MuiInputLabel-root': { color: '#666', fontSize: isMobile ? '0.75rem' : '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <EventIcon sx={{ fontSize: isMobile ? 16 : 20, color: '#999' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('audit.endDate') || 'End Date'}
                  value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                  onClick={(e) => setEndDateAnchorEl(e.currentTarget)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      cursor: 'pointer',
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
                    '& .MuiInputLabel-root': { color: '#666', fontSize: isMobile ? '0.75rem' : '0.875rem' },
                    '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                  }}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <EventIcon sx={{ fontSize: isMobile ? 16 : 20, color: '#999' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666', fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                  {t('audit.resourceLabel')}
                </InputLabel>
                <Select
                  value={resourceFilter}
                  label={t('audit.resourceLabel')}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  sx={{
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
                  }}
                >
                  <MenuItem value="all">{t('audit.all')}</MenuItem>
                  {/* RBAC Resources */}
                  <MenuItem value="USER">{t('audit.resource.user')}</MenuItem>
                  <MenuItem value="USER_ROLE">{t('audit.resource.userRole')}</MenuItem>
                  {/* Business Resources */}
                  <MenuItem value="CUSTOMER">{t('audit.resource.customer')}</MenuItem>
                  <MenuItem value="CUSTOMER_PACKAGE">{t('audit.resource.customerPackage')}</MenuItem>
                  <MenuItem value="MEMBERSHIP_TIER">{t('audit.resource.membershipTier')}</MenuItem>
                  <MenuItem value="APPOINTMENT">{t('audit.resource.appointment')}</MenuItem>
                  <MenuItem value="ORDER">{t('audit.resource.order')}</MenuItem>
                  <MenuItem value="SERVICE">{t('audit.resource.service')}</MenuItem>
                  <MenuItem value="SERVICE_PACKAGE">{t('audit.resource.servicePackage')}</MenuItem>
                  <MenuItem value="SERVICE_CATEGORY">{t('audit.resource.serviceCategory')}</MenuItem>
                  <MenuItem value="RESOURCE">{t('audit.resource.resource')}</MenuItem>
                  <MenuItem value="RESOURCE_SCHEDULE">{t('audit.resource.resourceSchedule')}</MenuItem>
                  <MenuItem value="STAFF_ATTENDANCE">{t('audit.resource.staffAttendance')}</MenuItem>
                  {/* Cost Management Resources */}
                  <MenuItem value="COST_MANAGEMENT">{t('audit.resource.costManagement')}</MenuItem>
                  {/* Notification Resources */}
                  <MenuItem value="NOTIFICATION_TEMPLATE">{t('audit.resource.notificationTemplate')}</MenuItem>
                  <MenuItem value="NOTIFICATION_LOG">{t('audit.resource.notificationLog')}</MenuItem>
                  <MenuItem value="STAFF_NOTIFICATION">{t('audit.resource.staffNotification')}</MenuItem>
                  {/* Merchant Resources */}
                  <MenuItem value="MERCHANT">{t('audit.resource.merchant')}</MenuItem>
                  <MenuItem value="MERCHANT_CONFIG_ITEM">{t('audit.resource.merchantConfigItem')}</MenuItem>
                  <MenuItem value="TENANT">{t('audit.resource.tenant')}</MenuItem>
                  {/* Marketing Resources */}
                  <MenuItem value="MARKETING">{t('audit.resource.marketing')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666', fontSize: isMobile ? '0.75rem' : '0.875rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                  {t('audit.actionLabel')}
                </InputLabel>
                <Select
                  value={actionFilter}
                  label={t('audit.actionLabel')}
                  onChange={(e) => setActionFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
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
                  <MenuItem value="SEND_SUMMARY">{t('audit.action.sendSummary')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666', fontSize: isMobile ? '0.75rem' : '0.875rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                  {t('audit.statusLabel')}
                </InputLabel>
                <Select
                  value={statusFilter}
                  label={t('audit.statusLabel')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
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
            <Grid item xs={6} sm={12} md={3}>
              <Box display="flex" gap={1} justifyContent={isMobile ? 'flex-start' : 'flex-end'}>
                <Tooltip title={t('audit.refresh')}>
                  <IconButton
                    size="small"
                    onClick={loadAuditLogs}
                    sx={{
                      backgroundColor: alpha(THEME_COLOR, 0.1),
                      '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.15) },
                    }}
                  >
                    <RefreshIcon sx={{ color: THEME_COLOR, fontSize: isMobile ? 18 : 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table/Cards - 简约风格 */}
      {error && (
        <Box mb={2}>
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
            action={
              <Tooltip title={t('audit.refresh')}>
                <IconButton onClick={loadAuditLogs} size="small" sx={{ color: 'error.main' }}>
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            }
          >
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: isMobile ? '0.8rem' : '0.875rem' }} gutterBottom>
                {t('audit.loadError')}
              </Typography>
              <Typography sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>
                {error}
              </Typography>
            </Box>
          </Alert>
        </Box>
      )}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={isMobile ? 24 : 32} sx={{ color: THEME_COLOR }} />
        </Box>
      ) : logs.length === 0 && !error ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={6}>
          <FilterIcon sx={{ fontSize: isMobile ? 40 : 48, color: '#ccc', mb: 2 }} />
          <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: '#888' }}>{t('audit.noLogs')}</Typography>
        </Box>
      ) : logs.length > 0 && !error ? (
        <>
          {isMobile ? (
            /* 移动端卡片视图 */
            <Box>
              {logs.map((log) => {
                const resourceColors = getResourceColor(log.resource);
                return (
                  <Card
                    key={log.id}
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      mb: 1.5,
                      bgcolor: '#fff',
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box flex={1} mr={1}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a1a1a', mb: 0.5 }}>
                            {log.username || `User #${log.userId}`}
                          </Typography>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            <Chip
                              label={getResourceLabel(log.resource)}
                              size="small"
                              sx={{
                                backgroundColor: resourceColors.bg,
                                color: resourceColors.color,
                                fontWeight: 500,
                                fontSize: '0.6rem',
                                height: 18,
                              }}
                            />
                            {getStatusChip(log.status)}
                          </Box>
                        </Box>
                        {(log.oldValue || log.newValue) && (
                          <IconButton
                            size="small"
                            onClick={() => handleViewChanges(log)}
                            sx={{ color: THEME_COLOR, p: 0.5 }}
                          >
                            <HistoryIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>
                          {t('audit.actionLabel')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#1a1a1a' }}>
                          {getActionLabel(log.action)}
                          {log.resourceId ? ` #${log.resourceId}` : ''}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>
                          {t('audit.dateTime')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#666' }}>
                          {formatDate(log.createdAt)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            /* 桌面端表格视图 */
            <Card sx={{ borderRadius: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.dateTime')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.user')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.resourceLabel')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.actionLabel')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.resourceId')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.statusLabel')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.changes')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                          {t('audit.ipAddress')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow
                          key={log.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                            '& td': { py: 1.5, fontSize: '0.8125rem' }
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                              {formatDate(log.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                                {log.username || `User #${log.userId}`}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
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
                                    fontSize: '0.75rem',
                                    height: 22,
                                  }}
                                />
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                              {getActionLabel(log.action)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontFamily: log.resourceId ? 'monospace' : 'inherit',
                                fontSize: '0.8125rem',
                                color: log.resourceId ? '#1a1a1a' : '#888',
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
                                    color: THEME_COLOR,
                                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                                  }}
                                >
                                  <HistoryIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                              {log.ipAddress || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
            labelRowsPerPage={isMobile ? '' : t('audit.rowsPerPage')}
            sx={{
              borderTop: isMobile ? 'none' : '1px solid',
              borderColor: 'divider',
              '& .MuiTablePagination-select': {
                borderRadius: 1,
              },
              '& .MuiTablePagination-selectLabel': {
                display: isMobile ? 'none' : 'block',
              },
              '& .MuiTablePagination-displayedRows': {
                fontSize: isMobile ? '0.75rem' : '0.875rem',
              },
            }}
          />
        </>
      ) : null}

      {/* Change Comparison Dialog - 简约风格 */}
      <Dialog
        open={changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2.5,
            boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('audit.changeHistory')}
          </Typography>
          {selectedLog && (
            <Typography sx={{ fontSize: '0.875rem', color: '#666', mt: 0.5 }}>
              {getResourceLabel(selectedLog.resource)} · {getActionLabel(selectedLog.action)}
              {selectedLog.resourceId && ` · #${selectedLog.resourceId}`}
            </Typography>
          )}
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {selectedLog && renderChanges(selectedLog)}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button
            size="small"
            onClick={() => setChangeDialogOpen(false)}
            sx={{
              textTransform: 'none',
              color: '#666',
              fontSize: '0.875rem',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Start Date Picker Popover */}
      <Popover
        open={Boolean(startDateAnchorEl)}
        anchorEl={startDateAnchorEl}
        onClose={() => setStartDateAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '& .MuiPickersDay-root.Mui-selected': {
                bgcolor: THEME_COLOR,
                '&:hover': { bgcolor: THEME_COLOR_DARK },
              },
              '& .MuiPickersDay-root:focus.Mui-selected': {
                bgcolor: THEME_COLOR,
              },
            }
          }
        }}
      >
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={startDate}
          onChange={(newDate) => {
            if (newDate) {
              setStartDate(newDate);
              setStartDateAnchorEl(null);
            }
          }}
          slotProps={{
            actionBar: {
              actions: []
            }
          }}
        />
      </Popover>

      {/* End Date Picker Popover */}
      <Popover
        open={Boolean(endDateAnchorEl)}
        anchorEl={endDateAnchorEl}
        onClose={() => setEndDateAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '& .MuiPickersDay-root.Mui-selected': {
                bgcolor: THEME_COLOR,
                '&:hover': { bgcolor: THEME_COLOR_DARK },
              },
              '& .MuiPickersDay-root:focus.Mui-selected': {
                bgcolor: THEME_COLOR,
              },
            }
          }
        }}
      >
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={endDate}
          onChange={(newDate) => {
            if (newDate) {
              setEndDate(newDate);
              setEndDateAnchorEl(null);
            }
          }}
          slotProps={{
            actionBar: {
              actions: []
            }
          }}
        />
      </Popover>
    </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;
