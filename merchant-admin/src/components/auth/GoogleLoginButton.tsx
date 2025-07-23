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

  // 使用useRef存储回调函数，避免依赖变化
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // 更新ref中的回调函数
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // 初始化Google API（只初始化一次）
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const initializeGoogle = () => {
      if (typeof window.google !== 'undefined' && window.google.accounts && window.google.accounts.id && !isInitialized) {
        try {
          const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;


          if (!clientId || clientId === 'your-google-client-id' || clientId === 'your-google-client-id-here') {
            onErrorRef.current('Google Client ID not configured properly');
            return;
          }

          // 使用GSI配置
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              setIsLoading(false);
              if (response.credential) {
                onSuccessRef.current(response.credential);
              } else {
                onErrorRef.current('Google login failed');
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
            // 优化用户体验
            context: 'signin',
            ux_mode: 'popup',
          });
          setIsInitialized(true);

        } catch (error) {
          console.error('Google API initialization error:', error);
          onErrorRef.current('Google API initialization failed');
        }
      }
    };

    // 检查Google API是否完全加载
    const checkGoogleLoaded = () => {
      if (typeof window.google !== 'undefined' &&
        window.google.accounts &&
        window.google.accounts.id) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        initializeGoogle();
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

      }, 15000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isInitialized]); // 移除onSuccess和onError依赖，避免无限循环

  const handleGoogleLogin = async () => {
    // 防止重复点击和加载状态
    if (disabled || isLoading) {
      return;
    }

    // 检查Google API是否已加载和初始化
    if (typeof window.google === 'undefined' || !isInitialized) {
      onErrorRef.current('Google API not ready');
      return;
    }

    try {
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
        // 忽略取消错误
      }

      // 等待一小段时间确保之前的请求已经清理
      await new Promise(resolve => setTimeout(resolve, 200));

      // 检查是否已被取消
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      try {
        // 创建一个临时的隐藏容器来渲染Google按钮
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '-1000px';
        tempContainer.style.left = '-1000px';
        tempContainer.style.visibility = 'hidden';
        document.body.appendChild(tempContainer);

        // 使用renderButton创建Google登录按钮并自动点击
        window.google.accounts.id.renderButton(tempContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 250
        });

        // 等待按钮渲染完成后自动点击
        setTimeout(() => {
          const googleButton = tempContainer.querySelector('div[role="button"]') as HTMLElement;
          if (googleButton) {
            googleButton.click();
          } else {
            setIsLoading(false);
            onErrorRef.current('无法创建Google登录按钮');
          }
          
          // 清理临时容器
          setTimeout(() => {
            if (document.body.contains(tempContainer)) {
              document.body.removeChild(tempContainer);
            }
          }, 1000);
        }, 100);

      } catch (error) {
        setIsLoading(false);
        onErrorRef.current('Google登录失败');
      }

    } catch (error) {
      setIsLoading(false);
      onErrorRef.current('Google login failed');
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