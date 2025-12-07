import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  alpha,
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Lock as LockIcon,
  Star as StarIcon,
  RocketLaunch as RocketIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  featureNameKey?: string;
  requiredPlan: 'PRO' | 'ELITE';
  variant?: 'inline' | 'card' | 'overlay' | 'dialog';
  showButton?: boolean;
  onClose?: () => void;
  currentUsage?: number;
  limit?: number;
}

const PLAN_COLORS = {
  PRO: '#8B5CF6',
  ELITE: '#F59E0B',
};

const PLAN_NAMES = {
  PRO: { en: 'Professional', zh: '专业版' },
  ELITE: { en: 'Elite', zh: '旗舰版' },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  featureNameKey,
  requiredPlan,
  variant = 'dialog',
  showButton = true,
  onClose,
  currentUsage,
  limit,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 移动端不显示升级按钮（用户可以在设置中升级）
  const shouldShowButton = showButton && !isMobile;

  const planColor = PLAN_COLORS[requiredPlan];
  const planName = i18n.language === 'zh-CN'
    ? PLAN_NAMES[requiredPlan].zh
    : PLAN_NAMES[requiredPlan].en;

  const handleUpgrade = () => {
    onClose?.();
    navigate('/plans');
  };

  const featureName = featureNameKey ? t(featureNameKey) : feature;

  // Inline variant - 小型提示
  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: alpha(planColor, 0.1),
          color: planColor,
          fontSize: '0.75rem',
        }}
      >
        <LockIcon sx={{ fontSize: 14 }} />
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {planName}
        </Typography>
      </Box>
    );
  }

  // Overlay variant - 覆盖在功能上方
  if (variant === 'overlay') {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha('#fff', 0.9),
          backdropFilter: 'blur(4px)',
          zIndex: 10,
          borderRadius: 'inherit',
        }}
      >
        <LockIcon sx={{ fontSize: 48, color: planColor, mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {t('upgrade.featureLocked', '功能已锁定')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center', px: 2 }}>
          {t('upgrade.upgradeToUnlock', { feature: featureName, plan: planName })}
        </Typography>
        {shouldShowButton && (
          <Button
            variant="contained"
            startIcon={<RocketIcon />}
            onClick={handleUpgrade}
            sx={{
              bgcolor: planColor,
              '&:hover': { bgcolor: alpha(planColor, 0.9) },
            }}
          >
            {t('upgrade.upgradeTo', { plan: planName })}
          </Button>
        )}
      </Box>
    );
  }

  // Card variant - 简约卡片风格
  if (variant === 'card') {
    const hasUsageInfo = currentUsage !== undefined && limit !== undefined;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
          px: 3,
          position: 'relative',
        }}
      >
        {/* 移动端关闭按钮 */}
        {isMobile && onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#999',
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}

        {/* 锁定图标 - 仅功能锁定时显示 */}
        {!hasUsageInfo && (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <LockIcon sx={{ fontSize: 28, color: '#666' }} />
          </Box>
        )}

        {/* 用量数字 */}
        {hasUsageInfo && (
          <Typography
            sx={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
              letterSpacing: '-0.02em',
            }}
          >
            {currentUsage}/{limit}
          </Typography>
        )}

        {/* 标题 */}
        <Typography
          sx={{
            fontSize: hasUsageInfo ? '0.9rem' : '1.1rem',
            fontWeight: hasUsageInfo ? 500 : 600,
            color: hasUsageInfo ? '#666' : '#1a1a1a',
            mb: 1,
          }}
        >
          {hasUsageInfo
            ? t('upgrade.limitReached', '已达上限')
            : t('upgrade.featureLocked', '功能已锁定')}
        </Typography>

        {/* 描述文字 */}
        <Typography
          variant="body2"
          sx={{
            color: '#666',
            mb: shouldShowButton ? 2.5 : 0,
            lineHeight: 1.6,
            maxWidth: 280,
          }}
        >
          {hasUsageInfo
            ? t('upgrade.limitReachedDesc', {
                feature: featureName,
                plan: planName,
                defaultValue: `您已达到当前套餐的${featureName}上限。升级到${planName}获取更高限额。`,
              })
            : t('upgrade.featureRequiresPlanSimple', {
                feature: featureName,
                plan: planName,
                defaultValue: `「${featureName}」需要${planName}才能使用`,
              })}
        </Typography>

        {/* 升级按钮 - 移动端不显示 */}
        {shouldShowButton && (
          <Button
            variant="contained"
            onClick={handleUpgrade}
            sx={{
              bgcolor: '#1a1a1a',
              color: '#fff',
              borderRadius: 1.5,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#333',
                boxShadow: 'none',
              },
            }}
          >
            {t('upgrade.upgradeTo', { plan: planName, defaultValue: `升级到${planName}` })}
          </Button>
        )}
      </Box>
    );
  }

  // Dialog variant - 极简弹框样式 (默认)
  const hasUsageInfo = currentUsage !== undefined && limit !== undefined;

  return (
    <Box sx={{ p: 2.5, position: 'relative' }}>
      {/* 移动端关闭按钮 */}
      {isMobile && onClose && (
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#999',
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}

      {/* 用量数字 - 仅在有用量信息时显示 */}
      {hasUsageInfo && (
        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1a1a1a',
            mb: 0.5,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          {currentUsage}/{limit}
        </Typography>
      )}

      {/* 标题区域 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: hasUsageInfo ? 'center' : 'flex-start', gap: 1, mb: 1.5 }}>
        {!hasUsageInfo && <LockIcon sx={{ fontSize: 18, color: '#1a1a1a' }} />}
        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
          {hasUsageInfo
            ? t('upgrade.limitReached', '已达上限')
            : t('upgrade.featureLockedTitle', '升级解锁')}
        </Typography>
      </Box>

      {/* 描述 */}
      <Typography variant="body2" sx={{ color: '#666', mb: shouldShowButton ? 2.5 : 0, lineHeight: 1.6, textAlign: hasUsageInfo ? 'center' : 'left' }}>
        {hasUsageInfo
          ? t('upgrade.limitReachedDesc', {
              feature: featureName,
              plan: planName,
              defaultValue: `您已达到当前套餐的${featureName}上限。升级到${planName}获取更高限额。`,
            })
          : t('upgrade.featureRequiresPlanSimple', {
              feature: featureName,
              plan: planName,
              defaultValue: `「${featureName}」需要${planName}才能使用。升级后即可立即使用此功能。`,
            })}
      </Typography>

      {/* 按钮区域 - 移动端不显示 */}
      {shouldShowButton && (
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: hasUsageInfo ? 'center' : 'flex-end' }}>
          {onClose && (
            <Button
              size="small"
              onClick={onClose}
              sx={{
                borderRadius: 1.5,
                px: 2,
                color: '#666',
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  bgcolor: alpha('#000', 0.04),
                },
              }}
            >
              {t('common.cancel', '取消')}
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            onClick={handleUpgrade}
            sx={{
              borderRadius: 1.5,
              px: 2,
              bgcolor: '#1a1a1a',
              textTransform: 'none',
              fontSize: '0.875rem',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#333',
                boxShadow: 'none',
              },
            }}
          >
            {t('upgrade.viewPlans', '查看套餐')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

// 功能锁定包装组件
interface FeatureLockProps {
  feature: string;
  featureNameKey?: string;
  requiredPlan: 'PRO' | 'ELITE';
  isLocked: boolean;
  children: React.ReactNode;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  feature,
  featureNameKey,
  requiredPlan,
  isLocked,
  children,
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ opacity: 0.3, pointerEvents: 'none' }}>
        {children}
      </Box>
      <UpgradePrompt
        feature={feature}
        featureNameKey={featureNameKey}
        requiredPlan={requiredPlan}
        variant="overlay"
      />
    </Box>
  );
};

export default UpgradePrompt;
