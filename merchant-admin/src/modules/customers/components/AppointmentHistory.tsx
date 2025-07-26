import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TablePagination,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/config';
import { Customer, Appointment, AppointmentStats, appointmentApi, handleApiError } from '../../../services/api';


const AppointmentHistory: React.FC<{
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}> = ({
  open,
  onClose,
  customer,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState<AppointmentStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 获取租户ID
    const tenantId = useMemo(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return Number(user.tenantId || 1);
    }, []);

    // 加载预约数据
    const loadAppointments = async () => {
      if (!customer?.id) return;

      try {
        setLoading(true);
        setError(null);

        const [appointmentsData, statsData] = await Promise.all([
          appointmentApi.getAppointmentsByCustomerId(Number(customer.id), tenantId),
          appointmentApi.getAppointmentStats(Number(customer.id), tenantId)
        ]);

        setAppointments(appointmentsData);
        setStats(statsData);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // 当对话框打开且有客户信息时加载数据
    useEffect(() => {
      if (open && customer) {
        loadAppointments();
      }
    }, [open, customer, tenantId]);

    // 根据客户ID筛选预约记录
    const customerAppointments = useMemo(() => {
      return appointments;
    }, [appointments]);

    // 根据标签页筛选预约记录
    const filteredAppointments = useMemo(() => {
      switch (activeTab) {
        case 1: // 即将到来
          return customerAppointments.filter(apt =>
            apt.status === 'CONFIRMED' && new Date(apt.appointmentDate) >= new Date()
          );
        case 2: // 已完成
          return customerAppointments.filter(apt => apt.status === 'COMPLETED');
        case 3: // 已取消
          return customerAppointments.filter(apt =>
            apt.status === 'CANCELLED' || apt.status === 'NO_SHOW'
          );
        default: // 全部
          return customerAppointments;
      }
    }, [customerAppointments, activeTab]);

    // 分页数据
    const paginatedAppointments = useMemo(() => {
      const startIndex = page * rowsPerPage;
      return filteredAppointments.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredAppointments, page, rowsPerPage]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
      setPage(0);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'CONFIRMED': return 'primary';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'error';
        case 'NO_SHOW': return 'warning';
        default: return 'default';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'CONFIRMED': return <ScheduleIcon />;
        case 'COMPLETED': return <CheckIcon />;
        case 'CANCELLED': return <CancelIcon />;
        case 'NO_SHOW': return <CancelIcon />;
        default: return <ScheduleIcon />;
      }
    };

    // 获取当前语言设置
    const currentLocale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency: currentLocale === 'zh-CN' ? 'CNY' : 'USD'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(currentLocale, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(currentLocale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    if (!customer) return null;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            borderRadius: 3,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#6366F1',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 600,
              }}
            >
              {customer?.firstName?.charAt(0)}{customer?.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {customer?.firstName} {customer?.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('customers.appointmentHistory')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="large"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress size={48} sx={{ color: '#F59E0B' }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* 现代化统计信息卡片 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid',
                      borderColor: alpha('#6366F1', 0.1),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)',
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
                            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <GroupsIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1' }}>
                          {stats?.totalAppointments || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t('customers.totalAppointments')}
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
                        {t('customers.completedAppointments')}
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
                          <WalletIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                          {formatCurrency(stats?.totalSpent || 0)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t('customers.totalSpent')}
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
                      borderColor: alpha('#EC4899', 0.1),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(236, 72, 153, 0.15)',
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
                            background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          <ReviewIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC4899' }}>
                          {(stats?.avgRating || 0).toFixed(1)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t('customers.avgRating')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}

          {/* 现代化标签页 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&.Mui-selected': {
                    color: '#F59E0B',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#F59E0B',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab label={t('customers.allAppointments')} />
              <Tab label={t('customers.upcoming')} />
              <Tab label={t('customers.completed')} />
              <Tab label={t('customers.cancelled')} />
            </Tabs>
          </Box>

          {/* 现代化预约记录表格 */}
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
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>{t('customers.service')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.dateTime')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.staff')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.price')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.rating')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAppointments.map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#F59E0B', 0.04),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {t('customers.appointmentService')}
                          </Typography>
                          {appointment.appointmentServices && appointment.appointmentServices.length > 0 ? (
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                              {appointment.appointmentServices.map((service, index) => (
                                <Chip
                                  key={index}
                                  label={service.serviceName}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: alpha('#F59E0B', 0.3),
                                    color: '#D97706',
                                    '&:hover': {
                                      backgroundColor: alpha('#F59E0B', 0.1),
                                    },
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                              {t('customers.noServiceDetails')}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            {appointment.duration} {t('customers.minutesUnit')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <CalendarIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                          <Typography variant="body2">
                            {formatDate(appointment.appointmentDate)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TimeIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                          <Typography variant="body2">
                            {formatTime(appointment.appointmentTime)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {appointment.resource?.name || t('customers.unassigned')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(appointment.status)}
                          label={t(`customers.appointmentStatus.${appointment.status.toLowerCase()}`)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                              fontSize: 16,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                          {formatCurrency(appointment.totalAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {appointment.rating ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {appointment.rating}
                            </Typography>
                            <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box py={6}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('customers.noAppointmentRecords')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('customers.customerHasNoAppointments')}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredAppointments.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#f8fafc',
              }}
            />
          </Card>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: '#f8fafc' }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #D97706, #B45309)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {t('customers.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

export default AppointmentHistory; 