import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Tooltip,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  EventBusy as CancelIcon,
  Palette as PaletteIcon,
  Link as LinkIcon,
  Public as GoogleIcon,
  Storefront as StorefrontIcon,
  Search as SearchIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import ImageUploader from '../../components/common/ImageUploader';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { onlineBookingApi } from '../../services/api';

interface OnlineBookingConfig {
  enabled: boolean;
  bookingUrl: string;
  bookingPageSlug: string;
  advanceBookingDays: number;
  minAdvanceHours: number;
  allowCustomerCancel: boolean;
  cancelDeadlineHours: number;
  allowCustomerReschedule: boolean;
  rescheduleDeadlineHours: number;
  autoConfirmBooking: boolean;
  requireDeposit: boolean;
  depositType: 'FIXED' | 'PERCENTAGE';
  depositAmount: number;
  enableWaitlist: boolean;
  showTechnicianPhotos: boolean;
  showTechnicianRatings: boolean;
  showPopularServices: boolean;
  bookingWidgetColor: string;
  welcomeMessage: string;
  cancellationPolicy: string;
  logoUrl: string;
  googleBusinessEnabled: boolean;
  googlePlaceId: string;
}

const defaultConfig: OnlineBookingConfig = {
  enabled: false,
  bookingUrl: '',
  bookingPageSlug: '',
  advanceBookingDays: 30,
  minAdvanceHours: 2,
  allowCustomerCancel: true,
  cancelDeadlineHours: 24,
  allowCustomerReschedule: true,
  rescheduleDeadlineHours: 12,
  autoConfirmBooking: true,
  requireDeposit: false,
  depositType: 'PERCENTAGE',
  depositAmount: undefined as any,
  enableWaitlist: true,
  showTechnicianPhotos: true,
  showTechnicianRatings: true,
  showPopularServices: true,
  bookingWidgetColor: '#1a1a1a',
  welcomeMessage: '',
  cancellationPolicy: '', // 将在loadConfig中根据语言设置
  logoUrl: '',
  googleBusinessEnabled: false,
  googlePlaceId: '',
};

// 样式常量 - 移到组件外避免重复创建
const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a1a1a' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1a1a1a' },
};

const cardSx = {
  borderRadius: 2,
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: 'none',
  height: '100%',
};

// 卡片标题组件 - 移到组件外避免重复创建
const CardHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <Box display="flex" alignItems="center" mb={2.5}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 1.5,
      }}
    >
      {icon}
    </Box>
    <Typography variant="subtitle1" fontWeight={600} color="#111827">
      {title}
    </Typography>
  </Box>
);

// 设置项组件 - 移到组件外避免重复创建
const SettingRow = ({
  label,
  description,
  control,
  noBorder,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
  noBorder?: boolean;
}) => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    py={1.5}
    sx={noBorder ? {} : { borderBottom: '1px solid rgba(0,0,0,0.04)' }}
  >
    <Box flex={1} mr={2}>
      <Typography variant="body2" fontWeight={500} color="#333">
        {label}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
          {description}
        </Typography>
      )}
    </Box>
    <Box flexShrink={0}>{control}</Box>
  </Box>
);

// 时间输入框的InputProps - 固定引用避免重复创建
const hoursInputProps = {
  endAdornment: <InputAdornment position="end">h</InputAdornment>,
};

// TextField的固定样式 - 避免每次渲染创建新对象
const fullWidthSx = { width: '100%' };
const width80BoxSx = { width: 80 };
const width80VisibleBoxSx = { width: 80, visibility: 'visible' as const };
const width80HiddenBoxSx = { width: 80, visibility: 'hidden' as const };

const OnlineBookingTab: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<OnlineBookingConfig>(defaultConfig);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // 自动保存相关状态
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialConfigRef = useRef<OnlineBookingConfig | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // 重新生成链接确认弹框状态
  const [openRegenerateDialog, setOpenRegenerateDialog] = useState(false);

  // Place ID 搜索状态
  const [searchingPlaceId, setSearchingPlaceId] = useState(false);
  const [placeSearchResults, setPlaceSearchResults] = useState<Array<{
    placeId: string;
    name: string;
    formattedAddress: string;
  }>>([]);

  const loadConfig = useCallback(async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const response = await onlineBookingApi.getConfig(user.tenantId);

      // 后端返回 null/空 body 表示没有记录，使用前端默认值
      if (!response || response.data === null || response.rawResponse) {
        // 生成16位随机slug
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomSlug = '';
        for (let i = 0; i < 16; i++) {
          randomSlug += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const newConfig = {
          ...defaultConfig,
          bookingPageSlug: randomSlug,
          cancellationPolicy: t('settings.onlineBooking.defaultCancellationPolicy'),
        };
        setConfig(newConfig);
        initialConfigRef.current = newConfig;
        isInitializedRef.current = true;
        return;
      }

      // 有记录，过滤掉 null/undefined 值后与默认值合并
      const filteredResponse: Partial<OnlineBookingConfig> = {};
      Object.entries(response).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          (filteredResponse as any)[key] = value;
        }
      });

      // 如果 cancellationPolicy 为空或是默认值，使用当前语言的默认值
      const mergedConfig = { ...defaultConfig, ...filteredResponse };
      const defaultPolicyZh = '客户可在预约时间24小时前免费取消预约。在预约时间24小时内取消，可能会收取取消费用。';
      const defaultPolicyEn = 'Customers can cancel appointments free of charge up to 24 hours before the scheduled time. Cancellations within 24 hours may incur a cancellation fee.';
      if (!mergedConfig.cancellationPolicy ||
          mergedConfig.cancellationPolicy === defaultPolicyZh ||
          mergedConfig.cancellationPolicy === defaultPolicyEn) {
        mergedConfig.cancellationPolicy = t('settings.onlineBooking.defaultCancellationPolicy');
      }

      // 如果 bookingPageSlug 为空，生成16位随机slug
      if (!mergedConfig.bookingPageSlug || mergedConfig.bookingPageSlug.trim() === '') {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomSlug = '';
        for (let i = 0; i < 16; i++) {
          randomSlug += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        mergedConfig.bookingPageSlug = randomSlug;
      }

      setConfig(mergedConfig);
      initialConfigRef.current = mergedConfig;
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to load online booking config:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, user?.tenantCode]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 自动保存逻辑
  useEffect(() => {
    // 未初始化时不触发自动保存
    if (!isInitializedRef.current || !initialConfigRef.current || !user?.tenantId) {
      return;
    }

    // 比较配置是否有变化
    const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfigRef.current);
    if (!hasChanges) {
      return;
    }

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置防抖定时器（1.5秒后自动保存）
    autoSaveTimerRef.current = setTimeout(async () => {
      // 验证必填字段
      const errors: string[] = [];
      if (!config.advanceBookingDays || config.advanceBookingDays === 0) {
        errors.push(t('settings.onlineBooking.advanceBookingDays'));
      }
      if (config.minAdvanceHours === undefined || config.minAdvanceHours === null) {
        errors.push(t('settings.onlineBooking.minAdvanceHours'));
      }
      if (config.allowCustomerCancel && (!config.cancelDeadlineHours || config.cancelDeadlineHours === 0)) {
        errors.push(t('settings.onlineBooking.cancelDeadlineHours', '取消截止时间'));
      }
      if (config.allowCustomerReschedule && (!config.rescheduleDeadlineHours || config.rescheduleDeadlineHours === 0)) {
        errors.push(t('settings.onlineBooking.rescheduleDeadlineHours', '改期截止时间'));
      }
      if (config.requireDeposit && (!config.depositAmount || config.depositAmount === 0)) {
        errors.push(t('settings.onlineBooking.depositAmount'));
      }

      if (errors.length > 0) {
        setAutoSaveStatus('error');
        // 5秒后恢复idle状态
        setTimeout(() => setAutoSaveStatus('idle'), 5000);
        return;
      }

      setAutoSaveStatus('saving');
      try {
        await onlineBookingApi.updateConfig(user.tenantId, config);
        initialConfigRef.current = config;
        setAutoSaveStatus('saved');
        // 3秒后恢复idle状态
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } catch (error) {
        console.error('Auto save failed:', error);
        setAutoSaveStatus('error');
        // 5秒后恢复idle状态
        setTimeout(() => setAutoSaveStatus('idle'), 5000);
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, user?.tenantId]);

  // 语言切换时，如果是默认取消政策则更新为当前语言
  useEffect(() => {
    const defaultPolicyZh = '客户可在预约时间24小时前免费取消预约。在预约时间24小时内取消，可能会收取取消费用。';
    const defaultPolicyEn = 'Customers can cancel appointments free of charge up to 24 hours before the scheduled time. Cancellations within 24 hours may incur a cancellation fee.';
    if (!config.cancellationPolicy ||
        config.cancellationPolicy === defaultPolicyZh ||
        config.cancellationPolicy === defaultPolicyEn) {
      setConfig(prev => ({
        ...prev,
        cancellationPolicy: t('settings.onlineBooking.defaultCancellationPolicy')
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const bookingUrl = `${window.location.origin}/booking/${config.bookingPageSlug}`;

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setNotification({
      open: true,
      message: t('settings.onlineBooking.linkCopied'),
      severity: 'info',
    });
  };

  // 使用 useCallback 优化输入框的 onChange，避免失焦
  const handleCancelDeadlineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfig(prev => {
      if (val === '') {
        return { ...prev, cancelDeadlineHours: undefined as any };
      } else {
        const num = parseInt(val);
        return { ...prev, cancelDeadlineHours: isNaN(num) ? undefined as any : num };
      }
    });
  }, []);

  const handleRescheduleDeadlineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfig(prev => {
      if (val === '') {
        return { ...prev, rescheduleDeadlineHours: undefined as any };
      } else {
        const num = parseInt(val);
        return { ...prev, rescheduleDeadlineHours: isNaN(num) ? undefined as any : num };
      }
    });
  }, []);

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    // 生成16位随机字符，与后端保持一致
    for (let i = 0; i < 16; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig({ ...config, bookingPageSlug: slug });
  };

  // 搜索 Google Place ID
  const handleSearchPlaceId = async () => {
    if (!user?.tenantId) return;

    setSearchingPlaceId(true);
    setPlaceSearchResults([]);

    try {
      const result = await onlineBookingApi.lookupPlaceId(user.tenantId);

      if (result.success && result.results && result.results.length > 0) {
        setPlaceSearchResults(result.results);
        // 如果只有一个结果，直接选中
        if (result.results.length === 1) {
          setConfig({ ...config, googlePlaceId: result.results[0].placeId });
          setPlaceSearchResults([]);
          setNotification({
            open: true,
            message: t('settings.onlineBooking.placeIdFound'),
            severity: 'success',
          });
        }
      } else {
        // 根据错误码选择翻译
        let errorMessage = t('settings.onlineBooking.placeIdNotFound');
        if (result.error === 'NO_ADDRESS') {
          errorMessage = t('settings.onlineBooking.placeIdNoAddress');
        } else if (result.error === 'API_ERROR') {
          errorMessage = t('settings.onlineBooking.placeIdSearchError');
        }
        setNotification({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to search Place ID:', error);
      setNotification({
        open: true,
        message: t('settings.onlineBooking.placeIdSearchError'),
        severity: 'error',
      });
    } finally {
      setSearchingPlaceId(false);
    }
  };

  // 选择搜索结果
  const handleSelectPlace = (placeId: string) => {
    setConfig({ ...config, googlePlaceId: placeId });
    setPlaceSearchResults([]);
    setNotification({
      open: true,
      message: t('settings.onlineBooking.placeIdSelected'),
      severity: 'success',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 第一行：在线预约开关 (全宽) */}
      <Card sx={{ ...cardSx, height: 'auto', mb: isMobile ? 2 : 3 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5}>
            <Box
              sx={{
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                borderRadius: 2,
                bgcolor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <CalendarIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} color="#111827" sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
              {t('settings.onlineBooking.enableTitle')}
            </Typography>
          </Box>

          <SettingRow
            label={t('settings.onlineBooking.enableOnlineBooking')}
            description={t('settings.onlineBooking.enableDescription')}
            control={
              <Switch
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                sx={switchSx}
              />
            }
            noBorder={!config.enabled}
          />

          {config.enabled && (
            <Box mt={2}>
              <Typography variant="body2" fontWeight={500} color="#333" mb={1} sx={{ fontSize: isMobile ? '0.8rem' : undefined }}>
                {t('settings.onlineBooking.bookingLink')}
              </Typography>
              {isMobile ? (
                // 移动端布局
                <Box>
                  <TextField
                    fullWidth
                    size="small"
                    value={bookingUrl}
                    InputProps={{
                      readOnly: true,
                      sx: { fontSize: '0.75rem' },
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ color: '#999', fontSize: 16 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 1 }}
                  />
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CopyIcon sx={{ fontSize: 14 }} />}
                      onClick={copyBookingUrl}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        py: 0.5,
                        borderColor: '#ddd',
                        color: '#666',
                      }}
                    >
                      {t('common.copy')}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                      onClick={() => window.open(bookingUrl, '_blank')}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        py: 0.5,
                        borderColor: '#ddd',
                        color: '#666',
                      }}
                    >
                      {t('common.openInNewTab')}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setOpenRegenerateDialog(true)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        py: 0.5,
                        borderColor: '#ddd',
                        color: '#666',
                      }}
                    >
                      {t('settings.onlineBooking.regenerate')}
                    </Button>
                  </Box>
                </Box>
              ) : (
                // 桌面端布局
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    value={bookingUrl}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ color: '#999', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Tooltip title={t('common.copy')}>
                    <IconButton onClick={copyBookingUrl} size="small">
                      <CopyIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.openInNewTab')}>
                    <IconButton onClick={() => window.open(bookingUrl, '_blank')} size="small">
                      <OpenInNewIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('settings.onlineBooking.regenerateSlug')}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setOpenRegenerateDialog(true)}
                      sx={{
                        textTransform: 'none',
                        minWidth: 'auto',
                        px: 1.5,
                        whiteSpace: 'nowrap',
                        borderColor: '#ddd',
                        color: '#666',
                        '&:hover': { borderColor: '#999', bgcolor: '#f5f5f5' }
                      }}
                    >
                      {t('settings.onlineBooking.regenerate')}
                    </Button>
                  </Tooltip>
                </Box>
              )}
              {!isMobile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('settings.onlineBooking.slugNote')}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 第二行：预约规则 + 取消政策 */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 2 : 3 }}>
        {/* 左列：预约规则 */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600} color="#111827" sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                  {t('settings.onlineBooking.bookingRules')}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" fontWeight={500} color="#333" mb={1}>
                  {t('settings.onlineBooking.advanceBookingDays')}
                </Typography>
                <TextField
                  size="small"
                  value={config.advanceBookingDays ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setConfig({ ...config, advanceBookingDays: undefined as any });
                    } else {
                      const num = parseInt(val);
                      setConfig({ ...config, advanceBookingDays: isNaN(num) ? undefined as any : num });
                    }
                  }}
                  error={!config.advanceBookingDays}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{t('common.days')}</InputAdornment>,
                  }}
                  sx={{ width: 140 }}
                />
              </Box>

              <Box mb={2}>
                <Typography variant="body2" fontWeight={500} color="#333" mb={1}>
                  {t('settings.onlineBooking.minAdvanceHours')}
                </Typography>
                <TextField
                  size="small"
                  value={config.minAdvanceHours ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setConfig({ ...config, minAdvanceHours: undefined as any });
                    } else {
                      const num = parseInt(val);
                      setConfig({ ...config, minAdvanceHours: isNaN(num) ? undefined as any : num });
                    }
                  }}
                  error={config.minAdvanceHours === undefined || config.minAdvanceHours === null}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{t('common.hours')}</InputAdornment>,
                  }}
                  sx={{ width: 140 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <SettingRow
                label={t('settings.onlineBooking.autoConfirmBooking')}
                control={
                  <Switch
                    checked={config.autoConfirmBooking}
                    onChange={(e) => setConfig({ ...config, autoConfirmBooking: e.target.checked })}
                    sx={switchSx}
                  />
                }
              />

            </CardContent>
          </Card>
        </Grid>

        {/* 右列：取消/改期政策 */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                  }}
                >
                  <CancelIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600} color="#111827" sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                  {t('settings.onlineBooking.cancellationPolicy')}
                </Typography>
              </Box>

              {/* 允许客户取消预约 - 直接渲染避免失焦 */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={1.5}
                borderBottom="1px solid rgba(0,0,0,0.06)"
              >
                <Typography variant="body2" color="#555">
                  {t('settings.onlineBooking.allowCustomerCancel')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={config.allowCustomerCancel ? width80VisibleBoxSx : width80HiddenBoxSx}>
                    <TextField
                      size="small"
                      value={config.cancelDeadlineHours ?? ''}
                      onChange={handleCancelDeadlineChange}
                      error={config.allowCustomerCancel && !config.cancelDeadlineHours}
                      disabled={!config.allowCustomerCancel}
                      InputProps={hoursInputProps}
                      sx={fullWidthSx}
                    />
                  </Box>
                  <Switch
                    checked={config.allowCustomerCancel}
                    onChange={(e) => setConfig(prev => ({ ...prev, allowCustomerCancel: e.target.checked }))}
                    sx={switchSx}
                  />
                </Box>
              </Box>

              {/* 允许客户改期 - 直接渲染避免失焦 */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={1.5}
                borderBottom="1px solid rgba(0,0,0,0.06)"
              >
                <Typography variant="body2" color="#555">
                  {t('settings.onlineBooking.allowCustomerReschedule')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={config.allowCustomerReschedule ? width80VisibleBoxSx : width80HiddenBoxSx}>
                    <TextField
                      size="small"
                      value={config.rescheduleDeadlineHours ?? ''}
                      onChange={handleRescheduleDeadlineChange}
                      error={config.allowCustomerReschedule && !config.rescheduleDeadlineHours}
                      disabled={!config.allowCustomerReschedule}
                      InputProps={hoursInputProps}
                      sx={fullWidthSx}
                    />
                  </Box>
                  <Switch
                    checked={config.allowCustomerReschedule}
                    onChange={(e) => setConfig(prev => ({ ...prev, allowCustomerReschedule: e.target.checked }))}
                    sx={switchSx}
                  />
                </Box>
              </Box>

              {/* 取消政策文字描述暂时隐藏，使用系统默认文案
              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" fontWeight={500} color="#333" mb={1}>
                {t('settings.onlineBooking.cancellationPolicyText')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={config.cancellationPolicy}
                onChange={(e) => setConfig({ ...config, cancellationPolicy: e.target.value })}
                placeholder={t('settings.onlineBooking.cancellationPolicyTextHelp')}
              />
              */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 第三行：商户Logo + 外观设置 */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 2 : 3 }}>
        {/* 左列：商户Logo */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                  }}
                >
                  <StorefrontIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600} color="#111827" sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                  {t('settings.onlineBooking.merchantLogo')}
                </Typography>
              </Box>

              <Box display="flex" alignItems="flex-start" gap={3}>
                <ImageUploader
                  value={config.logoUrl}
                  onChange={(url) => setConfig({ ...config, logoUrl: url || '' })}
                  variant="rectangle"
                  size={100}
                  uploadType="logo"
                  placeholder={t('settings.onlineBooking.uploadLogo')}
                  themeColor="#666"
                />
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('settings.onlineBooking.logoDescription')}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {t('settings.onlineBooking.logoRequirements')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 右列：外观设置 */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: 2,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                  }}
                >
                  <PaletteIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600} color="#111827" sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                  {t('settings.onlineBooking.appearance')}
                </Typography>
              </Box>

              <SettingRow
                label={t('settings.onlineBooking.showTechnicianPhotos')}
                control={
                  <Switch
                    checked={config.showTechnicianPhotos}
                    onChange={(e) => setConfig({ ...config, showTechnicianPhotos: e.target.checked })}
                    sx={switchSx}
                  />
                }
              />

              <SettingRow
                label={t('settings.onlineBooking.showPopularServices')}
                description={t('settings.onlineBooking.showPopularServicesDesc')}
                control={
                  <Switch
                    checked={config.showPopularServices}
                    onChange={(e) => setConfig({ ...config, showPopularServices: e.target.checked })}
                    sx={switchSx}
                  />
                }
                noBorder
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 第四行：Google Business 集成 (全宽) */}
      <Card sx={{ ...cardSx, height: 'auto', mb: isMobile ? 2 : 3 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 2 : 2.5}>
            <Box display="flex" alignItems="center">
              <Box
                sx={{
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36,
                  borderRadius: 2,
                  bgcolor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                }}
              >
                <GoogleIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600} color="#111827" sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                {t('settings.onlineBooking.googleIntegration')}
              </Typography>
            </Box>
            <Chip
              label={config.googleBusinessEnabled ? t('common.connected') : t('common.notConnected')}
              size="small"
              sx={{
                fontWeight: 500,
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                bgcolor: config.googleBusinessEnabled ? '#e8f5e9' : '#f5f5f5',
                color: config.googleBusinessEnabled ? '#2e7d32' : '#666',
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('settings.onlineBooking.googleIntegrationDesc')}
          </Typography>

          <SettingRow
            label={t('settings.onlineBooking.enableGoogleBusiness')}
            control={
              <Switch
                checked={config.googleBusinessEnabled}
                onChange={(e) => setConfig({ ...config, googleBusinessEnabled: e.target.checked })}
                sx={switchSx}
              />
            }
            noBorder={!config.googleBusinessEnabled}
          />

          {config.googleBusinessEnabled && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" fontWeight={500} color="#333" mb={1}>
                  {t('settings.onlineBooking.googlePlaceId')}
                </Typography>

                {/* 已匹配或搜索按钮 */}
                {config.googlePlaceId ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1.25,
                      bgcolor: '#f5f5f5',
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#333',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      {config.googlePlaceId}
                    </Typography>
                    <Box
                      component="span"
                      onClick={() => setConfig({ ...config, googlePlaceId: '' })}
                      sx={{
                        fontSize: '0.8rem',
                        color: '#666',
                        cursor: 'pointer',
                        '&:hover': { color: '#333' },
                      }}
                    >
                      {t('common.change')}
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Box
                      onClick={searchingPlaceId ? undefined : handleSearchPlaceId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: 200,
                        gap: 1,
                        px: 1.5,
                        py: 1.25,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        cursor: searchingPlaceId ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': searchingPlaceId ? {} : {
                          bgcolor: '#eee',
                        },
                      }}
                    >
                      {searchingPlaceId ? (
                        <CircularProgress size={14} sx={{ color: '#666' }} />
                      ) : (
                        <SearchIcon sx={{ fontSize: 16, color: '#666' }} />
                      )}
                      <Typography variant="body2" sx={{ color: '#333', fontSize: '0.8rem' }}>
                        {searchingPlaceId
                          ? t('settings.onlineBooking.searchingPlaceId')
                          : t('settings.onlineBooking.autoMatchPlaceId')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {t('settings.onlineBooking.autoMatchPlaceIdDesc')}
                    </Typography>
                  </Box>
                )}

                {/* 搜索结果列表 */}
                {placeSearchResults.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {t('settings.onlineBooking.selectMatchingPlace')}
                    </Typography>
                    {placeSearchResults.map((place) => (
                      <Box
                        key={place.placeId}
                        onClick={() => handleSelectPlace(place.placeId)}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: '#fafafa',
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#f0f0f0' },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
                          {place.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {place.formattedAddress}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* 重新生成链接确认弹框 */}
      <Dialog
        open={openRegenerateDialog}
        onClose={() => setOpenRegenerateDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxWidth: 360,
            mx: isMobile ? 2 : 0,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
          {t('settings.onlineBooking.regenerateConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {t('settings.onlineBooking.regenerateConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            size="small"
            onClick={() => setOpenRegenerateDialog(false)}
            sx={{
              borderRadius: 1.5,
              px: 2,
              fontSize: '0.8125rem',
              color: '#666',
              textTransform: 'none',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={() => {
              generateSlug();
              setOpenRegenerateDialog(false);
            }}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2,
              fontSize: '0.8125rem',
              textTransform: 'none',
              boxShadow: 'none',
              backgroundColor: '#1a1a1a',
              '&:hover': {
                backgroundColor: '#333',
                boxShadow: 'none',
              },
            }}
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: isMobile ? 16 : 24 }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{
            borderRadius: 2,
            width: isMobile ? 'auto' : '100%',
            minWidth: isMobile ? 200 : 280,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            py: isMobile ? 0.5 : 1,
            '& .MuiAlert-icon': {
              fontSize: isMobile ? 18 : 22,
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OnlineBookingTab;
