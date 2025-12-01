import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Collapse,
  LinearProgress,
  alpha,
  Stack,
  Divider,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory2Outlined as PackageIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer, customerApi, serviceApi, packageUsageApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { format, parseISO } from 'date-fns';
import { formatUtcToMerchantTime } from '../../../utils/timezoneUtils';

interface ServiceUsage {
  service_id: number;
  allowed: number;
  used: number;
  remaining: number;
  last_used: string | null;
  service_name?: string;
}

interface UsageLog {
  id: number;
  tenantId: number;
  customerId: number;
  customerPackageId: number;
  packageId: number;
  packageName?: string;
  serviceId: number;
  serviceName?: string;
  appointmentId: number;
  usageType: string;
  quantity?: number;
  remainingBefore?: number;
  remainingAfter?: number;
  usageDate: string;
  staffId?: number;
  staffName?: string;
  notes?: string;
  verificationCodeId?: number;
  createdAt?: string;
}

interface CustomerPackage {
  id: number;
  status: string;
  notes?: string;
  tenant_id: number;
  customer_id: number;
  package_id: number;
  purchase_date: string;
  expiration_date: string;
  purchase_price: number;
  payment_status: string;
  usage_details: ServiceUsage[];
  first_used_at?: string;
  last_used_at?: string;
  completed_at?: string;
  shared_users?: any[];
  is_gift?: boolean;
  gifted_by_customer_id?: number;
  refund_amount?: number;
  refund_date?: string;
  created_at: string;
  updated_at: string;
  package_name?: string;
  package_description?: string;
  days_remaining?: number;
}

interface CustomerPackagesProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onPurchasePackage?: () => void;
}

const CustomerPackages: React.FC<CustomerPackagesProps> = ({
  open,
  onClose,
  customer,
  onPurchasePackage,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#EC4899';
  const THEME_COLOR_LIGHT = isMonochrome ? '#f5f5f5' : 'rgba(236, 72, 153, 0.08)';

  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceMap, setServiceMap] = useState<Map<number, string>>(new Map());
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [showUsageHistory, setShowUsageHistory] = useState<boolean>(false);
  const [showServices, setShowServices] = useState<boolean>(false);
  const [usageLogs, setUsageLogs] = useState<Map<number, UsageLog[]>>(new Map());
  const [loadingLogs, setLoadingLogs] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    if (open && customer?.id && user?.tenantId) {
      loadCustomerPackages();
    }
  }, [open, customer?.id, user?.tenantId]);

  const loadCustomerPackages = async () => {
    if (!customer?.id || !user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const services = await serviceApi.getServices(user.tenantId.toString());
      const newServiceMap = new Map<number, string>();
      services.forEach(service => {
        newServiceMap.set(service.id, service.name);
      });
      setServiceMap(newServiceMap);

      const activePackages = await customerApi.getCustomerActivePackages(
        typeof customer.id === 'string' ? parseInt(customer.id) : customer.id,
        user.tenantId
      );

      const allPackages = await customerApi.getCustomerPackages(
        typeof customer.id === 'string' ? parseInt(customer.id) : customer.id
      );

      const packagesToUse = allPackages.length > 0 ? allPackages : activePackages;

      const enhancedPackages = packagesToUse.map(pkg => ({
        ...pkg,
        usage_details: pkg.usage_details?.map((detail: ServiceUsage) => ({
          ...detail,
          service_name: newServiceMap.get(detail.service_id) || `Service #${detail.service_id}`
        })) || []
      }));

      setPackages(enhancedPackages);
    } catch (err) {
      console.error('Failed to load customer packages:', err);
      setError(t('customers.packageLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expirationDate: string) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 格式化日期（纯日期字段，不涉及时区转换）
  const formatDate = (dateString: string): string => {
    try {
      // parseISO 会将 "2025-11-09" 解析为本地时区的日期，不做时区转换
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy'); // 例如: Nov 9, 2025
    } catch (e) {
      return dateString;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: '#10B981', label: t('packages.status.active') };
      case 'EXPIRED':
        return { color: '#6B7280', label: t('packages.status.expired') };
      case 'COMPLETED':
        return { color: '#3B82F6', label: t('packages.status.completed') };
      case 'CANCELLED':
        return { color: '#EF4444', label: t('packages.status.cancelled') };
      default:
        return { color: '#6B7280', label: status };
    }
  };

  const loadUsageLogs = async (packageId: number, forceReload: boolean = false) => {
    // 如果已有缓存且不强制刷新，则跳过
    if (usageLogs.has(packageId) && !forceReload) {
      return;
    }

    setLoadingLogs(new Map(loadingLogs.set(packageId, true)));

    try {
      const logs = await packageUsageApi.getPackageUsageLogs(packageId);
      const enhancedLogs = logs.map((log: UsageLog) => ({
        ...log,
        serviceName: log.serviceName || serviceMap.get(log.serviceId) || `Service #${log.serviceId}`
      }));
      setUsageLogs(new Map(usageLogs.set(packageId, enhancedLogs)));
    } catch (err) {
      console.error('Failed to load usage logs:', err);
    } finally {
      setLoadingLogs(new Map(loadingLogs.set(packageId, false)));
    }
  };

  const handleToggleUsageHistory = () => {
    const currentPackage = packages[selectedTab];
    if (!currentPackage) return;

    if (showUsageHistory) {
      setShowUsageHistory(false);
    } else {
      setShowUsageHistory(true);
      // 总是强制刷新使用记录，确保显示最新数据
      loadUsageLogs(currentPackage.id, true);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setShowUsageHistory(false);
    setShowServices(false);
  };

  const getUsagePercentage = (used: number, allowed: number) => {
    if (allowed === 0) return 0;
    return (used / allowed) * 100;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxHeight: '85vh',
        }
      }}
    >
      {/* Header - 简约风格 */}
      <Box sx={{
        px: 3,
        py: 2,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        bgcolor: '#fff',
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(THEME_COLOR, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PackageIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {t('packages.title')}
              </Typography>
              {customer && (
                <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>
                  {customer.firstName} {customer.lastName}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#999',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, bgcolor: 'white' }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <CircularProgress size={32} thickness={4} sx={{ color: THEME_COLOR }} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              {t('common.loading')}
            </Typography>
          </Box>
        ) : error ? (
          <Box p={3}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        ) : packages.length === 0 ? (
          <Box textAlign="center" py={8}>
            <PackageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={500}>
              {t('customers.noPackages')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('customers.noPackagesDescription')}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Tabs - 简约风格 */}
            <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', display: 'flex', alignItems: 'center' }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  flex: 1,
                  px: 2,
                  minHeight: 48,
                  '& .MuiTab-root': {
                    minHeight: 48,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#666',
                    py: 1.5,
                    '&.Mui-selected': {
                      color: THEME_COLOR,
                      fontWeight: 600,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: THEME_COLOR,
                    height: 2,
                  },
                }}
              >
                {packages.map((pkg, index) => {
                  const statusConfig = getStatusConfig(pkg.status);
                  return (
                    <Tab
                      key={pkg.id}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="inherit">
                            {pkg.package_name || t('packages.defaultName')}
                          </Typography>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              height: 20,
                              bgcolor: alpha(statusConfig.color, 0.1),
                              color: statusConfig.color,
                              border: 'none',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>
              {!isMobile && onPurchasePackage && (
                <IconButton
                  onClick={onPurchasePackage}
                  size="small"
                  sx={{
                    mx: 2,
                    bgcolor: alpha(THEME_COLOR, 0.1),
                    '&:hover': {
                      bgcolor: alpha(THEME_COLOR, 0.2),
                    }
                  }}
                >
                  <AddIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
                </IconButton>
              )}
            </Box>

            {/* Tab Content */}
            {packages.map((pkg, index) => {
              if (index !== selectedTab) return null;

              const daysRemaining = getDaysRemaining(pkg.expiration_date);
              const totalAllowed = pkg.usage_details?.reduce((sum, s) => sum + s.allowed, 0) || 0;
              const totalUsed = pkg.usage_details?.reduce((sum, s) => sum + s.used, 0) || 0;
              const totalRemaining = pkg.usage_details?.reduce((sum, s) => sum + s.remaining, 0) || 0;
              const usagePercent = getUsagePercentage(totalUsed, totalAllowed);

              return (
                <Box key={pkg.id} sx={{ p: 3, bgcolor: 'white', minHeight: 400 }}>
                  {/* Package Description */}
                  {pkg.package_description && (
                    <Box sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {pkg.package_description}
                      </Typography>
                    </Box>
                  )}

                  {/* Top Stats Cards */}
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    {/* Usage Summary Card */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          {t('packages.usageSummary')}
                        </Typography>
                        <Box display="flex" alignItems="baseline" gap={1} mb={0.5}>
                          <Typography
                            variant="h4"
                            fontWeight={600}
                            sx={{ color: isMonochrome ? '#1a1a1a' : (totalRemaining > 0 ? '#10B981' : '#9CA3AF') }}
                          >
                            {totalRemaining}
                          </Typography>
                          <Typography variant="h5" color="text.secondary" fontWeight={400}>
                            / {totalAllowed}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                          {t('packages.remaining')}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={usagePercent}
                          sx={{
                            width: '100%',
                            height: 4,
                            borderRadius: 2,
                            bgcolor: alpha('#000', 0.06),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                              bgcolor: isMonochrome
                                ? (totalRemaining === 0 ? '#888' : totalRemaining <= totalAllowed * 0.3 ? '#666' : '#1a1a1a')
                                : (totalRemaining === 0 ? '#EF4444' : totalRemaining <= totalAllowed * 0.3 ? '#F59E0B' : '#10B981'),
                            },
                          }}
                        />
                      </Box>
                    </Grid>

                    {/* Date Information Card */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          {t('packages.validity')}
                        </Typography>
                        <Box display="flex" alignItems="baseline" gap={1.5} mb={1}>
                          <Typography variant="h6" fontWeight={600}>
                            {formatDate(pkg.purchase_date)}
                          </Typography>
                          <Typography variant="h6" color="text.disabled">—</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {formatDate(pkg.expiration_date)}
                          </Typography>
                        </Box>
                        {pkg.status === 'ACTIVE' && daysRemaining > 0 && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: 'text.disabled',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {daysRemaining} {t('packages.daysRemaining')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 3 }} />

                  {/* Services - Collapsible */}
                  {pkg.usage_details && pkg.usage_details.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Button
                        fullWidth
                        onClick={() => setShowServices(!showServices)}
                        endIcon={
                          <ExpandMoreIcon
                            sx={{
                              transform: showServices ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        }
                        sx={{
                          py: 1.5,
                          textTransform: 'none',
                          color: 'text.secondary',
                          fontWeight: 500,
                          justifyContent: 'space-between',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: alpha(THEME_COLOR, 0.08),
                          },
                          '&:active': {
                            bgcolor: alpha(THEME_COLOR, 0.12),
                          },
                        }}
                      >
                        {t('packages.includedServices')}
                      </Button>

                      <Collapse in={showServices}>
                        <Box sx={{ mt: 2 }}>
                          <Stack spacing={1.5}>
                            {pkg.usage_details.map((service, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2,
                                  bgcolor: alpha('#F9FAFB', 0.5),
                                  borderRadius: 2,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: alpha('#F9FAFB', 1),
                                  },
                                }}
                              >
                                <Box flex={1}>
                                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    {service.service_name}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box flex={1} maxWidth={200}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={getUsagePercentage(service.used, service.allowed)}
                                        sx={{
                                          height: 4,
                                          borderRadius: 2,
                                          bgcolor: alpha('#000', 0.06),
                                          '& .MuiLinearProgress-bar': {
                                            borderRadius: 2,
                                            bgcolor: isMonochrome
                                              ? (service.remaining === 0 ? '#888' : service.remaining <= service.allowed * 0.3 ? '#666' : '#1a1a1a')
                                              : (service.remaining === 0 ? '#EF4444' : service.remaining <= service.allowed * 0.3 ? '#F59E0B' : '#10B981'),
                                          },
                                        }}
                                      />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
                                      {service.used} / {service.allowed}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ ml: 2 }}>
                                  <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{
                                      textAlign: 'right',
                                      color: service.remaining > 0
                                        ? (isMonochrome ? '#1a1a1a' : '#10B981')
                                        : '#9CA3AF',
                                    }}
                                  >
                                    {service.remaining}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                                    {t('common.remaining')}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Collapse>
                    </Box>
                  )}

                  {/* Notes */}
                  {pkg.notes && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: alpha('#F9FAFB', 0.5), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {t('packages.notes')}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {pkg.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Usage History */}
                  {totalUsed > 0 && (
                    <Box>
                      <Button
                        fullWidth
                        onClick={handleToggleUsageHistory}
                        endIcon={
                          <ExpandMoreIcon
                            sx={{
                              transform: showUsageHistory ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                        }
                        sx={{
                          py: 1.5,
                          textTransform: 'none',
                          color: 'text.secondary',
                          fontWeight: 500,
                          justifyContent: 'space-between',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: alpha(THEME_COLOR, 0.08),
                          },
                          '&:active': {
                            bgcolor: alpha(THEME_COLOR, 0.12),
                          },
                        }}
                      >
                        {t('packages.viewUsageHistory')}
                      </Button>

                      <Collapse in={showUsageHistory}>
                        <Box sx={{ mt: 2 }}>
                          {loadingLogs.get(pkg.id) ? (
                            <Box display="flex" justifyContent="center" py={3}>
                              <CircularProgress size={24} sx={{ color: THEME_COLOR }} />
                            </Box>
                          ) : usageLogs.get(pkg.id)?.length === 0 ? (
                            <Box textAlign="center" py={3}>
                              <Typography variant="body2" color="text.secondary">
                                {t('packages.noUsageHistory')}
                              </Typography>
                            </Box>
                          ) : (
                            <Stack spacing={1}>
                              {usageLogs.get(pkg.id)?.map((log) => (
                                <Box
                                  key={log.id}
                                  sx={{
                                    p: 1.5,
                                    bgcolor: alpha('#F9FAFB', 0.5),
                                    borderRadius: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    '&:hover': {
                                      bgcolor: alpha('#F9FAFB', 1),
                                    },
                                  }}
                                >
                                  <Box flex={1}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {log.serviceName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {log.staffName || '—'} • #{log.appointmentId}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatUtcToMerchantTime(
                                      log.usageDate,
                                      i18n.language === 'zh-CN' ? 'M月d日 HH:mm' : 'MMM d, h:mm a'
                                    )}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPackages;
