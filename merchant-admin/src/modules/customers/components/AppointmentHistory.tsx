import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Chip,
  Box,
  IconButton,
  Tabs,
  Tab,
  Grid,
  TablePagination,
  CircularProgress,
  Alert,
  alpha,
  Card,
  CardContent,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/config';
import { Customer, Appointment, AppointmentStats, appointmentApi, handleApiError } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { useTheme } from '../../../contexts/ThemeContext';


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
    const { themeMode } = useTheme();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    // 根据主题模式动态设置主题色
    const isMonochrome = themeMode === 'monochrome';
    const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#EC4899';

    // 统计卡片图标颜色 - 极简模式下使用灰色调
    const STATS_COLOR_1 = isMonochrome ? '#1a1a1a' : '#6366F1';
    const STATS_COLOR_2 = isMonochrome ? '#4a4a4a' : '#10B981';
    const STATS_COLOR_3 = isMonochrome ? '#6a6a6a' : '#EC4899';
    const STATS_COLOR_4 = isMonochrome ? '#8a8a8a' : '#F59E0B';

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
    const loadAppointments = useCallback(async () => {
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
    }, [customer?.id, tenantId]);

    // 当对话框打开且有客户信息时加载数据
    useEffect(() => {
      if (open && customer) {
        loadAppointments();
      }
    }, [open, customer, loadAppointments]);

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

    // 获取当前语言设置
    const currentLocale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';

    const formatCurrency = (amount: number) => {
      return CurrencyUtils.formatAmount(amount);
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
        disableEnforceFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            minHeight: isMobile ? 'auto' : '80vh',
            maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
            borderRadius: isMobile ? 2 : 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            m: isMobile ? 2 : 3,
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: isMobile ? 1.5 : 2,
            px: isMobile ? 2 : 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(THEME_COLOR, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {customer?.firstName} {customer?.lastName}
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>
                {t('customers.appointmentHistory')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#999',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: isMobile ? 2 : 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress size={48} sx={{ color: THEME_COLOR }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              {/* 简约统计信息卡片 */}
              <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 2 : 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: isMobile ? 1.5 : 2, bgcolor: '#fafafa', borderRadius: isMobile ? 1.5 : 2, border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Box display="flex" alignItems="center" gap={isMobile ? 1 : 1.5}>
                      <Box sx={{ width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: isMobile ? 1 : 1.5, bgcolor: alpha(STATS_COLOR_1, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GroupsIcon sx={{ fontSize: isMobile ? 14 : 18, color: STATS_COLOR_1 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : '1.1rem', lineHeight: 1.2 }}>
                          {stats?.totalAppointments || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.75rem', display: 'block', lineHeight: 1.2 }}>
                          {t('customers.totalAppointments')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: isMobile ? 1.5 : 2, bgcolor: '#fafafa', borderRadius: isMobile ? 1.5 : 2, border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Box display="flex" alignItems="center" gap={isMobile ? 1 : 1.5}>
                      <Box sx={{ width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: isMobile ? 1 : 1.5, bgcolor: alpha(STATS_COLOR_2, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUpIcon sx={{ fontSize: isMobile ? 14 : 18, color: STATS_COLOR_2 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : '1.1rem', lineHeight: 1.2 }}>
                          {stats?.completedAppointments || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.75rem', display: 'block', lineHeight: 1.2 }}>
                          {t('customers.completedAppointments')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: isMobile ? 1.5 : 2, bgcolor: '#fafafa', borderRadius: isMobile ? 1.5 : 2, border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Box display="flex" alignItems="center" gap={isMobile ? 1 : 1.5}>
                      <Box sx={{ width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: isMobile ? 1 : 1.5, bgcolor: alpha(STATS_COLOR_3, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WalletIcon sx={{ fontSize: isMobile ? 14 : 18, color: STATS_COLOR_3 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : '1.1rem', lineHeight: 1.2 }}>
                          {formatCurrency(stats?.totalSpent || 0)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.75rem', display: 'block', lineHeight: 1.2 }}>
                          {t('customers.totalSpent')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: isMobile ? 1.5 : 2, bgcolor: '#fafafa', borderRadius: isMobile ? 1.5 : 2, border: '1px solid rgba(0,0,0,0.04)' }}>
                    <Box display="flex" alignItems="center" gap={isMobile ? 1 : 1.5}>
                      <Box sx={{ width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: isMobile ? 1 : 1.5, bgcolor: alpha(STATS_COLOR_4, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ReviewIcon sx={{ fontSize: isMobile ? 14 : 18, color: STATS_COLOR_4 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : '1.1rem', lineHeight: 1.2 }}>
                          {(stats?.avgRating || 0).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888', fontSize: isMobile ? '0.65rem' : '0.75rem', display: 'block', lineHeight: 1.2 }}>
                          {t('customers.avgRating')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}

          {/* 标签页 */}
          <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', mb: isMobile ? 1.5 : 2.5 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : false}
              sx={{
                minHeight: isMobile ? 36 : 40,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  minHeight: isMobile ? 36 : 40,
                  minWidth: isMobile ? 'auto' : 90,
                  py: isMobile ? 0.75 : 1,
                  px: isMobile ? 1.5 : 2,
                  color: '#666',
                  '&.Mui-selected': {
                    color: THEME_COLOR,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: THEME_COLOR,
                  height: 2,
                },
              }}
            >
              <Tab label={t('customers.allAppointments')} />
              <Tab label={t('customers.upcoming')} />
              <Tab label={t('customers.completed')} />
              <Tab label={t('customers.cancelled')} />
            </Tabs>
          </Box>

          {/* 预约记录 - 移动端使用卡片，桌面端使用表格 */}
          {isMobile ? (
            // 移动端卡片视图
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {paginatedAppointments.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography sx={{ fontSize: '0.875rem', color: '#999' }}>
                    {t('customers.noAppointmentRecords')}
                  </Typography>
                </Box>
              ) : (
                paginatedAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#fafafa' },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* 顶部：日期时间 + 状态 */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                        <Box>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                            {formatDate(appointment.appointmentDate)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                            {formatTime(appointment.appointmentTime)} · {appointment.duration} {t('customers.minutesUnit')}
                          </Typography>
                        </Box>
                        <Chip
                          label={t(`customers.appointmentStatus.${appointment.status.toLowerCase()}`)}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            bgcolor: appointment.status === 'COMPLETED' ? alpha('#10B981', 0.1) :
                                    appointment.status === 'CONFIRMED' ? alpha('#3B82F6', 0.1) :
                                    appointment.status === 'CANCELLED' ? alpha('#EF4444', 0.1) :
                                    alpha('#F59E0B', 0.1),
                            color: appointment.status === 'COMPLETED' ? '#059669' :
                                   appointment.status === 'CONFIRMED' ? '#2563EB' :
                                   appointment.status === 'CANCELLED' ? '#DC2626' :
                                   '#D97706',
                            border: 'none',
                          }}
                        />
                      </Box>

                      {/* 服务列表 */}
                      <Box mb={1.5}>
                        {appointment.appointmentServices && appointment.appointmentServices.length > 0 ? (
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {appointment.appointmentServices.map((service, index) => (
                              <Chip
                                key={index}
                                label={service.serviceName}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: '#fafafa',
                                  color: '#1a1a1a',
                                  border: '1px solid #e0e0e0',
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                            {t('customers.noServiceDetails')}
                          </Typography>
                        )}
                      </Box>

                      {/* 底部：员工/房间 + 价格 + 评分 */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid rgba(0,0,0,0.06)">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {appointment.appointmentResources && appointment.appointmentResources.length > 0 ? (
                            <Typography sx={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {appointment.appointmentResources.map(r => r.resourceName || t('customers.unassigned')).join(', ')}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                              {t('customers.unassigned')}
                            </Typography>
                          )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a1a' }}>
                            {formatCurrency(appointment.totalAmount || 0)}
                          </Typography>
                          {appointment.rating ? (
                            <Box display="flex" alignItems="center" gap={0.25}>
                              <StarIcon sx={{ fontSize: 12, color: '#F59E0B' }} />
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#1a1a1a' }}>
                                {appointment.rating}
                              </Typography>
                            </Box>
                          ) : null}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
              {/* 移动端分页 */}
              <TablePagination
                component="div"
                count={filteredAppointments.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage=""
                sx={{
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  mt: 1,
                  '& .MuiTablePagination-selectLabel': { display: 'none' },
                  '& .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
                }}
              />
            </Box>
          ) : (
            // 桌面端表格视图
            <Box
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                overflow: 'hidden',
                bgcolor: '#fff',
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>{t('customers.service')}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>{t('customers.dateTime')}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>{t('customers.resource')}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>{t('customers.status')}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>{t('customers.price')}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>{t('customers.rating')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAppointments.map((appointment) => (
                      <TableRow
                        key={appointment.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#fafafa',
                          },
                        }}
                      >
                        <TableCell>
                          <Box>
                            {appointment.appointmentServices && appointment.appointmentServices.length > 0 ? (
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {appointment.appointmentServices.map((service, index) => (
                                  <Chip
                                    key={index}
                                    label={service.serviceName}
                                    size="small"
                                    sx={{
                                      height: 24,
                                      fontSize: '0.75rem',
                                      bgcolor: '#fafafa',
                                      color: '#1a1a1a',
                                      border: '1px solid #e0e0e0',
                                    }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '0.8125rem', color: '#999' }}>
                                {t('customers.noServiceDetails')}
                              </Typography>
                            )}
                            <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.5 }}>
                              {appointment.duration} {t('customers.minutesUnit')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8125rem', color: '#1a1a1a' }}>
                            {formatDate(appointment.appointmentDate)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                            {formatTime(appointment.appointmentTime)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {appointment.appointmentResources && appointment.appointmentResources.length > 0 ? (
                            <Box display="flex" flexDirection="column" gap={0.25}>
                              {appointment.appointmentResources.map((resource, idx) => (
                                <Typography key={idx} sx={{ fontSize: '0.8125rem', color: '#1a1a1a' }}>
                                  {resource.resourceName || t('customers.unassigned')}
                                  <Typography component="span" sx={{ fontSize: '0.75rem', color: '#888', ml: 0.5 }}>
                                    ({resource.resourceType === 'STAFF' ? t('customers.staff') : t('customers.room')})
                                  </Typography>
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.8125rem', color: '#999' }}>
                              {t('customers.unassigned')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`customers.appointmentStatus.${appointment.status.toLowerCase()}`)}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              bgcolor: appointment.status === 'COMPLETED' ? alpha('#10B981', 0.1) :
                                      appointment.status === 'CONFIRMED' ? alpha('#3B82F6', 0.1) :
                                      appointment.status === 'CANCELLED' ? alpha('#EF4444', 0.1) :
                                      alpha('#F59E0B', 0.1),
                              color: appointment.status === 'COMPLETED' ? '#059669' :
                                     appointment.status === 'CONFIRMED' ? '#2563EB' :
                                     appointment.status === 'CANCELLED' ? '#DC2626' :
                                     '#D97706',
                              border: 'none',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                            {formatCurrency(appointment.totalAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {appointment.rating ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                                {appointment.rating}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.8125rem', color: '#999' }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedAppointments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box py={4}>
                            <Typography sx={{ fontSize: '0.875rem', color: '#999' }}>
                              {t('customers.noAppointmentRecords')}
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
                labelRowsPerPage={t('common.rowsPerPage')}
                sx={{
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: '#fafafa',
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={onClose}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#666',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            {t('customers.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

export default AppointmentHistory; 