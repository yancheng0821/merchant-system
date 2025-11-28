import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  Box,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { CurrencyUtils } from '../../config/constants';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import { getMerchantToday, getMerchantNow } from '../../utils/timezoneUtils';
import AddAppointmentDialog from './components/AddAppointmentDialog';
import { Customer, Appointment, appointmentApi, customerApi, notificationApi, handleApiError } from '../../services/api';
// 预约统计接口
interface AppointmentStats {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}

const AppointmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Theme-aware colors
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#8B5CF6';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#7C3AED';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // 加载状态
  const [loading, setLoading] = useState(false);

  // 对话框状态
  const [addAppointmentOpen, setAddAppointmentOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 通知状态
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 获取租户ID
  const tenantId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(user.tenantId || 1);
  }, []);

  // 获取当前语言设置
  const currentLocale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';

  // 加载预约数据
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);


      // 并行获取客户数据和预约数据
      const [customerList, appointmentList] = await Promise.all([
        customerApi.getCustomers({
          tenantId: tenantId.toString(),
          page: 0,
          size: 100, // 获取更多客户用于预约展示
        }),
        appointmentApi.getAllAppointments(tenantId)
      ]);

      setCustomers(customerList.customers);
      setAppointments(appointmentList);

      // 计算统计数据
      const appointmentStats: AppointmentStats = {
        totalAppointments: appointmentList.length,
        confirmedAppointments: appointmentList.filter(apt => apt.status === 'CONFIRMED').length,
        completedAppointments: appointmentList.filter(apt => apt.status === 'COMPLETED').length,
        totalRevenue: appointmentList
          .filter(apt => apt.status === 'COMPLETED')
          .reduce((sum, apt) => sum + (apt.totalAmount || 0), 0),
      };
      setStats(appointmentStats);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // 初始加载数据
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // 处理URL参数中的appointmentId
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (appointmentId && appointments.length > 0) {
      const appointment = appointments.find(apt => apt.id === Number(appointmentId));
      if (appointment) {
        setSelectedAppointment(appointment);
        setViewDetailsOpen(true);
        // 清除URL参数
        setSearchParams({});
      }
    }
  }, [appointments, searchParams, setSearchParams]);

  // 筛选预约数据
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // 来源筛选
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(apt => (apt.bookingSource || 'ADMIN').toUpperCase() === sourceFilter.toUpperCase());
    }

    // 日期筛选
    if (dateFilter !== 'all') {
      const todayStr = getMerchantToday();
      const tomorrow = new Date(getMerchantNow());
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(apt => apt.appointmentDate === todayStr);
          break;
        case 'tomorrow':
          filtered = filtered.filter(apt => apt.appointmentDate === tomorrowStr);
          break;
        case 'this-week':
          const today = getMerchantNow();
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekStartStr = weekStart.toISOString().split('T')[0];

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const weekEndStr = weekEnd.toISOString().split('T')[0];

          filtered = filtered.filter(apt =>
            apt.appointmentDate >= weekStartStr && apt.appointmentDate <= weekEndStr
          );
          break;
      }
    }

    // 按创建时间降序排序，确保新创建的预约显示在前面
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [appointments, searchTerm, statusFilter, sourceFilter, dateFilter]);

  // 当筛选条件改变时，重置页码
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, sourceFilter, dateFilter]);

  const getStatusChip = (status: string) => {
    const statusConfig = {
      PENDING_CONFIRMATION: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('appointments.appointmentStatuses.pending-confirmation') },
      CONFIRMED: { color: '#3B82F6', bg: alpha('#3B82F6', 0.1), label: t('appointments.appointmentStatuses.confirmed') },
      CHECKED_IN: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('appointments.appointmentStatuses.checked-in') },
      COMPLETED: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('appointments.appointmentStatuses.completed') },
      CANCELLED: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('appointments.appointmentStatuses.cancelled') },
      NO_SHOW: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: t('appointments.appointmentStatuses.no-show') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CONFIRMED;

    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 2,
          },
        }}
      />
    );
  };

  const formatCurrency = (amount: number) => {
    return CurrencyUtils.formatAmount(amount);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString(currentLocale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    // 使用本地日期解析，避免时区转换问题
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month是0-based
    return date.toLocaleDateString(currentLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 600,
                color: THEME_COLOR,
                mb: 0.5,
              }}
            >
              {t('appointments.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {t('appointments.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 简约统计卡片 */}
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#8B5CF6', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                    flexShrink: 0,
                  }}
                >
                  <EventNoteIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('appointments.totalAppointments')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {stats?.totalAppointments || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#3B82F6', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#3B82F6',
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('appointments.pendingService')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {stats?.confirmedAppointments || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#10B981', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#10B981',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('appointments.completedAppointments')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {stats?.completedAppointments || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#F59E0B', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('appointments.totalRevenue')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 现代化搜索和过滤区域 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('appointments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.8125rem',
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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666', fontSize: '0.8125rem' }}>{t('appointments.statusFilter')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('appointments.statusFilter')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.8125rem',
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
                  <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>{t('appointments.allStatuses')}</MenuItem>
                  <MenuItem value="pending_confirmation" sx={{ fontSize: '0.8125rem' }}>{t('appointments.appointmentStatuses.pending-confirmation')}</MenuItem>
                  <MenuItem value="confirmed" sx={{ fontSize: '0.8125rem' }}>{t('appointments.appointmentStatuses.confirmed')}</MenuItem>
                  <MenuItem value="checked_in" sx={{ fontSize: '0.8125rem' }}>{t('appointments.appointmentStatuses.checked-in')}</MenuItem>
                  <MenuItem value="completed" sx={{ fontSize: '0.8125rem' }}>{t('appointments.appointmentStatuses.completed')}</MenuItem>
                  <MenuItem value="cancelled" sx={{ fontSize: '0.8125rem' }}>{t('appointments.appointmentStatuses.cancelled')}</MenuItem>
                  <MenuItem value="no_show" sx={{ fontSize: '0.8125rem' }}>{t('appointments.appointmentStatuses.no-show')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666', fontSize: '0.8125rem' }}>{t('appointments.sourceFilter')}</InputLabel>
                <Select
                  value={sourceFilter}
                  label={t('appointments.sourceFilter')}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.8125rem',
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
                  <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>{t('appointments.allSources')}</MenuItem>
                  <MenuItem value="ONLINE" sx={{ fontSize: '0.8125rem' }}>{t('appointments.sourceOnline')}</MenuItem>
                  <MenuItem value="GOOGLE" sx={{ fontSize: '0.8125rem' }}>{t('appointments.sourceGoogle')}</MenuItem>
                  <MenuItem value="ADMIN" sx={{ fontSize: '0.8125rem' }}>{t('appointments.sourceAdmin')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#666', fontSize: '0.8125rem' }}>{t('appointments.dateFilter')}</InputLabel>
                <Select
                  value={dateFilter}
                  label={t('appointments.dateFilter')}
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.8125rem',
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
                  <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>{t('appointments.dateOptions.allDates')}</MenuItem>
                  <MenuItem value="today" sx={{ fontSize: '0.8125rem' }}>{t('appointments.dateOptions.today')}</MenuItem>
                  <MenuItem value="tomorrow" sx={{ fontSize: '0.8125rem' }}>{t('appointments.dateOptions.tomorrow')}</MenuItem>
                  <MenuItem value="this-week" sx={{ fontSize: '0.8125rem' }}>{t('appointments.dateOptions.thisWeek')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 暂时隐藏新建预约按钮 - 从 Schedule 模块创建预约 */}
            {/* <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddAppointmentOpen(true)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('appointments.newAppointment')}
              </Button>
            </Grid> */}
          </Grid>
        </CardContent>
      </Card>

      {/* 现代化表格 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#fafafa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.id')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.customer')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.services')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.dateTime')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.staff')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.amount')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.source')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>{t('appointments.tableHeaders.rating')}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5, textAlign: 'center' }}>{t('appointments.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: THEME_COLOR }} size={32} />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: '#888', fontSize: '0.8125rem' }}>
                      {t('appointments.noAppointments')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                        '& td': { py: 1.5, fontSize: '0.8125rem' },
                      }}
                    >
                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: 'monospace',
                            color: '#888',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                          }}
                        >
                          #{appointment.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: THEME_COLOR,
                              fontSize: '0.75rem',
                            }}
                          >
                            {appointment.customer?.firstName?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                              {appointment.customer ?
                                `${appointment.customer.firstName} ${appointment.customer.lastName}` :
                                t('appointments.unknownCustomer')
                              }
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                              {appointment.customer?.phone || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {appointment.appointmentServices && appointment.appointmentServices.length > 0 ? (
                          <Box display="flex" flexWrap="wrap" gap={0.5} maxWidth={250}>
                            {appointment.appointmentServices.map((service, idx) => (
                              <Chip
                                key={idx}
                                label={service.serviceName}
                                size="small"
                                sx={{
                                  backgroundColor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#10B981', 0.1),
                                  color: isMonochrome ? '#1a1a1a' : '#10B981',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: 22,
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>
                            {t('appointments.noServiceDetails')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 14, color: THEME_COLOR }} />
                          <Typography sx={{ fontSize: '0.8125rem', color: '#1a1a1a' }}>
                            {formatDate(appointment.appointmentDate)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TimeIcon sx={{ fontSize: 14, color: '#888' }} />
                          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                            {formatTime(appointment.appointmentTime)} ({appointment.duration} {t('appointments.minutesUnit')})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {appointment.appointmentResources && appointment.appointmentResources.length > 0 ? (
                            <Box display="flex" flexDirection="column" gap={0.5}>
                              {appointment.appointmentResources.map((resource, idx) => (
                                <Box key={idx} display="flex" alignItems="center" gap={0.5}>
                                  {resource.resourceType === 'STAFF' ? (
                                    <PersonIcon sx={{ fontSize: 14, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
                                  ) : (
                                    <MeetingRoomIcon sx={{ fontSize: 14, color: isMonochrome ? '#6a6a6a' : '#10B981' }} />
                                  )}
                                  <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                    {resource.resourceName || t('appointments.unassigned')}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                              {t('appointments.unassigned')}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: THEME_COLOR }}>
                          {formatCurrency(appointment.totalAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(appointment.status)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            appointment.bookingSource === 'ONLINE' ? t('appointments.sourceOnline') :
                            appointment.bookingSource === 'GOOGLE' ? t('appointments.sourceGoogle') :
                            t('appointments.sourceAdmin')
                          }
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            bgcolor: isMonochrome ? alpha('#6B7280', 0.1) :
                                     appointment.bookingSource === 'ONLINE' ? alpha('#3B82F6', 0.1) :
                                     appointment.bookingSource === 'GOOGLE' ? alpha('#EA4335', 0.1) :
                                     alpha('#6B7280', 0.1),
                            color: isMonochrome ? '#6B7280' :
                                   appointment.bookingSource === 'ONLINE' ? '#3B82F6' :
                                   appointment.bookingSource === 'GOOGLE' ? '#EA4335' :
                                   '#6B7280',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {appointment.rating ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box display="flex">
                              {[...Array(5)].map((_, index) => (
                                <StarIcon
                                  key={index}
                                  sx={{
                                    fontSize: 14,
                                    color: index < appointment.rating! ? '#F59E0B' : '#E5E7EB',
                                  }}
                                />
                              ))}
                            </Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                              {appointment.rating}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                            {t('appointments.noRating')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {(hasPermission('appointments:view') || hasPermission('appointments:update')) && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setMenuAnchorEl(e.currentTarget);
                              setSelectedAppointment(appointment);
                              // Blur the button to prevent aria-hidden warning
                              e.currentTarget.blur();
                            }}
                            sx={{
                              color: '#999',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.04)',
                                color: '#666',
                              },
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredAppointments.length}
          page={Math.min(page, Math.max(0, Math.ceil(filteredAppointments.length / rowsPerPage) - 1))}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
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
      </Card>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              minWidth: 160,
              mt: 0.5,
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            // Close menu first
            setMenuAnchorEl(null);
            // Open dialog after a short delay to avoid focus conflicts
            setTimeout(() => {
              setViewDetailsOpen(true);
            }, 100);
          }}
          sx={{
            fontSize: '0.8125rem',
            py: 1,
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 16, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
          {t('appointments.viewDetails')}
        </MenuItem>

        {/* Temporarily disabled - Other actions */}
        {/* CONFIRMED和NO_SHOW状态的预约都可以标记为完成 */}
        {/* {hasPermission('appointments:update') && (selectedAppointment?.status === 'CONFIRMED' || selectedAppointment?.status === 'NO_SHOW') && (
          <MenuItem
            onClick={async () => {
              try {
                await appointmentApi.updateAppointmentStatus(selectedAppointment.id, 'COMPLETED');
                setSnackbar({
                  open: true,
                  message: t('appointments.markCompletedSuccess'),
                  severity: 'success',
                });
                loadAppointments(); // 重新加载数据
              } catch (err) {
                const errorMessage = handleApiError(err);
                setSnackbar({
                  open: true,
                  message: errorMessage,
                  severity: 'error',
                });
              }
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#10B981', 0.08) } }}
          >
            <CheckIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
            {selectedAppointment?.status === 'NO_SHOW'
              ? t('appointments.markCompletedFromNoShow')
              : t('appointments.markCompleted')}
          </MenuItem>
        )} */}

        {/* CONFIRMED和NO_SHOW状态的预约都可以取消 */}
        {/* {hasPermission('appointments:update') && (selectedAppointment?.status === 'CONFIRMED' || selectedAppointment?.status === 'NO_SHOW') && (
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
          >
            <CancelIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
            {selectedAppointment?.status === 'NO_SHOW'
              ? t('appointments.cancelFromNoShow')
              : t('appointments.cancelAppointment')}
          </MenuItem>
        )} */}

        {/* 只有CONFIRMED状态的预约才能标记为NO_SHOW */}
        {/* {hasPermission('appointments:update') && selectedAppointment?.status === 'CONFIRMED' && (
          <MenuItem
            onClick={async () => {
              try {
                await appointmentApi.updateAppointmentStatus(selectedAppointment.id, 'NO_SHOW');
                setSnackbar({
                  open: true,
                  message: t('appointments.markNoShowSuccess'),
                  severity: 'success',
                });
                loadAppointments(); // 重新加载数据
              } catch (err) {
                const errorMessage = handleApiError(err);
                setSnackbar({
                  open: true,
                  message: errorMessage,
                  severity: 'error',
                });
              }
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#F59E0B', 0.08) } }}
          >
            <PersonIcon sx={{ mr: 1, fontSize: 18, color: '#F59E0B' }} />
            {t('appointments.markNoShow')}
          </MenuItem>
        )} */}
      </Menu>

      {/* 对话框组件 */}
      <AddAppointmentDialog
        open={addAppointmentOpen}
        onClose={() => setAddAppointmentOpen(false)}
        customers={customers}
        onSave={async (appointment) => {
          try {
            // 创建预约（通知会在后端自动发送）
            const createdAppointment = await appointmentApi.createAppointment(appointment);

            setSnackbar({
              open: true,
              message: t('appointments.createSuccess'),
              severity: 'success',
            });
            setAddAppointmentOpen(false);
            loadAppointments(); // 重新加载数据
          } catch (err) {
            const errorMessage = handleApiError(err);
            setSnackbar({
              open: true,
              message: errorMessage,
              severity: 'error',
            });
          }
        }}
      />

      {/* 查看详情对话框 */}
      <Dialog
        open={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        disableAutoFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ py: 2, px: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
              {t('appointments.appointmentDetails')}
            </Typography>
            <IconButton onClick={() => setViewDetailsOpen(false)} size="small" sx={{ color: '#888' }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
        <DialogContent>
          {selectedAppointment && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('appointments.customerInfo')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {selectedAppointment.customer ?
                      `${selectedAppointment.customer.firstName} ${selectedAppointment.customer.lastName}` :
                      t('appointments.unknownCustomer')
                    }
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedAppointment.customer?.phone || '-'}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedAppointment.customer?.email || '-'}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('appointments.appointmentInfo')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{formatDate(selectedAppointment.appointmentDate)}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {formatTime(selectedAppointment.appointmentTime)} ({selectedAppointment.duration} {t('appointments.minutesUnit')})
                  </Typography>
                </Box>
                {selectedAppointment.appointmentResources && selectedAppointment.appointmentResources.length > 0 ? (
                  <Box>
                    {selectedAppointment.appointmentResources.map((resource, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                        {resource.resourceType === 'STAFF' ? (
                          <PersonIcon sx={{ fontSize: 16, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
                        ) : (
                          <MeetingRoomIcon sx={{ fontSize: 16, color: isMonochrome ? '#6a6a6a' : '#10B981' }} />
                        )}
                        <Typography variant="body2">
                          {resource.resourceName || t('appointments.unassigned')}
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 0.5 }}>
                            ({resource.resourceType === 'STAFF' ? t('appointments.staff') : t('appointments.room')})
                          </Typography>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{t('appointments.unassigned')}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t('appointments.status')}: {getStatusChip(selectedAppointment.status)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t('appointments.bookingSource')}:
                    <Chip
                      size="small"
                      label={
                        selectedAppointment.bookingSource === 'ONLINE' ? t('appointments.sourceOnline') :
                        selectedAppointment.bookingSource === 'GOOGLE' ? t('appointments.sourceGoogle') :
                        t('appointments.sourceAdmin')
                      }
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: isMonochrome ? alpha('#6B7280', 0.1) :
                                 selectedAppointment.bookingSource === 'ONLINE' ? alpha('#3B82F6', 0.1) :
                                 selectedAppointment.bookingSource === 'GOOGLE' ? alpha('#EA4335', 0.1) :
                                 alpha('#6B7280', 0.1),
                        color: isMonochrome ? '#6B7280' :
                               selectedAppointment.bookingSource === 'ONLINE' ? '#3B82F6' :
                               selectedAppointment.bookingSource === 'GOOGLE' ? '#EA4335' :
                               '#6B7280',
                        '& .MuiChip-label': { px: 2 },
                      }}
                    />
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('appointments.services')}
                </Typography>
                {selectedAppointment.appointmentServices && selectedAppointment.appointmentServices.length > 0 ? (
                  <Box>
                    {selectedAppointment.appointmentServices.map((service, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{service.serviceName}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(service.price)} ({service.duration} {t('appointments.minutesUnit')})
                        </Typography>
                      </Box>
                    ))}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} sx={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {t('appointments.total')}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: isMonochrome ? '#1a1a1a' : '#10B981' }}>
                        {formatCurrency(selectedAppointment.totalAmount || 0)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('appointments.noServiceDetails')}
                  </Typography>
                )}
              </Grid>

              {selectedAppointment.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('appointments.notes')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAppointment.notes}
                  </Typography>
                </Grid>
              )}

              {selectedAppointment.rating && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('appointments.rating')}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box display="flex">
                      {[...Array(5)].map((_, index) => (
                        <StarIcon
                          key={index}
                          sx={{
                            fontSize: 20,
                            color: index < selectedAppointment.rating! ? '#F59E0B' : '#E5E7EB',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedAppointment.rating}/5
                    </Typography>
                  </Box>
                  {selectedAppointment.review && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedAppointment.review}
                    </Typography>
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: 400,
          }
        }}
      >
        <Box sx={{ py: 2, px: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('appointments.confirmCancelTitle')}
          </Typography>
        </Box>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
            {t('appointments.confirmCancelMessage', {
              customerName: selectedAppointment?.customer ?
                `${selectedAppointment.customer.firstName} ${selectedAppointment.customer.lastName}` :
                t('appointments.unknownCustomer')
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              color: '#666',
              fontSize: '0.8125rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={async () => {
              try {
                await appointmentApi.updateAppointmentStatus(selectedAppointment!.id, 'CANCELLED');
                setSnackbar({
                  open: true,
                  message: t('appointments.cancelSuccess'),
                  severity: 'success',
                });
                loadAppointments(); // 重新加载数据
              } catch (err) {
                const errorMessage = handleApiError(err);
                setSnackbar({
                  open: true,
                  message: errorMessage,
                  severity: 'error',
                });
              }
              setDeleteDialogOpen(false);
            }}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              backgroundColor: '#EF4444',
              fontSize: '0.8125rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#DC2626',
                boxShadow: 'none',
              },
            }}
          >
            {t('appointments.confirmCancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppointmentManagement; 