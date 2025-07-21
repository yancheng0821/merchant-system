import React, { useRef, useEffect, useState } from 'react';
import { Button, Box } from '@mui/material';
import GoogleIcon from './GoogleIcon';
import { useTranslation } from 'react-i18next';

interface GoogleLoginButtonProps {
  onSuccess: (idToken: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false
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

          if (!clientId || clientId === 'your-google-client-id' || clientId === 'your-google-client-id-here') {
            console.warn('Google Client ID not configured properly. Using placeholder for testing.');
            // 暂时允许继续，但会在实际使用时失败
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
      window.google.accounts.id.prompt((notification: any) => {
        console.log('Google prompt notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap not displayed or skipped');
          setIsLoading(false);
        }
      });

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

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={handleGoogleLogin}
      disabled={disabled || isLoading}
      startIcon={<GoogleIcon sx={{ fontSize: '20px' }} />}
      sx={{
        borderColor: '#dadce0',
        color: '#3c4043',
        backgroundColor: '#fff',
        textTransform: 'none',
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
      }}
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