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
  Container,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { subscriptionApi, SubscriptionPlan, parsePlanFeatures } from '../../services/api';
import LanguageSwitcher from '../common/LanguageSwitcher';

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

const PublicPricing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const plansRes = await subscriptionApi.getAllPlans();

      if (plansRes.success && plansRes.data) {
        // 按价格排序
        const sortedPlans = plansRes.data
          .filter(p => p.isActive)
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        setPlans(sortedPlans);
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

  // 推荐PRO套餐
  const isRecommended = (plan: SubscriptionPlan) => {
    return plan.planCode === 'PRO';
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

  // 点击订阅按钮时跳转到登录页面
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // 保存选择的套餐信息到 localStorage，登录后可以使用
    localStorage.setItem('selectedPlan', JSON.stringify({
      planCode: plan.planCode,
      billingCycle,
    }));
    // 设置登录后跳转到 /plans 页面
    localStorage.setItem('redirectAfterLogin', '/plans');
    // 跳转到登录页面
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={32} sx={{ color: '#1a1a1a' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="lg">
        {/* 顶部区域：Logo + 语言切换 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="/va.png"
              alt="VA"
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
              }}
            />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: '#1a1a1a',
              }}
            >
              {t('nav.title')}
            </Typography>
          </Box>

          {/* 语言切换 */}
          <LanguageSwitcher variant="default" size="medium" />
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* 标题 */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            {t('pricing.title', '选择适合您的套餐')}
          </Typography>
          <Typography sx={{ color: '#666', fontSize: '1rem' }}>
            {t('pricing.subtitle', '开启14天免费试用，无需信用卡')}
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
            const recommended = isRecommended(plan);

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
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                    {getPlanName(plan)}
                  </Typography>

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
                    variant="contained"
                    onClick={() => handleSelectPlan(plan)}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.938rem',
                      fontWeight: 600,
                      mb: 3,
                      bgcolor: '#1a1a1a',
                      color: '#fff',
                      '&:hover': { bgcolor: '#333' },
                    }}
                  >
                    {t('pricing.startFreeTrial', '开始免费试用')}
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

        {/* 底部说明 */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>
            {t('pricing.trialNote', '所有付费套餐均提供14天免费试用期，无需信用卡即可开始。')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicPricing;
