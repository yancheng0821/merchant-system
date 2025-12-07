import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Backdrop, Alert } from '@mui/material';
import { ErrorOutline as ErrorIcon, CreditCard as CreditCardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { stripeSubscriptionApi } from '../services/api';
import { Capacitor } from '@capacitor/core';

// 检测是否是原生平台（用于隐藏支付相关按钮以符合应用商店审核要求）
const isNativeApp = Capacitor.isNativePlatform();

/**
 * 订阅过期提示页面
 * 黑色极简风格
 *
 * 区分两种情况：
 * 1. PAST_DUE: 付款失败，引导用户去 Customer Portal 更新支付方式
 * 2. 其他过期状态: 引导用户去 Pricing 页面续费
 */
const SubscriptionExpiredPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // 直接使用用户对象中的订阅状态，不需要额外 API 调用
  const isPastDue = user?.subscriptionStatus === 'PAST_DUE';

  console.log('[SubscriptionExpiredPage] user.subscriptionStatus:', user?.subscriptionStatus, 'isPastDue:', isPastDue);

  const handleGoToPricing = () => {
    navigate('/plans');
  };

  const handleOpenCustomerPortal = async () => {
    if (!user?.tenantId) return;

    try {
      setOpeningPortal(true);
      const returnUrl = `${window.location.origin}/subscription-expired`;
      console.log('Creating Customer Portal for tenant:', user.tenantId, 'returnUrl:', returnUrl);
      const response = await stripeSubscriptionApi.createCustomerPortal(user.tenantId, returnUrl);
      console.log('Customer Portal response:', response);

      if (response.success && response.data?.portalUrl) {
        console.log('Redirecting to Customer Portal:', response.data.portalUrl);
        window.location.href = response.data.portalUrl;
      } else {
        console.error('Customer Portal 创建失败:', response.message);
        setOpeningPortal(false);
        setPortalError(response.message || '无法打开账单管理，请稍后重试');
      }
    } catch (err: any) {
      console.error('打开 Customer Portal 失败:', err);
      setOpeningPortal(false);
      setPortalError(err.message || '无法打开账单管理，请稍后重试');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 340,
          width: '100%',
          bgcolor: '#fff',
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            bgcolor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          {isPastDue ? (
            <CreditCardIcon sx={{ fontSize: 24, color: '#1a1a1a' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 24, color: '#1a1a1a' }} />
          )}
        </Box>

        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a', mb: 1 }}>
          {isPastDue
            ? t('subscription.pastDue.title', '付款失败')
            : t('subscription.expired.title', '订阅已过期')}
        </Typography>

        <Typography sx={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.5, mb: 3 }}>
          {isPastDue
            ? t('subscription.pastDue.description', '您的付款未能成功处理，请更新支付方式以恢复服务。')
            : t('subscription.expired.description', '您的订阅已过期，请续费以恢复完整功能访问。')}
        </Typography>

        {/* 原生 App 中不显示支付相关按钮（符合应用商店审核要求） */}
        {!isNativeApp && (
          isPastDue ? (
            <>
              <Button
                fullWidth
                variant="contained"
                onClick={handleOpenCustomerPortal}
                disabled={openingPortal}
                sx={{
                  py: 1.25,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  bgcolor: '#1a1a1a',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#333',
                    boxShadow: 'none',
                  },
                }}
              >
                {openingPortal
                  ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                  : t('subscription.pastDue.updatePayment', '更新支付方式')}
              </Button>
              {portalError && (
                <Alert severity="error" sx={{ mt: 2, fontSize: '0.75rem' }}>
                  {portalError}
                </Alert>
              )}
            </>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={handleGoToPricing}
              sx={{
                py: 1.25,
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                bgcolor: '#1a1a1a',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#333',
                  boxShadow: 'none',
                },
              }}
            >
              {t('subscription.expired.renewNow', '立即续费')}
            </Button>
          )
        )}

        {/* 原生 App 中显示提示文字 */}
        {isNativeApp && (
          <Typography sx={{ color: '#666', fontSize: '0.8rem', mt: 1 }}>
            {t('subscription.manageOnWeb', '请在网页端管理您的订阅')}
          </Typography>
        )}
      </Box>

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
    </Box>
  );
};

export default SubscriptionExpiredPage;
