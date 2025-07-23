import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Edit as EditIcon,
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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import AddAppointmentDialog from './components/AddAppointmentDialog';
import { Customer, Appointment, appointmentApi, customerApi, handleApiError } from '../../services/api';
// 预约统计接口
interface AppointmentStats {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}

const AppointmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // 加载状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

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
      setError(errorMessage);
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

    // 日期筛选
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD格式
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(apt => apt.appointmentDate === todayStr);
          break;
        case 'tomorrow':
          filtered = filtered.filter(apt => apt.appointmentDate === tomorrowStr);
          break;
        case 'this-week':
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
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  // 当筛选条件改变时，重置页码
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, dateFilter]);

  const getStatusChip = (status: string) => {
    const statusConfig = {
      CONFIRMED: { color: '#3B82F6', bg: alpha('#3B82F6', 0.1), label: t('appointments.appointmentStatuses.confirmed') },
      COMPLETED: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('appointments.appointmentStatuses.completed') },
      CANCELLED: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('appointments.appointmentStatuses.cancelled') },
      NO_SHOW: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('appointments.appointmentStatuses.no-show') },
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
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currentLocale === 'zh-CN' ? 'CNY' : 'USD'
    }).format(amount);
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
      {/* 现代化页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #7C3AED, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('appointments.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('appointments.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 现代化统计卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#8B5CF6', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(139, 92, 246, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <EventNoteIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                  {stats?.totalAppointments || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.totalAppointments')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#3B82F6', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CheckIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                  {stats?.confirmedAppointments || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.pendingService')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#10B981', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  {stats?.completedAppointments || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.completedAppointments')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#F59E0B', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  {formatCurrency(stats?.totalRevenue || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.totalRevenue')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('appointments.searchPlaceholder')}
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
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('appointments.statusFilter')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('appointments.statusFilter')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                  }}
                >
                  <MenuItem value="all">{t('appointments.allStatuses')}</MenuItem>
                  <MenuItem value="confirmed">{t('appointments.appointmentStatuses.confirmed')}</MenuItem>
                  <MenuItem value="completed">{t('appointments.appointmentStatuses.completed')}</MenuItem>
                  <MenuItem value="cancelled">{t('appointments.appointmentStatuses.cancelled')}</MenuItem>
                  <MenuItem value="no_show">{t('appointments.appointmentStatuses.no-show')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('appointments.dateFilter')}</InputLabel>
                <Select
                  value={dateFilter}
                  label={t('appointments.dateFilter')}
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                  }}
                >
                  <MenuItem value="all">{t('appointments.dateOptions.allDates')}</MenuItem>
                  <MenuItem value="today">{t('appointments.dateOptions.today')}</MenuItem>
                  <MenuItem value="tomorrow">{t('appointments.dateOptions.tomorrow')}</MenuItem>
                  <MenuItem value="this-week">{t('appointments.dateOptions.thisWeek')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
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
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>{t('appointments.tableHeaders.customer')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.services')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.dateTime')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.staff')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.amount')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.rating')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#8B5CF6' }} />
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
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
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#8B5CF6', 0.04),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: '#8B5CF6',
                              fontSize: '0.875rem',
                            }}
                          >
                            {appointment.customer?.firstName?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {appointment.customer ?
                                `${appointment.customer.firstName} ${appointment.customer.lastName}` :
                                t('appointments.unknownCustomer')
                              }
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointment.customer?.phone || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {t('appointments.appointmentService')}
                          </Typography>
                          {appointment.appointmentServices && appointment.appointmentServices.length > 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              {appointment.appointmentServices.map(service => service.serviceName).join(', ')}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {t('appointments.noServiceDetails')}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 14, color: '#8B5CF6' }} />
                          <Typography variant="body2">
                            {formatDate(appointment.appointmentDate)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(appointment.appointmentTime)} ({appointment.duration} {t('appointments.minutesUnit')})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                          <Typography variant="body2">
                            {appointment.staff?.name || t('appointments.unassigned')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(appointment.totalAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(appointment.status)}
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
                            <Typography variant="caption" color="text.secondary">
                              {appointment.rating}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {t('appointments.noRating')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchorEl(e.currentTarget);
                            setSelectedAppointment(appointment);
                          }}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha('#8B5CF6', 0.1),
                            },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
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
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#f8fafc',
          }}
        />
      </Card>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          }
        }}
      >
        <MenuItem
          onClick={() => {
            setViewDetailsOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#6366F1', 0.08) } }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#6366F1' }} />
          {t('appointments.viewDetails')}
        </MenuItem>
        

        
        {/* CONFIRMED和NO_SHOW状态的预约都可以标记为完成 */}
        {(selectedAppointment?.status === 'CONFIRMED' || selectedAppointment?.status === 'NO_SHOW') && (
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
        )}
        
        {/* CONFIRMED和NO_SHOW状态的预约都可以取消 */}
        {(selectedAppointment?.status === 'CONFIRMED' || selectedAppointment?.status === 'NO_SHOW') && (
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
        )}
        
        {/* 只有CONFIRMED状态的预约才能标记为NO_SHOW */}
        {selectedAppointment?.status === 'CONFIRMED' && (
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
        )}
      </Menu>

      {/* 对话框组件 */}
      <AddAppointmentDialog
        open={addAppointmentOpen}
        onClose={() => setAddAppointmentOpen(false)}
        customers={customers}
        onSave={async (appointment) => {
          try {
            await appointmentApi.createAppointment(appointment);
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
              {t('appointments.appointmentDetails')}
            </Typography>
            <IconButton onClick={() => setViewDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
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
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedAppointment.staff?.name || t('appointments.unassigned')}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('appointments.status')}: {getStatusChip(selectedAppointment.status)}
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
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={2} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('appointments.total')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
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
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
            {t('appointments.confirmCancelTitle')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('appointments.confirmCancelMessage', {
              customerName: selectedAppointment?.customer ?
                `${selectedAppointment.customer.firstName} ${selectedAppointment.customer.lastName}` :
                t('appointments.unknownCustomer')
            })}
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
              borderRadius: 2,
              px: 3,
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
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