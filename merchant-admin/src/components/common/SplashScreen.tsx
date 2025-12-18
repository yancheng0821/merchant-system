import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';
import {
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  Assessment as AnalyticsIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';

// Logo 入场动画
const logoEnter = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }
  60% {
    opacity: 1;
    transform: scale(1.05) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

// Logo 光晕脉冲
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.12);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.15), 0 8px 40px rgba(0, 0, 0, 0.18);
  }
`;

// 文字淡入上移
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 功能卡片入场
const cardSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

// 图标旋转浮动
const iconFloat = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(5deg);
  }
`;

// 进度条动画
const progressFill = keyframes`
  0% {
    width: 0%;
  }
  20% {
    width: 20%;
  }
  50% {
    width: 60%;
  }
  80% {
    width: 85%;
  }
  100% {
    width: 100%;
  }
`;

// 淡出动画
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    visibility: hidden;
  }
`;

// 背景渐变动画
const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

interface SplashScreenProps {
  onComplete?: () => void;
  minDisplayTime?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDisplayTime = 2500
}) => {
  const { t } = useTranslation();
  const [isHiding, setIsHiding] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // 功能特性列表 - 极简黑白风格
  const features = [
    { icon: CalendarIcon, label: t('splash.feature.schedule', 'Smart Scheduling') },
    { icon: PeopleIcon, label: t('splash.feature.customer', 'Customer Management') },
    { icon: AnalyticsIcon, label: t('splash.feature.analytics', 'Data Analytics') },
    { icon: NotificationIcon, label: t('splash.feature.notification', 'Notifications') },
  ];

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
    }, minDisplayTime);

    const completeTimer = setTimeout(() => {
      setIsHidden(true);
      onComplete?.();
    }, minDisplayTime + 500);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(completeTimer);
    };
  }, [minDisplayTime, onComplete]);

  if (isHidden) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)',
        backgroundSize: '200% 200%',
        animation: isHiding
          ? `${fadeOut} 0.5s ease-out forwards`
          : `${gradientShift} 8s ease infinite`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* 装饰背景圆 */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* 主内容区域 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 3,
          maxWidth: 400,
          width: '100%',
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/va.png"
          alt="VA Merchant"
          sx={{
            width: { xs: 88, sm: 100 },
            height: { xs: 88, sm: 100 },
            borderRadius: 3,
            animation: `${logoEnter} 0.8s ease-out, ${glowPulse} 2s ease-in-out infinite 0.8s`,
          }}
        />

        {/* 品牌名称 */}
        <Typography
          sx={{
            mt: 2,
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '0.02em',
            animation: `${fadeInUp} 0.6s ease-out 0.3s both`,
          }}
        >
          VA Merchant
        </Typography>

        {/* 副标题 */}
        <Typography
          sx={{
            mt: 0.5,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            color: '#64748B',
            animation: `${fadeInUp} 0.6s ease-out 0.5s both`,
          }}
        >
          {t('splash.subtitle', 'Smart Merchant Management')}
        </Typography>

        {/* 功能特性展示 - 极简风格 */}
        <Box
          sx={{
            mt: 4,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            width: '100%',
          }}
        >
          {features.map((feature, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                animation: `${cardSlideIn} 0.5s ease-out ${0.6 + index * 0.1}s both`,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: `${iconFloat} 3s ease-in-out infinite ${index * 0.2}s`,
                }}
              >
                <feature.icon sx={{ fontSize: 18, color: '#1a1a1a' }} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#1a1a1a',
                  lineHeight: 1.3,
                }}
              >
                {feature.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 进度条 - 黑色极简风格 */}
        <Box
          sx={{
            mt: 4,
            width: '60%',
            height: 3,
            borderRadius: 1.5,
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            animation: `${fadeInUp} 0.5s ease-out 1s both`,
          }}
        >
          <Box
            sx={{
              height: '100%',
              borderRadius: 1.5,
              backgroundColor: '#1a1a1a',
              animation: `${progressFill} ${minDisplayTime}ms ease-out forwards`,
            }}
          />
        </Box>

        {/* 加载文字 */}
        <Typography
          sx={{
            mt: 1.5,
            fontSize: '0.75rem',
            color: '#94A3B8',
            animation: `${fadeInUp} 0.5s ease-out 1.1s both`,
          }}
        >
          {t('splash.loading', 'Loading...')}
        </Typography>
      </Box>

      {/* 底部版权信息 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 30, sm: 40 },
          animation: `${fadeInUp} 0.6s ease-out 1.2s both`,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.6875rem',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          Powered by
          <Box
            component="img"
            src="/s-logo.png"
            alt="Swiftmind"
            sx={{
              width: 12,
              height: 12,
              objectFit: 'contain',
              opacity: 0.6,
            }}
          />
          <span style={{ color: '#94A3B8', fontWeight: 500 }}>Swiftmind</span>
        </Typography>
      </Box>
    </Box>
  );
};

export default SplashScreen;
