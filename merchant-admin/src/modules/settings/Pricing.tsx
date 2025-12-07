import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  CircularProgress,
  Alert,
  alpha,
  Chip,
  useMediaQuery,
  useTheme as useMuiTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionApi, stripeSubscriptionApi, authApi, tokenManager, SubscriptionPlan, TenantSubscription, parsePlanFeatures } from '../../services/api';

// 基础功能（所有套餐都有）
const BASE_FEATURES = [
  'appointmentManagement',
  'customerManagement',
  'staffManagement',
  'scheduleCalendar',
  'orderManagement',
  'productServices',
  'notificationLogs',
  'merchantSettings',
];

const Pricing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, subscriptionExpired } = useAuth();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [changingPlan, setChangingPlan] = useState<number | null>(null); // 正在升级的套餐ID
  const [scheduledChanges, setScheduledChanges] = useState<{
    scheduleId?: string;
    pendingPlanCode: string;
    pendingPlanNameEn: string;
    pendingPlanNameZh: string;
    pendingBillingCycle: string;
    effectiveDate: string;
  } | null>(null);

  // 升级确认对话框状态
  const [upgradeConfirmOpen, setUpgradeConfirmOpen] = useState(false);
  const [upgradePreview, setUpgradePreview] = useState<{
    plan: SubscriptionPlan;
    subtotal: number;
    tax: number;
    immediateTotal: number;
    currency: string;
    paymentMethod?: {
      id: string;
      type: string;
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    };
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 降级确认对话框状态
  const [downgradeConfirmOpen, setDowngradeConfirmOpen] = useState(false);
  const [downgradePlan, setDowngradePlan] = useState<SubscriptionPlan | null>(null);

  // 全屏加载状态（正在跳转到 Stripe）
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user?.tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansRes, subRes] = await Promise.all([
        subscriptionApi.getAllPlans(),
        user?.tenantId ? subscriptionApi.getSubscriptions(user.tenantId) : Promise.resolve({ success: true, data: [] }),
      ]);

      if (plansRes.success && plansRes.data) {
        // 按价格排序
        const sortedPlans = plansRes.data
          .filter(p => p.isActive)
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        setPlans(sortedPlans);
      }

      if (subRes.success && subRes.data && subRes.data.length > 0) {
        // 获取最新的订阅（按 ID 倒序，最新的在前）
        const latestSub = subRes.data.sort((a, b) => b.id - a.id)[0];
        setCurrentSubscription(latestSub);
        setBillingCycle(latestSub.billingCycle);

        // 获取计划变更信息（从 Stripe 实时获取）
        if (user?.tenantId) {
          try {
            const changesRes = await stripeSubscriptionApi.getScheduledChanges(user.tenantId);
            if (changesRes.success && changesRes.data) {
              setScheduledChanges(changesRes.data);
            } else {
              setScheduledChanges(null);
            }
          } catch (err) {
            console.error('获取计划变更信息失败:', err);
            setScheduledChanges(null);
          }
        }
      }
    } catch (err) {
      setError(t('pricing.loadError', '加载套餐信息失败'));
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (plan: SubscriptionPlan) => {
    return i18n.language === 'zh-CN' ? plan.planNameZh : plan.planNameEn;
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return currentSubscription?.planId === plan.id;
  };

  // 检查订阅是否过期（综合多个来源判断）
  const isExpiredSubscription = () => {
    // 来自 AuthContext 的 subscriptionExpired 标记（从 JWT token 解析）
    if (subscriptionExpired) return true;
    // 订阅状态为 EXPIRED（不区分大小写）
    const status = currentSubscription?.status?.toUpperCase();
    return status === 'EXPIRED';
  };

  // 检查是否是试用期
  const isTrialSubscription = () => {
    return currentSubscription?.status?.toUpperCase() === 'TRIAL';
  };

  // 检查是否有 pending 计划变更（从 Stripe 实时获取）
  const hasPendingChange = () => {
    return !!scheduledChanges;
  };

  // 判断是否可以更改到该套餐
  // 试用期/过期用户可以订阅任何计划（包括当前计划）
  // 已付费用户可以更改到其他计划，或者切换当前计划的计费周期
  // 如果有 pending 变更，不允许任何操作
  const canChangePlan = (plan: SubscriptionPlan) => {
    // 如果有 pending 变更，禁止所有操作
    if (hasPendingChange()) {
      return false;
    }
    if (isTrialSubscription() || isExpiredSubscription()) {
      return true; // 试用期/过期用户可以订阅任何计划
    }
    // 如果是当前计划，检查计费周期是否不同（��许月付<->年付切换）
    if (isCurrentPlan(plan)) {
      return currentSubscription?.billingCycle !== billingCycle;
    }
    return true; // 可以更改到其他计划
  };

  // 判断是升级还是降级
  // 升级 = 需要即时支付（显示费用预览）
  // 降级 = 下个周期生效（显示降级确认）
  const isUpgrade = (plan: SubscriptionPlan) => {
    if (!currentSubscription) return true;
    const currentPlan = plans.find(p => p.id === currentSubscription.planId);
    if (!currentPlan) return true;

    const isBillingCycleChange = currentSubscription.billingCycle !== billingCycle;
    const isPlanChange = plan.id !== currentPlan.id;
    const isHigherTierPlan = plan.monthlyPrice > currentPlan.monthlyPrice;
    const isMonthlyToYearly = currentSubscription.billingCycle === 'MONTHLY' && billingCycle === 'YEARLY';
    const isYearlyToMonthly = currentSubscription.billingCycle === 'YEARLY' && billingCycle === 'MONTHLY';

    // 情况1: 年付 → 月付（任何计划）：都视为降级
    // 因为年付用户还有剩余周期，不应立即切换到月付，需要等当前年付周期结束
    if (isYearlyToMonthly) {
      return false; // 降级，下个周期生效
    }

    // 情况2: 同一套餐切换计费周期（月付 → 年付）
    if (!isPlanChange && isBillingCycleChange) {
      // 月付 → 年付：升级（需要即时支付年费）
      return isMonthlyToYearly;
    }

    // 情况3: 不同套餐 + 月付 → 年付
    if (isPlanChange && isMonthlyToYearly) {
      return true; // 需要即时支付年费
    }

    // 情况4: 同一计费周期，不同套餐
    // 高级计划：升级，低级计划：降级
    return isHigherTierPlan;
  };

  // 获取当前套餐
  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return plans.find(p => p.id === currentSubscription.planId);
  };

  // 判断是否应该显示推荐标签（比当前套餐高一级的套餐）
  const isRecommended = (plan: SubscriptionPlan) => {
    const current = getCurrentPlan();
    if (!current) {
      // 未订阅时推荐PRO
      return plan.planCode === 'PRO';
    }
    // 已订阅时，推荐比当前高一级的套餐
    const sortedPlans = [...plans].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    const currentIndex = sortedPlans.findIndex(p => p.id === current.id);
    const planIndex = sortedPlans.findIndex(p => p.id === plan.id);
    // 推荐当前套餐的下一级
    return planIndex === currentIndex + 1;
  };

  // 根据套餐数据生成功能列表
  const getPlanFeatures = (plan: SubscriptionPlan, planIndex: number, allPlans: SubscriptionPlan[]) => {
    const features: { key: string; label: string }[] = [];
    const planFeatures = parsePlanFeatures(plan.features);
    const prevPlan = planIndex > 0 ? allPlans[planIndex - 1] : null;
    const prevPlanFeatures = prevPlan ? parsePlanFeatures(prevPlan.features) : null;

    // 配额限制
    const formatLimit = (value: number) => value === -1 ? t('pricing.unlimited') : value.toString();

    // 第一个套餐显示所有限制
    if (planIndex === 0) {
      features.push({ key: 'appointments', label: `${formatLimit(plan.maxAppointmentsPerMonth)} ${t('pricing.features.appointments')}` });
      features.push({ key: 'staff', label: `${formatLimit(plan.maxStaff)} ${t('pricing.features.staff')}` });
      if (planFeatures?.limits.maxEmailsPerMonth) {
        features.push({ key: 'emails', label: `${formatLimit(planFeatures.limits.maxEmailsPerMonth)} ${t('pricing.features.emails')}` });
      }
      // 基础功能
      BASE_FEATURES.forEach(f => {
        features.push({ key: f, label: t(`pricing.features.${f}`) });
      });
    } else {
      // 非第一个套餐，只显示相对于上一级的增量
      // 配额增量
      if (prevPlan && plan.maxAppointmentsPerMonth !== prevPlan.maxAppointmentsPerMonth) {
        features.push({ key: 'appointments', label: `${formatLimit(plan.maxAppointmentsPerMonth)} ${t('pricing.features.appointments')}` });
      }
      if (prevPlan && plan.maxStaff !== prevPlan.maxStaff) {
        features.push({ key: 'staff', label: `${formatLimit(plan.maxStaff)} ${t('pricing.features.staff')}` });
      }
      if (planFeatures?.limits.maxEmailsPerMonth && prevPlanFeatures?.limits.maxEmailsPerMonth !== planFeatures.limits.maxEmailsPerMonth) {
        features.push({ key: 'emails', label: `${formatLimit(planFeatures.limits.maxEmailsPerMonth)} ${t('pricing.features.emails')}` });
      }
      if (planFeatures?.limits.maxSmsPerMonth !== undefined && planFeatures.limits.maxSmsPerMonth !== 0 &&
          (!prevPlanFeatures || prevPlanFeatures.limits.maxSmsPerMonth !== planFeatures.limits.maxSmsPerMonth)) {
        features.push({ key: 'sms', label: `${formatLimit(planFeatures.limits.maxSmsPerMonth)} ${t('pricing.features.sms')}` });
      }

      // 新增功能
      if (planFeatures?.features.onlineBooking && !prevPlanFeatures?.features.onlineBooking) {
        features.push({ key: 'onlineBooking', label: t('pricing.features.onlineBooking') });
      }
      if (planFeatures?.features.smsNotification && !prevPlanFeatures?.features.smsNotification) {
        features.push({ key: 'smsNotifications', label: t('pricing.features.smsNotifications') });
      }
      if (planFeatures?.features.notificationTemplateEdit && !prevPlanFeatures?.features.notificationTemplateEdit) {
        features.push({ key: 'customTemplates', label: t('pricing.features.customTemplates') });
      }
      if (planFeatures?.features.customerImport && !prevPlanFeatures?.features.customerImport) {
        features.push({ key: 'customerImport', label: t('pricing.features.customerImport') });
      }
      if (planFeatures?.modules.marketing && !prevPlanFeatures?.modules.marketing) {
        features.push({ key: 'marketing', label: t('pricing.features.marketing') });
      }
      if (planFeatures?.modules.analytics && !prevPlanFeatures?.modules.analytics) {
        features.push({ key: 'analytics', label: t('pricing.features.analytics') });
      }
      if (planFeatures?.features.auditLog && !prevPlanFeatures?.features.auditLog) {
        features.push({ key: 'auditLog', label: t('pricing.features.auditLog') });
      }
      // 旗舰版优先支持
      if (plan.planCode === 'ELITE') {
        features.push({ key: 'prioritySupport', label: t('pricing.features.prioritySupport') });
      }
    }

    return features;
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!currentSubscription || !user?.tenantId) {
      setError(t('pricing.noSubscription', '未找到订阅信息'));
      return;
    }

    try {
      setChangingPlan(plan.id);
      setError(null);

      // 判断订阅状态
      const isExpiredOrTrial = isTrialSubscription() || isExpiredSubscription();
      const hasActiveStripeSubscription = currentSubscription.stripeSubscriptionId &&
        currentSubscription.status?.toUpperCase() === 'ACTIVE';

      // 试用期/过期用户 或 没有活跃 Stripe 订阅的用户：使用 Hosted Checkout
      if ((isExpiredOrTrial || !hasActiveStripeSubscription) && plan.planCode !== 'FREE') {
        // 使用 Hosted Checkout（跳转到 Stripe 托管页面）
        setRedirecting(true);
        try {
          const successUrl = `${window.location.origin}/settings?tab=billing`;
          const cancelUrl = `${window.location.origin}/plans`;
          const checkoutResponse = await stripeSubscriptionApi.createCheckoutSession(
            user!.tenantId,
            plan.planCode,
            billingCycle,
            successUrl,
            cancelUrl,
            user!.email || ''
          );
          if (checkoutResponse.success && checkoutResponse.data?.url) {
            // 直接跳转到 Stripe
            window.location.href = checkoutResponse.data.url;
          } else {
            setRedirecting(false);
            setError(checkoutResponse.message || t('pricing.checkoutError', '创建支付页面失败'));
          }
        } catch (err: any) {
          setRedirecting(false);
          setError(err.message || t('pricing.checkoutError', '创建支付页面失败'));
        }
        setChangingPlan(null);
        return;
      } else if (hasActiveStripeSubscription && plan.planCode !== 'FREE') {
        // 已有活跃 Stripe 订阅，先获取费用预览再让用户确认
        const planIsUpgrade = isUpgrade(plan);

        if (planIsUpgrade) {
          // 升级需要先预览费用，让用户确认
          setPreviewLoading(true);
          try {
            const previewResponse = await stripeSubscriptionApi.previewSubscriptionUpdate(
              currentSubscription.stripeSubscriptionId!,
              plan.planCode,
              billingCycle
            );

            if (previewResponse.success && previewResponse.data) {
              // 显示确认对话框
              setUpgradePreview({
                plan,
                subtotal: previewResponse.data.subtotal,
                tax: previewResponse.data.tax,
                immediateTotal: previewResponse.data.immediateTotal,
                currency: previewResponse.data.currency,
                paymentMethod: previewResponse.data.paymentMethod,
              });
              setUpgradeConfirmOpen(true);
            } else {
              // 预览失败，回退到 Hosted Checkout
              const errorMsg = previewResponse.message || '';
              if (errorMsg.includes('订阅状态不可用') ||
                  errorMsg.includes('subscription') ||
                  errorMsg.includes('payment source') ||
                  errorMsg.includes('payment method')) {
                console.log('Preview failed, falling back to Hosted Checkout:', errorMsg);
                // 使用 Hosted Checkout 作为回退
                const successUrl = `${window.location.origin}/settings?tab=billing`;
                const cancelUrl = `${window.location.origin}/plans`;
                const checkoutResponse = await stripeSubscriptionApi.createCheckoutSession(
                  user!.tenantId,
                  plan.planCode,
                  billingCycle,
                  successUrl,
                  cancelUrl,
                  user!.email || ''
                );
                if (checkoutResponse.success && checkoutResponse.data?.url) {
                  window.location.href = checkoutResponse.data.url;
                } else {
                  setError(checkoutResponse.message || t('pricing.checkoutError', '创建支付页面失败'));
                }
              } else {
                setError(errorMsg || t('pricing.previewError', '获取升级费用失败'));
              }
            }
          } catch (err: any) {
            console.error('Preview error:', err);
            // 预览失败，回退到 Hosted Checkout
            const successUrl = `${window.location.origin}/settings?tab=billing`;
            const cancelUrl = `${window.location.origin}/plans`;
            try {
              const checkoutResponse = await stripeSubscriptionApi.createCheckoutSession(
                user!.tenantId,
                plan.planCode,
                billingCycle,
                successUrl,
                cancelUrl,
                user!.email || ''
              );
              if (checkoutResponse.success && checkoutResponse.data?.url) {
                window.location.href = checkoutResponse.data.url;
              } else {
                setError(checkoutResponse.message || t('pricing.checkoutError', '创建支付页面失败'));
              }
            } catch (checkoutErr: any) {
              setError(checkoutErr.message || t('pricing.checkoutError', '创建支付页面失败'));
            }
          } finally {
            setPreviewLoading(false);
          }
        } else {
          // 降级需要先确认，告知用户下个周期生效
          setDowngradePlan(plan);
          setDowngradeConfirmOpen(true);
        }
      } else {
        // 使用本地接口（降级到 FREE 或其他情况）
        const response = await subscriptionApi.changePlan(
          currentSubscription.id,
          plan.planCode,
          billingCycle
        );

        if (response.success && response.data) {
          window.dispatchEvent(new CustomEvent('subscription-changed'));
          navigate('/settings?tab=billing');
        } else {
          setError(response.message || t('pricing.upgradeError', '升级失败'));
        }
      }
    } catch (err: any) {
      console.error('升级套餐失败:', err);
      setError(err.message || t('pricing.upgradeError', '升级失败'));
    } finally {
      setChangingPlan(null);
    }
  };

  // 用户确认升级后执行实际升级
  const handleConfirmUpgrade = async () => {
    if (!upgradePreview || !currentSubscription?.stripeSubscriptionId) return;

    setUpgradeConfirmOpen(false);
    setChangingPlan(upgradePreview.plan.id);

    try {
      const response = await stripeSubscriptionApi.updateSubscription(
        currentSubscription.stripeSubscriptionId,
        upgradePreview.plan.planCode,
        billingCycle,
        'always_invoice' // 立即收费
      );

      if (response.success) {
        // 等待 webhook 处理完成
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 刷新 JWT token（获取新的订阅信息）
        try {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            const refreshResponse = await authApi.refreshToken(refreshToken);
            if (refreshResponse.success && refreshResponse.data?.token && refreshResponse.data?.refreshToken) {
              tokenManager.setToken(refreshResponse.data.token);
              tokenManager.setRefreshToken(refreshResponse.data.refreshToken);
              // 更新 localStorage 中的用户信息
              const savedUser = localStorage.getItem('user');
              if (savedUser) {
                const userData = JSON.parse(savedUser);
                userData.planCode = upgradePreview.plan.planCode;
                localStorage.setItem('user', JSON.stringify(userData));
              }
            }
          }
        } catch (err) {
          console.error('Failed to refresh token after upgrade:', err);
        }

        window.dispatchEvent(new CustomEvent('subscription-changed'));
        navigate('/settings?tab=billing');
      } else {
        // 如果失败，回退到 Hosted Checkout
        const errorMsg = response.message || '';
        if (errorMsg.includes('订阅状态不可用') ||
            errorMsg.includes('subscription') ||
            errorMsg.includes('payment source') ||
            errorMsg.includes('payment method') ||
            errorMsg.includes('resource_missing')) {
          console.log('Upgrade failed, falling back to Hosted Checkout:', errorMsg);
          // 使用 Hosted Checkout 作为回退
          const successUrl = `${window.location.origin}/settings?tab=billing`;
          const cancelUrl = `${window.location.origin}/plans`;
          try {
            const checkoutResponse = await stripeSubscriptionApi.createCheckoutSession(
              user!.tenantId,
              upgradePreview.plan.planCode,
              billingCycle,
              successUrl,
              cancelUrl,
              user!.email || ''
            );
            if (checkoutResponse.success && checkoutResponse.data?.url) {
              window.location.href = checkoutResponse.data.url;
            } else {
              setError(checkoutResponse.message || t('pricing.checkoutError', '创建支付页面失败'));
            }
          } catch (checkoutErr: any) {
            setError(checkoutErr.message || t('pricing.checkoutError', '创建支付页面失败'));
          }
        } else {
          setError(errorMsg || t('pricing.upgradeError', '升级失败'));
        }
      }
    } catch (err: any) {
      console.error('升级失败:', err);
      setError(err.message || t('pricing.upgradeError', '升级失败'));
    } finally {
      setChangingPlan(null);
      setUpgradePreview(null);
    }
  };

  // 用户确认降级后执行实际降级（安排降级，不立即生效）
  const handleConfirmDowngrade = async () => {
    if (!downgradePlan || !user?.tenantId) return;

    setDowngradeConfirmOpen(false);
    setChangingPlan(downgradePlan.id);

    try {
      // 使用新的 scheduleDowngrade API，只记录待生效计划，不立即更改
      const response = await stripeSubscriptionApi.scheduleDowngrade(
        user.tenantId,
        downgradePlan.planCode,
        billingCycle
      );

      if (response.success && response.data) {
        window.dispatchEvent(new CustomEvent('subscription-changed'));
        navigate('/settings?tab=billing');
      } else {
        setError(response.message || t('pricing.downgradeError', '降级失败，请稍后重试'));
      }
    } catch (err: any) {
      console.error('降级失败:', err);
      setError(err.message || t('pricing.downgradeError', '降级失败，请稍后重试'));
    } finally {
      setChangingPlan(null);
      setDowngradePlan(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#1a1a1a' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* 标题 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a' }}>
          {t('pricing.title', '选择适合您的套餐')}
        </Typography>
      </Box>

      {/* 计费周期切换 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Box
          sx={{
            display: 'inline-flex',
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            p: 0.5,
          }}
        >
          <Button
            size="small"
            onClick={() => setBillingCycle('MONTHLY')}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: billingCycle === 'MONTHLY' ? '#fff' : 'transparent',
              color: billingCycle === 'MONTHLY' ? '#1a1a1a' : '#666',
              boxShadow: billingCycle === 'MONTHLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                bgcolor: billingCycle === 'MONTHLY' ? '#fff' : alpha('#000', 0.04),
              },
            }}
          >
            {t('pricing.monthly', '月付')}
          </Button>
          <Button
            size="small"
            onClick={() => setBillingCycle('YEARLY')}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: billingCycle === 'YEARLY' ? '#fff' : 'transparent',
              color: billingCycle === 'YEARLY' ? '#1a1a1a' : '#666',
              boxShadow: billingCycle === 'YEARLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              '&:hover': {
                bgcolor: billingCycle === 'YEARLY' ? '#fff' : alpha('#000', 0.04),
              },
            }}
          >
            {t('pricing.yearly', '年付')}
            <Chip
              label={t('pricing.save20', '省20%')}
              size="small"
              sx={{
                ml: 1,
                height: 20,
                fontSize: '0.75rem',
                bgcolor: '#10B981',
                color: '#fff',
              }}
            />
          </Button>
        </Box>
      </Box>

      {/* 有 pending 变更时显示警告 */}
      {hasPendingChange() && scheduledChanges && (
        <Alert
          severity="info"
          sx={{
            maxWidth: 1000,
            mx: 'auto',
            mb: 3,
            borderRadius: 2,
          }}
        >
          {t('pricing.pendingChangeWarning', '您有待生效的计划变更（{{planName}}），将于 {{date}} 生效。如需进行其他变更，请先在账单页面取消当前待生效的变更。', {
            planName: i18n.language === 'zh-CN' ? scheduledChanges.pendingPlanNameZh : scheduledChanges.pendingPlanNameEn,
            date: scheduledChanges.effectiveDate ? new Date(scheduledChanges.effectiveDate).toLocaleDateString() : '',
          })}
        </Alert>
      )}

      {/* 套餐卡片 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 3,
          maxWidth: 1000,
          mx: 'auto',
        }}
      >
        {plans.map((plan, index) => {
          const isCurrent = isCurrentPlan(plan);
          const recommended = isRecommended(plan);
          const canChange = canChangePlan(plan);
          const planIsUpgrade = isUpgrade(plan);

          return (
            <Card
              key={plan.id}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: recommended ? '1.5px solid #9ca3af' : '1px solid #e5e5e5',
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                  borderColor: '#9ca3af',
                },
              }}
            >
              {/* 推荐标签 */}
              {recommended && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#1a1a1a',
                    color: '#fff',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <StarIcon sx={{ fontSize: 14 }} />
                  {t('pricing.recommended', '推荐')}
                </Box>
              )}

              <Box sx={{ p: 3 }}>
                {/* 套餐名称 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {getPlanName(plan)}
                  </Typography>
                  {isCurrent && (
                    <Chip
                      label={t('pricing.current', '当前')}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: '#f5f5f5',
                        color: '#666',
                        border: '1px solid #e0e0e0',
                      }}
                    />
                  )}
                </Box>

                {/* 价格 */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a' }}>
                      ${getPrice(plan)}
                    </Typography>
                    <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>
                      /{billingCycle === 'MONTHLY' ? t('pricing.month', '月') : t('pricing.year', '年')}
                    </Typography>
                  </Box>
                  {plan.monthlyPrice === 0 && (
                    <Typography sx={{ color: '#666', fontSize: '0.813rem', mt: 0.5 }}>
                      {t('pricing.freeForever', '永久免费')} · {t('pricing.coreFeaturesIncluded', '核心功能免费')}
                    </Typography>
                  )}
                </Box>

                {/* 按钮 */}
                <Button
                  fullWidth
                  variant={canChange ? 'contained' : 'outlined'}
                  disabled={!canChange || changingPlan !== null}
                  onClick={() => handleSelectPlan(plan)}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.938rem',
                    fontWeight: 600,
                    mb: 3,
                    ...(canChange
                      ? planIsUpgrade || isTrialSubscription() || isExpiredSubscription()
                        ? {
                            bgcolor: '#1a1a1a',
                            color: '#fff',
                            '&:hover': { bgcolor: '#333' },
                          }
                        : {
                            bgcolor: '#fff',
                            color: '#666',
                            border: '1px solid #d0d0d0',
                            '&:hover': { bgcolor: '#f5f5f5', borderColor: '#bbb' },
                          }
                      : {}),
                    '&.Mui-disabled': {
                      bgcolor: '#f5f5f5',
                      color: '#999',
                      borderColor: '#e5e5e5',
                    },
                  }}
                >
                  {changingPlan === plan.id ? (
                    <CircularProgress size={20} sx={{ color: '#999' }} />
                  ) : isCurrent && !isTrialSubscription() && !isExpiredSubscription() ? (
                    // 当前套餐：检查是否可以切换计费周期
                    currentSubscription?.billingCycle !== billingCycle ? (
                      billingCycle === 'YEARLY' ? t('pricing.switchToYearly', '切换到年付') : t('pricing.switchToMonthly', '切换到月付')
                    ) : (
                      t('pricing.currentPlan')
                    )
                  ) : isTrialSubscription() ? (
                    t('pricing.subscribe')
                  ) : isExpiredSubscription() && isCurrent ? (
                    t('pricing.subscribe')
                  ) : planIsUpgrade ? (
                    t('pricing.upgrade')
                  ) : (
                    t('pricing.downgrade')
                  )}
                </Button>

                {/* 功能列表 */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* 显示包含下级套餐的提示 */}
                  {index > 0 && (
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        mb: 0.5,
                      }}
                    >
                      {index === 1
                        ? t('pricing.allInBasic')
                        : t('pricing.allInPro')}
                    </Typography>
                  )}
                  {/* 显示功能 */}
                  {getPlanFeatures(plan, index, plans).map((feature) => (
                    <Box
                      key={feature.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 16, color: '#10B981' }} />
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          color: '#1a1a1a',
                          flex: 1,
                        }}
                      >
                        {feature.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* 升级确认对话框 */}
      <Dialog
        open={upgradeConfirmOpen}
        onClose={() => {
          setUpgradeConfirmOpen(false);
          setUpgradePreview(null);
          setChangingPlan(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {/* 判断是计费周期切换还是套餐升级 */}
          {upgradePreview && upgradePreview.plan.id === currentSubscription?.planId
            ? (billingCycle === 'YEARLY'
              ? t('pricing.confirmSwitchToYearly', '确认切换到年付')
              : t('pricing.confirmSwitchToMonthly', '确认切换到月付'))
            : t('pricing.confirmUpgrade', '确认升级')}
        </DialogTitle>
        <DialogContent>
          {upgradePreview && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {/* 判断是计费周期切换还是套餐升级 */}
                {upgradePreview.plan.id === currentSubscription?.planId
                  ? (billingCycle === 'YEARLY'
                    ? t('pricing.switchToYearlyDescription', '您将把 {{plan}} 套餐从月付切换到年付', {
                        plan: i18n.language === 'zh-CN' ? upgradePreview.plan.planNameZh : upgradePreview.plan.planNameEn
                      })
                    : t('pricing.switchToMonthlyDescription', '您将把 {{plan}} 套餐从年付切换到月付', {
                        plan: i18n.language === 'zh-CN' ? upgradePreview.plan.planNameZh : upgradePreview.plan.planNameEn
                      }))
                  : t('pricing.upgradeDescription', '您将升级到 {{plan}} 套餐', {
                      plan: i18n.language === 'zh-CN' ? upgradePreview.plan.planNameZh : upgradePreview.plan.planNameEn
                    })}
              </Typography>

              {/* 支付方式 */}
              {upgradePreview.paymentMethod && (
                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('pricing.paymentMethod', '支付方式')}
                    </Typography>
                    <Button
                      size="small"
                      onClick={async () => {
                        if (user?.tenantId) {
                          try {
                            // 跳转到 Stripe Portal 修改支付方式，修改完后会返回到 pricing 页面
                            const returnUrl = `${window.location.origin}/plans`;
                            const res = await stripeSubscriptionApi.createCustomerPortal(
                              user.tenantId,
                              returnUrl
                            );
                            if (res.success && res.data?.portalUrl) {
                              window.location.href = res.data.portalUrl;
                            }
                          } catch (err) {
                            console.error('Failed to open customer portal:', err);
                          }
                        }
                      }}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      {t('pricing.changePaymentMethod', '更换')}
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {upgradePreview.paymentMethod.brand?.toUpperCase() || 'Card'} •••• {upgradePreview.paymentMethod.last4}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {upgradePreview.paymentMethod.expMonth}/{upgradePreview.paymentMethod.expYear}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* 费用明细 */}
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('pricing.chargeBreakdown', '费用明细')}
                </Typography>
                {/* 只有当有税费时才显示 subtotal 和 tax，否则直接显示 total */}
                {upgradePreview.tax > 0 ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{t('pricing.subtotal', '小计')}</Typography>
                      <Typography variant="body2">{upgradePreview.currency?.toUpperCase() === 'CAD' ? 'CA$' : '$'}{(upgradePreview.subtotal / 100).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{t('pricing.tax', '税费')}</Typography>
                      <Typography variant="body2">{upgradePreview.currency?.toUpperCase() === 'CAD' ? 'CA$' : '$'}{(upgradePreview.tax / 100).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{t('pricing.total', '合计')}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {upgradePreview.currency?.toUpperCase() === 'CAD' ? 'CA$' : '$'}{(upgradePreview.immediateTotal / 100).toFixed(2)} {upgradePreview.currency?.toUpperCase()}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{t('pricing.total', '合计')}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {upgradePreview.currency?.toUpperCase() === 'CAD' ? 'CA$' : '$'}{(upgradePreview.immediateTotal / 100).toFixed(2)} {upgradePreview.currency?.toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                {t('pricing.upgradeNote', '升级后将立即生效，费用从您保存的支付方式中扣除')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => {
              setUpgradeConfirmOpen(false);
              setUpgradePreview(null);
              setChangingPlan(null);
            }}
            sx={{ color: '#666' }}
          >
            {t('common.cancel', '取消')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmUpgrade}
            disabled={changingPlan !== null}
            sx={{
              bgcolor: '#1a1a1a',
              '&:hover': { bgcolor: '#333' },
            }}
          >
            {changingPlan ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              t('pricing.confirmPay', '确认支付')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 降级确认对话框 */}
      <Dialog
        open={downgradeConfirmOpen}
        onClose={() => {
          setDowngradeConfirmOpen(false);
          setDowngradePlan(null);
          setChangingPlan(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {/* 判断是计费周期切换还是套餐降级 */}
          {downgradePlan && downgradePlan.id === currentSubscription?.planId
            ? t('pricing.confirmSwitchToMonthly', '确认切换到月付')
            : t('pricing.confirmDowngrade', '确认降级')}
        </DialogTitle>
        <DialogContent>
          {downgradePlan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {/* 判断是计费周期切换还是套餐降级 */}
                {downgradePlan.id === currentSubscription?.planId
                  ? t('pricing.switchToMonthlyDescription', '您将把 {{plan}} 套餐从年付切换到月付', {
                      plan: i18n.language === 'zh-CN' ? downgradePlan.planNameZh : downgradePlan.planNameEn
                    })
                  : t('pricing.downgradeDescription', '您将降级到 {{plan}} 套餐（{{cycle}}）', {
                      plan: i18n.language === 'zh-CN' ? downgradePlan.planNameZh : downgradePlan.planNameEn,
                      cycle: billingCycle === 'MONTHLY' ? t('pricing.monthly', '月付') : t('pricing.yearly', '年付')
                    })}
              </Typography>
              <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {downgradePlan.id === currentSubscription?.planId
                    ? t('pricing.switchToMonthlyEffectNote', '切换将在当前年付周期结束后生效。在此之前，您可以继续使用年付订阅的全部权益。')
                    : t('pricing.downgradeEffectNote', '降级将在当前账单周期结束后生效。在此之前，您可以继续使用当前套餐的全部功能。')}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => {
              setDowngradeConfirmOpen(false);
              setDowngradePlan(null);
              setChangingPlan(null);
            }}
            sx={{ color: '#666' }}
          >
            {t('common.cancel', '取消')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDowngrade}
            disabled={changingPlan !== null}
            sx={{
              bgcolor: '#666',
              '&:hover': { bgcolor: '#555' },
            }}
          >
            {changingPlan ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : downgradePlan && downgradePlan.id === currentSubscription?.planId ? (
              t('pricing.confirmSwitchButton', '确认切换')
            ) : (
              t('pricing.confirmDowngradeButton', '确认降级')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 全屏加载遮罩 - 正在跳转到 Stripe */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
        }}
        open={redirecting}
      >
        <CircularProgress color="inherit" size={48} />
        <Typography variant="h6">
          {t('pricing.redirectingToStripe', '正在跳转到支付页面...')}
        </Typography>
      </Backdrop>
    </Box>
  );
};

export default Pricing;
