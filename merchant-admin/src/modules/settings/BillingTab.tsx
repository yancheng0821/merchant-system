import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Chip,
  useMediaQuery,
  useTheme as useMuiTheme,
  Backdrop,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar, SnackbarKey } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { useRef } from 'react';
import { subscriptionApi, stripeSubscriptionApi, usageStatsApi, resourceApi, TenantSubscription, TenantUsageStats, parsePlanFeatures } from '../../services/api';
import { Capacitor } from '@capacitor/core';
// 注：invoiceApi 已移除，账单由 Stripe 自动管理，用户通过 Customer Portal 查看

// 检测是否是原生平台（用于隐藏支付相关按钮以符合应用商店审核要求）
const isNativeApp = Capacitor.isNativePlatform();

const BillingTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshSubscriptionStatus } = useAuth();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // 用于防止重复触发订阅状态检查
  const hasTriggeredRefresh = useRef(false);

  // 统一的 snackbar 显示函数
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    enqueueSnackbar(message, {
      variant: severity,
      autoHideDuration: 3000,
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      content: (key: SnackbarKey) => (
        <Alert
          severity={severity}
          onClose={() => closeSnackbar(key)}
          sx={{
            width: '100%',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {message}
        </Alert>
      ),
    });
  };
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [usageStats, setUsageStats] = useState<TenantUsageStats | null>(null);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancellingChange, setCancellingChange] = useState(false);

  // 从 Stripe Subscription Schedule 获取的待生效变更信息
  const [scheduledChanges, setScheduledChanges] = useState<{
    pendingPlanCode: string;
    pendingPlanNameEn: string;
    pendingPlanNameZh: string;
    pendingBillingCycle: string;
    effectiveDate: string;
  } | null>(null);

  // 从 Stripe 获取的订阅取消状态
  const [cancellationStatus, setCancellationStatus] = useState<{
    cancelAtPeriodEnd: boolean;
    cancelAt: string;
  } | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      fetchSubscription();
      fetchStaffCount();
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (user?.tenantId && selectedMonth) {
      fetchUsageStats(selectedMonth);
    }
  }, [user?.tenantId, selectedMonth]);

  const fetchStaffCount = async () => {
    try {
      const response = await resourceApi.getStaffCount(user!.tenantId);
      setStaffCount(response.staffCount || 0);
    } catch (err: any) {
      console.error('获取员工数量失败:', err);
    }
  };

  const fetchUsageStats = async (month: string) => {
    try {
      const response = await usageStatsApi.getStatsByMonth(user!.tenantId, month);
      if (response.success && response.data) {
        setUsageStats(response.data);
      }
    } catch (err: any) {
      console.error('获取使用量统计失败:', err);
    }
  };

  // 获取当前月份
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // 切换月份
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const currentMonth = getCurrentMonth();
    if (selectedMonth >= currentMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // 格式化月份显示
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    if (i18n.language === 'zh-CN') {
      return `${year}年${parseInt(month)}月`;
    }
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionApi.getActiveSubscription(user!.tenantId);
      if (response.success && response.data) {
        setSubscription(response.data);

        // 如果有 Stripe 订阅，获取已安排的变更信息和取消状态
        if (response.data.stripeSubscriptionId) {
          fetchScheduledChanges();
          fetchCancellationStatus();
        }
      } else {
        // 没有获取到订阅数据，可能是后端状态已变更（如 PAST_DUE）
        // 主动触发一次订阅状态检查，让前端同步最新状态
        if (!hasTriggeredRefresh.current) {
          hasTriggeredRefresh.current = true;
          console.log('[BillingTab] No subscription data, triggering subscription status refresh');
          refreshSubscriptionStatus();
        }
      }
    } catch (err: any) {
      console.error('获取订阅信息失败:', err);
      setError(err.message || '获取订阅信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledChanges = async () => {
    try {
      const response = await stripeSubscriptionApi.getScheduledChanges(user!.tenantId);
      if (response.success && response.data) {
        setScheduledChanges(response.data);
      } else {
        setScheduledChanges(null);
      }
    } catch (err) {
      console.error('获取计划变更信息失败:', err);
      setScheduledChanges(null);
    }
  };

  const fetchCancellationStatus = async () => {
    try {
      const response = await stripeSubscriptionApi.getCancellationStatus(user!.tenantId);
      if (response.success && response.data) {
        setCancellationStatus(response.data);
      } else {
        setCancellationStatus(null);
      }
    } catch (err) {
      console.error('获取取消状态失败:', err);
      setCancellationStatus(null);
    }
  };

  const handleCancelScheduledChange = async () => {
    if (!user?.tenantId) return;

    try {
      setCancellingChange(true);
      const response = await stripeSubscriptionApi.cancelScheduledDowngrade(user.tenantId);
      if (response.success) {
        showSnackbar(t('billing.cancelScheduledChangeSuccess', '已取消待生效的变更'), 'success');
        setScheduledChanges(null);
        // 刷新数据
        fetchSubscription();
      } else {
        showSnackbar(response.message || t('billing.cancelScheduledChangeError', '取消失败，请稍后重试'), 'error');
      }
    } catch (err: any) {
      console.error('取消计划变更失败:', err);
      showSnackbar(err.message || t('billing.cancelScheduledChangeError', '取消失败，请稍后重试'), 'error');
    } finally {
      setCancellingChange(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!user?.tenantId) return;

    try {
      setOpeningPortal(true);
      const returnUrl = `${window.location.origin}/settings?tab=billing`;
      const response = await stripeSubscriptionApi.createCustomerPortal(user.tenantId, returnUrl);

      if (response.success && response.data?.portalUrl) {
        window.location.href = response.data.portalUrl;
      } else {
        setOpeningPortal(false);
        showSnackbar(response.message || t('billing.portalError', '无法打开账单管理'), 'error');
      }
    } catch (err: any) {
      setOpeningPortal(false);
      console.error('打开 Customer Portal 失败:', err);
      showSnackbar(err.message || t('billing.portalError', '无法打开账单管理'), 'error');
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return { bgcolor: '#3B82F6', color: '#FFFFFF', border: '1px solid #2563EB' };
      case 'ACTIVE':
        return { bgcolor: '#10B981', color: '#FFFFFF', border: '1px solid #059669' };
      case 'PAST_DUE':
        return { bgcolor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'CANCELLED':
      case 'EXPIRED':
        return { bgcolor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
      default:
        return { bgcolor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
    }
  };

  const getSubscriptionStatusText = (status: string) => {
    return t(`subscription.status.${status.toLowerCase()}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={isMobile ? 2 : 4}>
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      {/* 订阅计划信息卡片 */}
      {subscription && subscription.plan && (
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              {isMobile ? (
                // 移动端布局
                <Box>
                  {/* 顶部：计划名称 + 状态 */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                      {i18n.language === 'zh-CN' ? subscription.plan.planNameZh : subscription.plan.planNameEn}
                    </Typography>
                    <Chip
                      label={getSubscriptionStatusText(subscription.status)}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        height: 20,
                        fontSize: '0.65rem',
                        ...getSubscriptionStatusColor(subscription.status)
                      }}
                    />
                  </Box>

                  {/* 日期 */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {subscription.status === 'TRIAL' && subscription.trialEndDate
                      ? `${t('billing.trialPeriod')} · ${t('billing.endsOn')} ${subscription.trialEndDate}`
                      : `${subscription.currentPeriodStart} ~ ${subscription.currentPeriodEnd}`}
                  </Typography>

                  {/* 待生效降级/计费周期切换提示 (从 Stripe Schedule 读取) */}
                  {scheduledChanges && (
                    <Box
                      sx={{
                        p: 1,
                        mb: 1.5,
                        borderRadius: 1,
                        bgcolor: '#FEF3C7',
                        border: '1px solid #FDE68A',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#92400E', flex: 1 }}>
                          {scheduledChanges.pendingPlanCode === subscription.plan?.planCode
                            ? t('billing.pendingBillingCycleSwitch', {
                                billingCycle: scheduledChanges.pendingBillingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly'),
                                date: scheduledChanges.effectiveDate,
                              })
                            : t('billing.pendingDowngrade', {
                                planName: i18n.language === 'zh-CN' ? scheduledChanges.pendingPlanNameZh : scheduledChanges.pendingPlanNameEn,
                                billingCycle: scheduledChanges.pendingBillingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly'),
                                date: scheduledChanges.effectiveDate,
                              })}
                        </Typography>
                        {/* 原生 App 中隐藏取消变更按钮 */}
                        {!isNativeApp && (
                          <Button
                            size="small"
                            onClick={handleCancelScheduledChange}
                            disabled={cancellingChange}
                            sx={{
                              ml: 1,
                              minWidth: 'auto',
                              px: 1,
                              py: 0.25,
                              fontSize: '0.65rem',
                              color: '#92400E',
                              borderColor: '#92400E',
                              '&:hover': {
                                bgcolor: 'rgba(146, 64, 14, 0.08)',
                                borderColor: '#92400E',
                              },
                            }}
                            variant="outlined"
                          >
                            {cancellingChange ? (
                              <CircularProgress size={12} sx={{ color: '#92400E' }} />
                            ) : (
                              t('billing.cancelScheduledChange', '取消变更')
                            )}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* 订阅取消预告提示 (从 Stripe 读取) */}
                  {cancellationStatus && cancellationStatus.cancelAtPeriodEnd && (
                    <Box
                      sx={{
                        p: 1,
                        mb: 1.5,
                        borderRadius: 1,
                        bgcolor: '#FEE2E2',
                        border: '1px solid #FECACA',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.7rem', color: '#991B1B' }}>
                        {t('billing.subscriptionCancelling', {
                          date: cancellationStatus.cancelAt,
                          defaultValue: '订阅将于 {{date}} 取消',
                        })}
                      </Typography>
                    </Box>
                  )}

                  {/* 配额信息 - 网格布局 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{t('billing.maxUsers')}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.plan.maxUsers === -1 ? t('billing.unlimited') : subscription.plan.maxUsers}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{t('billing.maxStaff')}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.plan.maxStaff === -1 ? t('billing.unlimited') : subscription.plan.maxStaff}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{t('billing.maxAppointments')}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.plan.maxAppointmentsPerMonth === -1
                          ? t('billing.unlimited')
                          : `${subscription.plan.maxAppointmentsPerMonth}/${t('billing.month')}`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{t('billing.billingCycle')}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.billingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly')}
                      </Typography>
                    </Box>
                    {(() => {
                      const planFeatures = parsePlanFeatures(subscription.plan.features);
                      if (!planFeatures) return null;
                      return (
                        <>
                          <Box>
                            <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{t('billing.maxEmails')}</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                              {planFeatures.limits.maxEmailsPerMonth === -1
                                ? t('billing.unlimited')
                                : `${planFeatures.limits.maxEmailsPerMonth}/${t('billing.month')}`}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{t('billing.maxSms')}</Typography>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                              {planFeatures.limits.maxSmsPerMonth === -1
                                ? t('billing.unlimited')
                                : planFeatures.limits.maxSmsPerMonth === 0
                                ? t('billing.notIncluded')
                                : `${planFeatures.limits.maxSmsPerMonth}/${t('billing.month')}`}
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>

                </Box>
              ) : (
                // 桌面端布局 - 两行
                <Box>
                  {/* 第一行：计划名称、状态、日期 + 操作按钮 */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                        {i18n.language === 'zh-CN' ? subscription.plan.planNameZh : subscription.plan.planNameEn}
                      </Typography>
                      <Chip
                        label={getSubscriptionStatusText(subscription.status)}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          height: 20,
                          fontSize: '0.7rem',
                          ...getSubscriptionStatusColor(subscription.status)
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {subscription.status === 'TRIAL' && subscription.trialEndDate
                          ? `${t('billing.trialPeriod')} · ${t('billing.endsOn')} ${subscription.trialEndDate}`
                          : `${subscription.currentPeriodStart} ~ ${subscription.currentPeriodEnd}`}
                      </Typography>
                      {/* 待生效降级/计费周期切换提示 (从 Stripe Schedule 读取) */}
                      {scheduledChanges && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={
                              scheduledChanges.pendingPlanCode === subscription.plan?.planCode
                                ? t('billing.pendingBillingCycleSwitch', {
                                    billingCycle: scheduledChanges.pendingBillingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly'),
                                    date: scheduledChanges.effectiveDate,
                                  })
                                : t('billing.pendingDowngrade', {
                                    planName: i18n.language === 'zh-CN' ? scheduledChanges.pendingPlanNameZh : scheduledChanges.pendingPlanNameEn,
                                    billingCycle: scheduledChanges.pendingBillingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly'),
                                    date: scheduledChanges.effectiveDate,
                                  })
                            }
                            size="small"
                            sx={{
                              fontWeight: 500,
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                            }}
                          />
                          {/* 原生 App 中隐藏取消变更按钮 */}
                          {!isNativeApp && (
                            <Button
                              size="small"
                              onClick={handleCancelScheduledChange}
                              disabled={cancellingChange}
                              sx={{
                                minWidth: 'auto',
                                px: 1,
                                py: 0.25,
                                fontSize: '0.7rem',
                                color: '#92400E',
                                borderColor: '#92400E',
                                '&:hover': {
                                  bgcolor: 'rgba(146, 64, 14, 0.08)',
                                  borderColor: '#92400E',
                                },
                              }}
                              variant="outlined"
                            >
                              {cancellingChange ? (
                                <CircularProgress size={12} sx={{ color: '#92400E' }} />
                              ) : (
                                t('billing.cancelScheduledChange', '取消变更')
                              )}
                            </Button>
                          )}
                        </Box>
                      )}
                      {/* 订阅取消预告提示 (从 Stripe 读取) */}
                      {cancellationStatus && cancellationStatus.cancelAtPeriodEnd && (
                        <Chip
                          label={t('billing.subscriptionCancelling', {
                            date: cancellationStatus.cancelAt,
                            defaultValue: '订阅将于 {{date}} 取消',
                          })}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            height: 22,
                            fontSize: '0.7rem',
                            bgcolor: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                          }}
                        />
                      )}
                    </Box>
                    {/* 操作按钮 - 原生 App 中隐藏（符合应用商店审核要求） */}
                    {!isNativeApp && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={subscription.stripeSubscriptionId ? handleOpenCustomerPortal : () => {
                            showSnackbar(t('billing.subscribeFirst'), 'info');
                          }}
                          disabled={openingPortal}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#666',
                            borderColor: '#D1D5DB',
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#9CA3AF',
                            },
                          }}
                        >
                          {openingPortal ? t('common.loading') : t('billing.manageBilling', '管理账单')}
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => navigate('/plans')}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#666',
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              color: '#1a1a1a',
                            },
                          }}
                        >
                          {subscription.status === 'TRIAL'
                            ? t('billing.subscribe')
                            : t('billing.upgradePlan')}
                          <ArrowForwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* 第二行：配额信息 - 网格布局 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mb: 0.25 }}>
                        {t('billing.maxUsers')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.plan.maxUsers === -1 ? t('billing.unlimited') : subscription.plan.maxUsers}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mb: 0.25 }}>
                        {t('billing.maxStaff')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.plan.maxStaff === -1 ? t('billing.unlimited') : subscription.plan.maxStaff}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mb: 0.25 }}>
                        {t('billing.maxAppointments')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.plan.maxAppointmentsPerMonth === -1
                          ? t('billing.unlimited')
                          : `${subscription.plan.maxAppointmentsPerMonth}/${t('billing.month')}`}
                      </Typography>
                    </Box>

                    {(() => {
                      const planFeatures = parsePlanFeatures(subscription.plan.features);
                      if (!planFeatures) return null;
                      return (
                        <>
                          <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mb: 0.25 }}>
                              {t('billing.maxEmails')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                              {planFeatures.limits.maxEmailsPerMonth === -1
                                ? t('billing.unlimited')
                                : `${planFeatures.limits.maxEmailsPerMonth}/${t('billing.month')}`}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mb: 0.25 }}>
                              {t('billing.maxSms')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                              {planFeatures.limits.maxSmsPerMonth === -1
                                ? t('billing.unlimited')
                                : planFeatures.limits.maxSmsPerMonth === 0
                                ? t('billing.notIncluded')
                                : `${planFeatures.limits.maxSmsPerMonth}/${t('billing.month')}`}
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}

                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280', mb: 0.25 }}>
                        {t('billing.billingCycle')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                        {subscription.billingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* 本月用量统计卡片 */}
      {subscription && subscription.plan && usageStats && (
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isMobile ? 1.5 : 2 }}>
                <Typography
                  sx={{
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  {t('billing.usageStats.title', '本月用量')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={handlePrevMonth}
                    sx={{ p: 0.25, color: '#6B7280' }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6B7280',
                      minWidth: isMobile ? 65 : 75,
                      textAlign: 'center',
                    }}
                  >
                    {formatMonth(selectedMonth)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleNextMonth}
                    disabled={selectedMonth >= getCurrentMonth()}
                    sx={{ p: 0.25, color: selectedMonth >= getCurrentMonth() ? '#D1D5DB' : '#6B7280' }}
                  >
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 1.5 : 2 }}>
                {/* 预约用量 */}
                {(() => {
                  const planFeatures = parsePlanFeatures(subscription.plan.features);
                  const maxAppointments = subscription.plan.maxAppointmentsPerMonth;
                  const currentAppointments = usageStats.appointmentCount || 0;
                  const isUnlimited = maxAppointments === -1;
                  const percentage = isUnlimited ? 0 : Math.min((currentAppointments / maxAppointments) * 100, 100);
                  const isNearLimit = !isUnlimited && percentage >= 80;

                  return (
                    <Box sx={{ p: isMobile ? 1.25 : 1.5, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                      <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#6B7280', mb: 0.5 }}>
                        {t('billing.usageStats.appointments', '预约')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography sx={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, color: isNearLimit ? '#DC2626' : '#111827' }}>
                          {currentAppointments}
                        </Typography>
                        <Typography sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 400, color: '#9CA3AF' }}>
                          / {isUnlimited ? t('billing.unlimited') : maxAppointments}
                        </Typography>
                      </Box>
                      {!isUnlimited && (
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            mt: 1,
                            height: 3,
                            borderRadius: 1.5,
                            bgcolor: '#e5e5e5',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1.5,
                              bgcolor: isNearLimit ? '#DC2626' : '#1a1a1a',
                            },
                          }}
                        />
                      )}
                    </Box>
                  );
                })()}

                {/* 邮件用量 */}
                {(() => {
                  const planFeatures = parsePlanFeatures(subscription.plan.features);
                  const maxEmails = planFeatures?.limits.maxEmailsPerMonth ?? 0;
                  const currentEmails = usageStats.emailCount || 0;
                  const isUnlimited = maxEmails === -1;
                  const percentage = isUnlimited ? 0 : Math.min((currentEmails / maxEmails) * 100, 100);
                  const isNearLimit = !isUnlimited && percentage >= 80;

                  return (
                    <Box sx={{ p: isMobile ? 1.25 : 1.5, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                      <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#6B7280', mb: 0.5 }}>
                        {t('billing.usageStats.emails', '邮件')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography sx={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, color: isNearLimit ? '#DC2626' : '#111827' }}>
                          {currentEmails}
                        </Typography>
                        <Typography sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 400, color: '#9CA3AF' }}>
                          / {isUnlimited ? t('billing.unlimited') : maxEmails}
                        </Typography>
                      </Box>
                      {!isUnlimited && (
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            mt: 1,
                            height: 3,
                            borderRadius: 1.5,
                            bgcolor: '#e5e5e5',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1.5,
                              bgcolor: isNearLimit ? '#DC2626' : '#1a1a1a',
                            },
                          }}
                        />
                      )}
                    </Box>
                  );
                })()}

                {/* 短信用量 */}
                {(() => {
                  const planFeatures = parsePlanFeatures(subscription.plan.features);
                  const maxSms = planFeatures?.limits.maxSmsPerMonth ?? 0;
                  const currentSms = usageStats.smsCount || 0;
                  const isUnlimited = maxSms === -1;
                  const notIncluded = maxSms === 0;
                  const percentage = isUnlimited || notIncluded ? 0 : Math.min((currentSms / maxSms) * 100, 100);
                  const isNearLimit = !isUnlimited && !notIncluded && percentage >= 80;

                  return (
                    <Box sx={{ p: isMobile ? 1.25 : 1.5, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                      <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#6B7280', mb: 0.5 }}>
                        {t('billing.usageStats.sms', '短信')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography sx={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, color: isNearLimit ? '#DC2626' : notIncluded ? '#D1D5DB' : '#111827' }}>
                          {notIncluded ? '-' : currentSms}
                        </Typography>
                        <Typography sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 400, color: '#9CA3AF' }}>
                          {notIncluded ? t('billing.notIncluded') : `/ ${isUnlimited ? t('billing.unlimited') : maxSms}`}
                        </Typography>
                      </Box>
                      {!isUnlimited && !notIncluded && (
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            mt: 1,
                            height: 3,
                            borderRadius: 1.5,
                            bgcolor: '#e5e5e5',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1.5,
                              bgcolor: isNearLimit ? '#DC2626' : '#1a1a1a',
                            },
                          }}
                        />
                      )}
                    </Box>
                  );
                })()}

                {/* 员工数量 - 使用实时数据 */}
                {(() => {
                  const maxStaff = subscription.plan.maxStaff;
                  const currentStaff = staffCount;
                  const isUnlimited = maxStaff === -1;
                  const percentage = isUnlimited ? 0 : Math.min((currentStaff / maxStaff) * 100, 100);
                  const isNearLimit = !isUnlimited && percentage >= 80;

                  return (
                    <Box sx={{ p: isMobile ? 1.25 : 1.5, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                      <Typography sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#6B7280', mb: 0.5 }}>
                        {t('billing.usageStats.staff', '员工')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                        <Typography sx={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, color: isNearLimit ? '#DC2626' : '#111827' }}>
                          {currentStaff}
                        </Typography>
                        <Typography sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 400, color: '#9CA3AF' }}>
                          / {isUnlimited ? t('billing.unlimited') : maxStaff}
                        </Typography>
                      </Box>
                      {!isUnlimited && (
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            mt: 1,
                            height: 3,
                            borderRadius: 1.5,
                            bgcolor: '#e5e5e5',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1.5,
                              bgcolor: isNearLimit ? '#DC2626' : '#1a1a1a',
                            },
                          }}
                        />
                      )}
                    </Box>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* 全屏加载遮罩 - 正在跳转到 Stripe */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
        }}
        open={openingPortal}
      >
        <CircularProgress color="inherit" size={48} />
        <Typography variant="h6">
          {t('billing.redirectingToStripe', '正在跳转到账单管理...')}
        </Typography>
      </Backdrop>
    </Grid>
  );
};

export default BillingTab;
