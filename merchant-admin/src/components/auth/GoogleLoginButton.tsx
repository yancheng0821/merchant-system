import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@mui/material';
import GoogleIcon from './GoogleIcon';
import { useTranslation } from 'react-i18next';



interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'themed' | 'gradient'; // 添加样式变体选项
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  variant = 'themed' // 默认使用主题化版本
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化Google API（只初始化一次）
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const initializeGoogle = () => {
      if (typeof window.google !== 'undefined' && window.google.accounts && window.google.accounts.id && !isInitialized) {
        try {
          const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
          console.log('Initializing Google API with client ID:', clientId);
          console.log('Current origin:', window.location.origin);
          console.log('Current hostname:', window.location.hostname);
          console.log('Current port:', window.location.port);
          console.log('Current protocol:', window.location.protocol);

          if (!clientId || clientId === 'your-google-client-id' || clientId === 'your-google-client-id-here') {
            console.error('Google Client ID not configured properly. Please set REACT_APP_GOOGLE_CLIENT_ID in .env file.');
            onError('Google Client ID not configured properly');
            return;
          }

          // 检查是否在localhost环境
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isLocalhost) {
            console.warn('Running on localhost. Make sure your Google OAuth client is configured for:', window.location.origin);
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              console.log('Google callback received:', response);
              setIsLoading(false);
              if (response.credential) {
                onSuccess(response.credential);
              } else {
                onError('Google login failed');
              }
            },
            cancel_on_tap_outside: false,
            auto_select: false,
            use_fedcm_for_prompt: false, // 禁用FedCM以避免冲突
            // 添加更多配置选项
            ux_mode: 'popup', // 使用弹窗模式
            context: 'signin', // 登录上下文
          });
          setIsInitialized(true);
          console.log('Google API initialized successfully');
        } catch (error) {
          console.error('Google API initialization error:', error);
          onError('Google API initialization failed');
        }
      }
    };

    // 检查Google API是否完全加载
    const checkGoogleLoaded = () => {
      console.log('Checking Google API availability...');
      if (typeof window.google !== 'undefined' &&
        window.google.accounts &&
        window.google.accounts.id) {
        console.log('Google API is available');
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        initializeGoogle();
      } else {
        console.log('Google API not yet available');
      }
    };

    // 立即检查一次
    checkGoogleLoaded();

    // 如果还没有加载，每100ms检查一次
    if (!isInitialized) {
      checkInterval = setInterval(checkGoogleLoaded, 100);

      // 15秒后停止检查
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        if (!isInitialized) {
          console.error('Google API failed to load within 15 seconds');
        }
      }, 15000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onSuccess, onError, isInitialized]);

  const handleGoogleLogin = async () => {
    console.log('Google login button clicked');
    console.log('disabled:', disabled, 'isLoading:', isLoading, 'isInitialized:', isInitialized);
    console.log('window.google available:', typeof window.google !== 'undefined');

    // 防止重复点击和加载状态
    if (disabled || isLoading) {
      console.log('Button disabled or loading, returning');
      return;
    }

    // 检查Google API是否已加载和初始化
    if (typeof window.google === 'undefined' || !isInitialized) {
      console.log('Google API not ready');
      onError('Google API not ready');
      return;
    }

    try {
      console.log('Starting Google login process');
      setIsLoading(true);

      // 取消之前的AbortController
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();

      // 取消之前的Google请求
      try {
        window.google.accounts.id.cancel();
      } catch (e) {
        console.log('Error canceling previous Google request:', e);
      }

      // 等待一小段时间确保之前的请求已经清理
      await new Promise(resolve => setTimeout(resolve, 200));

      // 检查是否已被取消
      if (abortControllerRef.current.signal.aborted) {
        console.log('Request was aborted');
        return;
      }

      console.log('Calling Google prompt');
      // 显示登录弹窗
      try {
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.error('Google One Tap not displayed. Reason:', reason);
            
            // 如果是unregistered_origin错误，提供更详细的错误信息
            if (reason === 'unregistered_origin') {
              setIsLoading(false);
              onError('Google OAuth配置错误：当前域名未在Google控制台中注册。请联系管理员配置OAuth授权域名。');
            } else {
              setIsLoading(false);
              onError(`Google login not displayed: ${reason}`);
            }
          } else if (notification.isSkippedMoment()) {
            console.log('Google One Tap skipped. Reason:', notification.getSkippedReason());
            setIsLoading(false);
          } else {
            console.log('Google prompt displayed successfully');
          }
        });
      } catch (error) {
        console.error('Error calling Google prompt:', error);
        setIsLoading(false);
        onError('Failed to display Google login');
      }

    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
      onError('Google login failed');
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 主题化样式（与应用主题融合，使用浅灰色边框）
  const themedStyles = {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '14px',
    padding: '12px 24px',
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderColor: '#dadce0', // 使用默认的浅灰色边框
    color: '#3c4043', // 使用默认的深灰色文字
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    // 完全移除任何可能导致布局变化的效果
    '&:hover': {
      borderColor: '#d2e3fc', // 悬停时边框变为浅蓝色
      backgroundColor: '#f8f9fa', // 悬停时背景变为浅灰色
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // 只改变阴影，不改变位置
      color: '#1a73e8', // 悬停时文字变为蓝色
    },
    '&:active': {
      backgroundColor: '#f1f3f4', // 点击时背景更深
      borderColor: '#d2e3fc',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
    },
    '&:disabled': {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderColor: '#dadce0',
      color: 'rgba(154, 160, 166, 0.8)',
      boxShadow: 'none',
    },
    // 移除所有可能导致布局变化的伪元素和变换
    '& .MuiButton-startIcon': {
      marginRight: '12px',
      // 移除所有变换效果
      '& svg': {
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
      },
    },
  };

  // 默认Google样式
  const defaultStyles = {
    borderColor: '#dadce0',
    color: '#3c4043',
    backgroundColor: '#fff',
    textTransform: 'none' as const,
    fontWeight: 500,
    fontSize: '14px',
    padding: '10px 24px',
    borderRadius: '4px',
    '&:hover': {
      borderColor: '#d2e3fc',
      backgroundColor: '#f8f9fa',
      boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
    },
    '&:active': {
      backgroundColor: '#f1f3f4',
      borderColor: '#d2e3fc',
    },
    '&:disabled': {
      borderColor: '#dadce0',
      color: '#9aa0a6',
      backgroundColor: '#fff',
    },
  };

  // 渐变样式（完全融合主题）
  const gradientStyles = {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '14px',
    padding: '12px 24px',
    borderRadius: 2,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      // 移除transform，使用更强的阴影效果
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)',
    },
    '&:active': {
      // 点击时使用稍小的阴影
      boxShadow: '0 2px 10px rgba(102, 126, 234, 0.6)',
      background: 'linear-gradient(135deg, #4f5fd1 0%, #5d3a83 100%)',
    },
    '&:disabled': {
      background: 'linear-gradient(135deg, #9aa0a6 0%, #9aa0a6 100%)',
      color: 'rgba(255, 255, 255, 0.7)',
      boxShadow: 'none',
    },
    '& .MuiButton-startIcon': {
      marginRight: '12px',
      '& svg path': {
        fill: 'white !important',
      },
    },
  };

  const getStyles = () => {
    switch (variant) {
      case 'gradient':
        return gradientStyles;
      case 'themed':
        return themedStyles;
      default:
        return defaultStyles;
    }
  };

  const getVariant = () => {
    return variant === 'gradient' ? 'contained' : 'outlined';
  };

  return (
    <Button
      fullWidth
      variant={getVariant()}
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
      startIcon={<GoogleIcon sx={{ fontSize: '20px' }} />}
      sx={getStyles()}
    >
      {isLoading ? t('auth.loggingIn') : t('auth.loginWithGoogle')}
    </Button>
  );
};

// 声明全局Google类型
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default GoogleLoginButton;