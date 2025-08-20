import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Grid,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Store as StoreIcon,
  Delete as DeleteIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  Verified as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import ModernTerminalManagement from './ModernTerminalManagement';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.swiftmerchantplatform.com';

interface StripeAccountInfo {
  stripeAccountId?: string;
  onboardingCompleted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  isTestMode?: boolean;
  businessName?: string;
  country?: string;
  defaultCurrency?: string;
  dashboardUrl?: string;
  pendingVerification?: string[];
  requiresAction?: boolean;
}

const StripeConnectTab: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<StripeAccountInfo | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // 获取Stripe账户信息
  const fetchAccountInfo = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/business/stripe-connect/account/${user.tenantId}`,
        {
          withCredentials: true,
        }
      );
      
      if (response.data?.data) {
        setAccountInfo(response.data.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 账户不存在
        setAccountInfo(null);
      } else {
        console.error('Failed to fetch Stripe account:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 创建Stripe Connect账户
  const createStripeAccount = async () => {
    if (!user?.tenantId) return;
    
    setCreatingAccount(true);
    try {
      // 先尝试获取商户的实际信息
      let merchantBasicInfo: any = {};
      try {
        const merchantResponse = await axios.get(
          `${API_BASE_URL}/api/business/merchant-config/basic-info?tenantId=${user.tenantId}`,
          { withCredentials: true }
        );
        if (merchantResponse.data?.data) {
          merchantBasicInfo = merchantResponse.data.data;
        }
      } catch (error) {
        console.log('Could not fetch merchant basic info, using defaults');
      }
      
      // 获取商户详细信息（从数据库或用户上下文）
      const tenantInfo = JSON.parse(localStorage.getItem('tenantInfo') || '{}');
      
      // 预填充商户信息，优先使用数据库中的信息
      const merchantInfo = {
        businessName: merchantBasicInfo.merchantName || user.tenantName || tenantInfo.tenantName || t('settings.stripe.defaultBusinessName', 'My Business'),
        businessType: 'company',
        email: merchantBasicInfo.contactEmail || user.email || tenantInfo.contactEmail || t('settings.stripe.defaultEmail', 'contact@example.com'),
        country: 'CA',
        defaultCurrency: 'CAD',
        accountType: 'express',
        
        // 预填充的商户信息 - 确保不发送空字符串
        phone: merchantBasicInfo.contactPhone || tenantInfo.contactPhone || null,
        address: merchantBasicInfo.address || tenantInfo.address || null,
        city: merchantBasicInfo.city || tenantInfo.city || t('settings.stripe.defaultCity', 'Vancouver'),
        state: merchantBasicInfo.province || tenantInfo.state || 'BC',
        postalCode: merchantBasicInfo.postalCode || tenantInfo.postalCode || null,
        
        // 联系人信息
        contactPerson: merchantBasicInfo.contactPerson || tenantInfo.contactPerson || user.realName || user.username || '',
        firstName: merchantBasicInfo.contactPerson?.split(' ')[0] || tenantInfo.firstName || user.realName?.split(' ')[0] || '',
        lastName: merchantBasicInfo.contactPerson?.split(' ').slice(1).join(' ') || tenantInfo.lastName || user.realName?.split(' ').slice(1).join(' ') || '',
        
        // 业务信息
        productDescription: tenantInfo.businessDescription || t('settings.stripe.defaultProductDesc', 'Beauty and wellness services'),
        mcc: '7230', // 美容院的MCC代码
        website: tenantInfo.website || null
      };
      
      // 过滤掉null值，只发送有值的字段
      const filteredMerchantInfo = Object.entries(merchantInfo).reduce((acc, [key, value]) => {
        if (value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const response = await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/account/create?tenantId=${user.tenantId}`,
        filteredMerchantInfo,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      
      if (response.data?.data) {
        setAccountInfo(response.data.data);
        // 显示创建成功提示
        setSnackbar({
          open: true,
          message: t('settings.stripe.accountCreated', 'Stripe账户创建成功'),
          severity: 'success',
        });
        // 延迟一秒后获取入驻链接，确保Stripe已同步
        setTimeout(async () => {
          await createOnboardingLink();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create Stripe account:', error);
    } finally {
      setCreatingAccount(false);
    }
  };

  // 创建入驻链接
  const createOnboardingLink = async () => {
    if (!user?.tenantId) return;
    
    // 检查是否有待处理的验证项
    const hasPendingRequirements = accountInfo?.pendingVerification && 
                                   accountInfo.pendingVerification.length > 0;
    
    // 如果账户已经提交了详细信息且正在审核中，但还不能收款，说明是纯审核状态
    if (accountInfo?.detailsSubmitted && !accountInfo?.chargesEnabled && !accountInfo?.onboardingCompleted) {
      // 如果没有待处理项，说明正在等待Stripe审核，不应该重新进入
      if (!hasPendingRequirements) {
        setSnackbar({
          open: true,
          message: t('settings.stripe.accountUnderReviewMessage'),
          severity: 'info',
        });
        return;
      }
      // 如果有待处理项，允许进入补充信息
    }
    
    // 如果可以收款但不能提现，检查是否有待处理项
    if (accountInfo?.chargesEnabled && !accountInfo?.payoutsEnabled) {
      // 如果没有待处理项，说明正在等待审核
      if (!hasPendingRequirements) {
        setSnackbar({
          open: true,
          message: t('settings.stripe.identityUnderReview', '您的身份验证正在审核中，请耐心等待。审核通常需要1-3个工作日。'),
          severity: 'info',
        });
        return;
      }
      // 如果有待处理项，允许进入补充信息
    }
    
    try {
      const returnUrl = `${window.location.origin}/settings?tab=payment`;
      const refreshUrl = `${window.location.origin}/settings?tab=payment`;
      
      const response = await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/account/link?tenantId=${user.tenantId}&returnUrl=${encodeURIComponent(returnUrl)}&refreshUrl=${encodeURIComponent(refreshUrl)}`,
        {},
        {
          withCredentials: true,
        }
      );
      
      if (response.data?.data?.url) {
        setOnboardingUrl(response.data.data.url);
        // 自动打开入驻链接
        window.open(response.data.data.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to create onboarding link:', error);
    }
  };

  // 同步账户状态
  const syncAccountStatus = async () => {
    if (!user?.tenantId) return;
    
    setSyncing(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/account/${user.tenantId}/sync`,
        {},
        {
          withCredentials: true,
        }
      );
      
      if (response.data?.data) {
        setAccountInfo(response.data.data);
        setLastSyncTime(new Date());
        // 设置下次同步时间
        const next = new Date();
        next.setMinutes(next.getMinutes() + 5);
        setNextSyncTime(next);
      }
    } catch (error) {
      console.error('Failed to sync account status:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 获取Dashboard URL
  const openStripeDashboard = async () => {
    // 只要有账户信息就可以打开Dashboard，不需要等待onboarding完成
    if (!user?.tenantId || !accountInfo) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/business/stripe-connect/account/${user.tenantId}/dashboard-url`,
        {
          withCredentials: true,
        }
      );
      
      if (response.data?.data?.url) {
        // Express Dashboard登录链接是临时的，会直接让商户访问他们的子账户
        // 无需额外登录，直接跳转到他们的Stripe Express仪表板
        window.open(response.data.data.url, '_blank');
        
        // 可选：显示提示信息
        console.info('Opening Stripe Express Dashboard - no additional login required');
      }
    } catch (error) {
      console.error('Failed to get dashboard URL:', error);
      // 可以添加用户友好的错误提示
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // 关闭Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 解绑Stripe账户（仅测试环境）
  const disconnectAccount = async () => {
    if (!user?.tenantId) return;
    
    setDeleting(true);
    handleCloseDeleteDialog();
    
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/business/stripe-connect/account/${user.tenantId}/disconnect`,
        {
          withCredentials: true,
        }
      );
      
      // 检查响应，即使没有明确的 success 标志，只要请求成功就算成功
      if (response.status === 200 || response.data?.data?.success) {
        // 显示成功提示
        setSnackbar({
          open: true,
          message: t('settings.stripe.disconnectSuccess'),
          severity: 'success',
        });
        
        // 立即清空账户信息，显示重新绑定界面
        setAccountInfo(null);
        // 删除成功后不再重新获取，避免界面闪烁
      } else {
        throw new Error('Disconnect failed');
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      setSnackbar({
        open: true,
        message: t('settings.stripe.disconnectError'),
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, [user?.tenantId]);

  // 自动同步状态 - 每1分钟同步一次，仅在账户未完成入驻时
  useEffect(() => {
    if (!accountInfo || accountInfo.onboardingCompleted) {
      return; // 如果没有账户或已完成入驻，不需要自动同步
    }

    // 设置1分钟定时器
    const intervalId = setInterval(() => {
      syncAccountStatus();
    }, 1 * 60 * 1000); // 1分钟

    return () => {
      clearInterval(intervalId);
    };
  }, [accountInfo?.onboardingCompleted, user?.tenantId]);

  // 计算入驻进度
  const calculateProgress = () => {
    if (!accountInfo) return 0;
    let progress = 25; // 账户创建
    if (accountInfo.detailsSubmitted) progress += 25;
    if (accountInfo.chargesEnabled) progress += 25;
    if (accountInfo.payoutsEnabled) progress += 25;
    return progress;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // 未创建账户
  if (!accountInfo || !accountInfo.stripeAccountId) {
    return (
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <PaymentIcon sx={{ fontSize: 48, mr: 2 }} />
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {t('settings.stripe.welcomeTitle', 'Stripe Connect 支付系统')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    {t('settings.stripe.welcomeSubtitle')}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center">
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {t('settings.stripe.feature1')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center">
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {t('settings.stripe.feature2')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center">
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {t('settings.stripe.feature3', 'PCI合规，安全有保障')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="large"
                startIcon={creatingAccount ? <CircularProgress size={20} /> : <LaunchIcon />}
                onClick={createStripeAccount}
                disabled={creatingAccount}
                sx={{
                  backgroundColor: 'white',
                  color: '#667eea',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                {creatingAccount 
                  ? t('settings.stripe.creating') 
                  : t('settings.stripe.startOnboarding')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // 已创建账户
  const progress = calculateProgress();
  
  return (
    <Grid container spacing={4}>
      {/* 账户状态概览 */}
      <Grid item xs={12}>
        <Card 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            boxShadow: 1,
          }}
        >
              {/* 顶部状态栏 - 调整尺寸 */}
              <Box
                sx={{
                  background: accountInfo.onboardingCompleted
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : progress > 50
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  p: 2.5,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 简化背景装饰 */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '-30%',
                    right: '-5%',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
                
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          background: 'rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PaymentIcon sx={{ fontSize: 22, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {accountInfo.businessName || t('settings.stripe.myBusiness')}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" sx={{ opacity: 0.85 }}>
                            {t('settings.stripe.accountId')}:
                          </Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.9 }}>
                            {accountInfo.stripeAccountId}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
                    {accountInfo.chargesEnabled && accountInfo.payoutsEnabled ? (
                      <Chip
                        icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                        label={t('settings.stripe.active')}
                        size="small"
                        sx={{
                          backgroundColor: 'white',
                          color: '#059669',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          py: 0.5,
                          '& .MuiChip-icon': {
                            color: '#059669',
                          },
                        }}
                      />
                    ) : accountInfo.chargesEnabled && !accountInfo.payoutsEnabled ? (
                      <Chip
                        icon={<WarningIcon sx={{ fontSize: 16 }} />}
                        label={t('settings.stripe.partialActive')}
                        size="small"
                        sx={{
                          backgroundColor: 'white',
                          color: '#f59e0b',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          py: 0.5,
                          '& .MuiChip-icon': {
                            color: '#f59e0b',
                          },
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<TimerIcon sx={{ fontSize: 16 }} />}
                        label={t('settings.stripe.pending')}
                        size="small"
                        sx={{
                          backgroundColor: 'white',
                          color: '#6366F1',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          py: 0.5,
                          '& .MuiChip-icon': {
                            color: '#6366F1',
                          },
                        }}
                      />
                    )}
                  </Grid>
                </Grid>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {/* 入驻进度 - 简化样式 */}
                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                      {t('settings.stripe.onboardingProgress')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha('#e2e8f0', 0.5),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: progress === 100
                          ? '#10b981'
                          : progress > 50
                          ? '#f59e0b'
                          : '#6366F1',
                      },
                    }}
                  />
                  {progress < 100 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {progress === 25 && t('settings.stripe.progressTip1')}
                      {progress === 50 && t('settings.stripe.progressTip2')}
                      {progress === 75 && t('settings.stripe.progressTip3')}
                    </Typography>
                  )}
                </Box>

                {/* 状态列表 - 简化样式 */}
                <Grid container spacing={1.5}>
                  {[
                    {
                      title: t('settings.stripe.accountCreated'),
                      completed: !!accountInfo.stripeAccountId,
                      icon: <AccountBalanceIcon />,
                      color: '#6366F1',
                    },
                    {
                      title: t('settings.stripe.detailsSubmitted'),
                      completed: accountInfo.detailsSubmitted,
                      icon: <VerifiedIcon />,
                      color: '#8B5CF6',
                    },
                    {
                      title: t('settings.stripe.chargesEnabled'),
                      completed: accountInfo.chargesEnabled,
                      icon: <CreditCardIcon />,
                      color: '#f59e0b',
                      reviewing: accountInfo.detailsSubmitted && !accountInfo.chargesEnabled,
                    },
                    {
                      title: t('settings.stripe.payoutsEnabled'),
                      completed: accountInfo.payoutsEnabled,
                      icon: <TrendingUpIcon />,
                      color: '#10b981',
                      needsVerification: accountInfo.chargesEnabled && !accountInfo.payoutsEnabled,
                    },
                  ].map((item, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: item.completed ? alpha(item.color, 0.2) : '#e2e8f0',
                          background: item.completed ? alpha(item.color, 0.02) : 'transparent',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: item.completed
                                ? alpha(item.color, 0.1)
                                : alpha('#cbd5e1', 0.1),
                              color: item.completed ? item.color : '#94a3b8',
                            }}
                          >
                            {item.completed ? (
                              <CheckCircleIcon sx={{ fontSize: 18 }} />
                            ) : (
                              React.cloneElement(item.icon, { sx: { fontSize: 18 } })
                            )}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                              {item.title}
                            </Typography>
                            <Typography variant="caption" color={
                              item.completed 
                                ? 'success.main'
                                : item.reviewing || item.needsVerification
                                ? 'warning.main'
                                : 'text.secondary'
                            }>
                              {item.completed 
                                ? t('settings.stripe.completed')
                                : item.reviewing
                                ? t('settings.stripe.reviewing')
                                : item.needsVerification
                                ? t('settings.stripe.verificationRequired')
                                : t('settings.stripe.pending')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* 操作按钮区域 - 简化样式 */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={2}>
                    {t('settings.stripe.quickActions')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* 情况1: 未提交详情 - 显示继续入驻 */}
                    {!accountInfo.detailsSubmitted && (
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<LaunchIcon sx={{ fontSize: 18 }} />}
                          onClick={createOnboardingLink}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                          }}
                        >
                          {t('settings.stripe.continueOnboarding')}
                        </Button>
                      </Grid>
                    )}
                    
                    {/* 情况2: 已提交但还在审核中 - 显示审核中状态 */}
                    {accountInfo.detailsSubmitted && !accountInfo.chargesEnabled && (
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            background: alpha('#f59e0b', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                          }}
                        >
                          <CircularProgress size={16} sx={{ color: '#f59e0b' }} />
                          <Typography variant="body2" color="warning.main">
                            {t('settings.stripe.underReview')}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {/* 情况3: 可以收款但不能提现 - 显示完成验证按钮 */}
                    {accountInfo.chargesEnabled && !accountInfo.payoutsEnabled && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            startIcon={<VerifiedIcon sx={{ fontSize: 18 }} />}
                            onClick={createOnboardingLink}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.875rem',
                            }}
                          >
                            {t('settings.stripe.completeVerification')}
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
                            onClick={openStripeDashboard}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.875rem',
                            }}
                          >
                            {t('settings.stripe.openDashboard')}
                          </Button>
                        </Grid>
                      </>
                    )}
                    
                    {/* 情况4: 完全激活（可收款且可提现） */}
                    {accountInfo.chargesEnabled && accountInfo.payoutsEnabled && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
                            onClick={openStripeDashboard}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.875rem',
                            }}
                          >
                            {t('settings.stripe.openDashboard')}
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box
                            sx={{
                              p: 1.5,
                              height: '100%',
                              borderRadius: 1,
                              background: alpha('#10b981', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500} color="success.dark">
                                {t('settings.stripe.fullyActivated')}
                              </Typography>
                              <Typography variant="caption" color="success.main">
                                {t('settings.stripe.readyToAcceptPayments')}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </>
                    )}
                    
                    {/* 同步状态按钮 - 仅在账户未完全激活时显示 */}
                    {!(accountInfo.chargesEnabled && accountInfo.payoutsEnabled) && (
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={syncing ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
                          onClick={syncAccountStatus}
                          disabled={syncing}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                          }}
                        >
                          {syncing 
                            ? t('settings.stripe.syncing') 
                            : t('settings.stripe.syncStatus')}
                        </Button>
                      </Grid>
                    )}
                    
                    {/* 解绑按钮 - 在测试模式下显示 */}
                    {accountInfo.isTestMode && accountInfo.stripeAccountId && (
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="text"
                          size="small"
                          startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                          onClick={handleOpenDeleteDialog}
                          disabled={deleting}
                          sx={{
                            mt: 1,
                            color: '#ef4444',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: alpha('#ef4444', 0.05),
                            },
                          }}
                        >
                          {t('settings.stripe.disconnect')}
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>

            {/* 提示信息 */}
            {!accountInfo.detailsSubmitted && (
              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                {t('settings.stripe.onboardingTip')}
              </Alert>
            )}
            
            {accountInfo.detailsSubmitted && !accountInfo.chargesEnabled && (
              <>
                <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
                  {t('settings.stripe.reviewingTip')}
                </Alert>
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <Box>
                    <Typography variant="body2">
                      {t('settings.stripe.autoSync')}
                    </Typography>
                    {lastSyncTime && (
                      <Typography variant="caption" color="text.secondary">
                        {t('settings.stripe.lastSync')}: {lastSyncTime.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                </Alert>
              </>
            )}
            
            {accountInfo.chargesEnabled && !accountInfo.payoutsEnabled && (
              <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
                <AlertTitle>{t('settings.stripe.identityVerificationRequired')}</AlertTitle>
                {t('settings.stripe.canChargeButNotPayout')}
                {accountInfo.pendingVerification && accountInfo.pendingVerification.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.stripe.pendingItems')}:
                    </Typography>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {accountInfo.pendingVerification.map((item, index) => {
                        // 将技术字段名转换为用户友好的描述
                        const getVerificationItemText = (item: string): string => {
                          if (item.includes('proof_of_liveness')) {
                            return t('settings.stripe.verificationItems.proofOfLiveness', '身份证明文件');
                          }
                          if (item.includes('document')) {
                            return t('settings.stripe.verificationItems.document', '身份证件');
                          }
                          if (item.includes('address')) {
                            return t('settings.stripe.verificationItems.address', '地址证明');
                          }
                          if (item.includes('bank_account')) {
                            return t('settings.stripe.verificationItems.bankAccount', '银行账户信息');
                          }
                          if (item.includes('business')) {
                            return t('settings.stripe.verificationItems.business', '企业信息');
                          }
                          // 如果没有匹配的，返回一个通用描述
                          return t('settings.stripe.verificationItems.additional', '额外验证信息');
                        };
                        
                        return (
                          <li key={index}>
                            <Typography variant="caption">{getVerificationItemText(item)}</Typography>
                          </li>
                        );
                      })}
                    </ul>
                  </Box>
                )}
              </Alert>
            )}
            
            {accountInfo.chargesEnabled && accountInfo.payoutsEnabled && (
              <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                {t('settings.stripe.readyTipFull')}
              </Alert>
            )}
              </CardContent>
          </Card>
      </Grid>

      {/* 支付功能说明 - 完全激活后显示 */}
      {accountInfo.chargesEnabled && accountInfo.payoutsEnabled && (
        <Grid item xs={12}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
              
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SpeedIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      {t('settings.stripe.paymentFeatures')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('settings.stripe.featuresSubtitle')}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={3}>
                  {[
                    {
                      icon: <CreditCardIcon />,
                      title: t('settings.stripe.cardPayments'),
                      description: t('settings.stripe.cardPaymentsDesc'),
                      color: '#6366F1',
                      features: [
                        t('settings.stripe.instantPayment'),
                        t('settings.stripe.pciCompliant', 'PCI合规'),
                        t('settings.stripe.globalPayment')
                      ],
                    },
                    {
                      icon: <StoreIcon />,
                      title: t('settings.stripe.posPayments', 'POS终端支付'),
                      description: t('settings.stripe.posPaymentsDesc'),
                      color: '#10b981',
                      features: [
                        t('settings.stripe.offlinePayment'),
                        t('settings.stripe.mobilePayment'),
                        t('settings.stripe.contactlessPayment')
                      ],
                    },
                    {
                      icon: <AccountBalanceIcon />,
                      title: t('settings.stripe.payouts'),
                      description: t('settings.stripe.payoutsDesc'),
                      color: '#f59e0b',
                      features: [
                        t('settings.stripe.fastPayout', '1-2天到账'),
                        t('settings.stripe.autoSettle'),
                        t('settings.stripe.bankDirect')
                      ],
                    },
                  ].map((feature, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Box
                        sx={{
                          p: 2.5,
                          height: '100%',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: alpha(feature.color, 0.15),
                          background: alpha(feature.color, 0.02),
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: `0 4px 12px ${alpha(feature.color, 0.1)}`,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            background: alpha(feature.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                          }}
                        >
                          {React.cloneElement(feature.icon, { 
                            sx: { color: feature.color, fontSize: 22 } 
                          })}
                        </Box>
                        
                        <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                          {feature.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {feature.description}
                        </Typography>
                        
                        <Box>
                          {feature.features.map((item, idx) => (
                            <Box key={idx} display="flex" alignItems="center" gap={0.5} mb={0.3}>
                              <CheckCircleIcon sx={{ fontSize: 14, color: feature.color }} />
                              <Typography variant="caption" color="text.secondary">
                                {item}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                {/* 安全保障信息 */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 1,
                    background: alpha('#10b981', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#10b981', 0.15),
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <SecurityIcon sx={{ color: 'success.main', fontSize: 24 }} />
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600} color="success.dark">
                        {t('settings.stripe.securityTitle')}
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        {t('settings.stripe.securityDesc', 'PCI DSS Level 1认证，银行级加密保护，全球合规标准')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
        </Grid>
      )}
      
      {/* 终端管理 - 仅在账户完全激活后显示 */}
      {accountInfo && accountInfo.chargesEnabled && accountInfo.payoutsEnabled && (
        <Grid item xs={12}>
          <ModernTerminalManagement />
        </Grid>
      )}
      
      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t('settings.stripe.confirmDeleteTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {accountInfo?.isTestMode 
              ? t('settings.stripe.confirmDisconnectTest')
              : t('settings.stripe.confirmDisconnectProd')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            {t('common.cancel')}
          </Button>
          <Button onClick={disconnectAccount} color="error" variant="contained" autoFocus>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 成功/错误提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default StripeConnectTab;