import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  alpha,
  CircularProgress,
  Alert,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
  TableFooter,
  useMediaQuery,
  useTheme as useMuiTheme,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Business as AiIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  AttachMoney as CashIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as DebitCardIcon,
  Style as GiftCardIcon,
  CardGiftcard as PackageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import { analyticsApi, appointmentApi } from '../../services/api';
import { getMerchantNow, getMerchantTimezone, merchantTimeToUtc } from '../../utils/timezoneUtils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CurrencyUtils } from '../../config/constants';
import AiBusinessInsights from './components/AiBusinessInsights';

// 颜色主题 - 使用现代化配色
const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#0891B2'];

// 获取支付方式图标
const getPaymentMethodIcon = (method: string) => {
  const iconProps = { sx: { fontSize: '1rem', color: '#64748b' } };
  switch (method?.toUpperCase()) {
    case 'CASH':
      return <CashIcon {...iconProps} />;
    case 'CREDIT_CARD':
      return <CreditCardIcon {...iconProps} />;
    case 'DEBIT_CARD':
      return <DebitCardIcon {...iconProps} />;
    case 'GIFT_CARD':
      return <GiftCardIcon {...iconProps} />;
    case 'PACKAGE':
      return <PackageIcon {...iconProps} />;
    default:
      return undefined;
  }
};

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#0891B2';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#0e7490';

  const [timeRange, setTimeRange] = useState('today');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<any>({});
  const [heatmapView, setHeatmapView] = useState<'week' | 'month'>('week');
  const [orderStatsByService, setOrderStatsByService] = useState<any[]>([]);
  const [orderStatsByServiceCategory, setOrderStatsByServiceCategory] = useState<any[]>([]);
  const [orderStatsByPayment, setOrderStatsByPayment] = useState<any[]>([]);
  const [packagePurchaseStats, setPackagePurchaseStats] = useState<any[]>([]);
  const [orderStatsLoading, setOrderStatsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedPackagePurchasePaymentMethods, setSelectedPackagePurchasePaymentMethods] = useState<string[]>([]);

  // 获取所有唯一的Categories
  const allCategories = useMemo(() => {
    return Array.from(
      new Set(orderStatsByService.map((item: any) => item.serviceCategory || '未分类'))
    ).sort();
  }, [orderStatsByService]);

  // 获取所有唯一的Service Names
  const allServiceNames = useMemo(() => {
    return Array.from(
      new Set(orderStatsByService.map((item: any) => item.serviceName))
    ).sort();
  }, [orderStatsByService]);

  // 获取所有唯一的Payment Methods
  const allPaymentMethods = useMemo(() => {
    return Array.from(
      new Set(orderStatsByPayment.map((item: any) => item.paymentMethod))
    ).sort();
  }, [orderStatsByPayment]);

  // 创建Category到颜色的映射，确保相同的Category使用相同的颜色
  const categoryColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    allCategories.forEach((category, index) => {
      colorMap.set(category, COLORS[index % COLORS.length]);
    });
    return colorMap;
  }, [allCategories]);

  // 筛选后的服务数据
  const filteredOrderStatsByService = useMemo(() => {
    return orderStatsByService.filter((item: any) => {
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.includes(item.serviceCategory || '未分类');
      const serviceNameMatch = selectedServiceNames.length === 0 ||
        selectedServiceNames.includes(item.serviceName);
      return categoryMatch && serviceNameMatch;
    });
  }, [orderStatsByService, selectedCategories, selectedServiceNames]);

  // 筛选后的支付方式数据
  const filteredOrderStatsByPayment = useMemo(() => {
    if (selectedPaymentMethods.length === 0) {
      return orderStatsByPayment;
    }
    return orderStatsByPayment.filter((item: any) =>
      selectedPaymentMethods.includes(item.paymentMethod)
    );
  }, [orderStatsByPayment, selectedPaymentMethods]);

  // 计算服务数据汇总
  const summaryData = useMemo(() => {
    return filteredOrderStatsByService.reduce((acc, item) => ({
      serviceItemCount: acc.serviceItemCount + (item.orderCount || 0), // 销售次数总和
      totalAmount: acc.totalAmount + (item.totalAmount || 0),
      totalSubtotal: acc.totalSubtotal + (item.totalSubtotal || 0),
      totalTax: acc.totalTax + (item.totalTax || 0),
      totalTips: acc.totalTips + (item.totalTips || 0),
    }), {
      serviceItemCount: 0,
      totalAmount: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalTips: 0,
    });
  }, [filteredOrderStatsByService]);

  // 计算支付方式数据汇总
  const paymentSummaryData = useMemo(() => {
    return filteredOrderStatsByPayment.reduce((acc, item) => ({
      orderCount: acc.orderCount + (item.orderCount || 0),
      totalAmount: acc.totalAmount + (item.totalAmount || 0),
      totalSubtotal: acc.totalSubtotal + (item.totalSubtotal || 0),
      totalTax: acc.totalTax + (item.totalTax || 0),
      totalTips: acc.totalTips + (item.totalTips || 0),
    }), {
      orderCount: 0,
      totalAmount: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalTips: 0,
    });
  }, [filteredOrderStatsByPayment]);

  // 获取所有唯一的Package Purchase Payment Methods
  const allPackagePurchasePaymentMethods = useMemo(() => {
    return Array.from(
      new Set(packagePurchaseStats.map((item: any) => item.paymentMethod))
    ).sort();
  }, [packagePurchaseStats]);

  // 筛选后的package购买数据
  const filteredPackagePurchaseStats = useMemo(() => {
    if (selectedPackagePurchasePaymentMethods.length === 0) {
      return packagePurchaseStats;
    }
    return packagePurchaseStats.filter((item: any) =>
      selectedPackagePurchasePaymentMethods.includes(item.paymentMethod)
    );
  }, [packagePurchaseStats, selectedPackagePurchasePaymentMethods]);

  // 计算package购买数据汇总
  const packagePurchaseSummaryData = useMemo(() => {
    return filteredPackagePurchaseStats.reduce((acc, item) => ({
      orderCount: acc.orderCount + (item.orderCount || 0),
      totalAmount: acc.totalAmount + (item.totalAmount || 0),
      totalSubtotal: acc.totalSubtotal + (item.totalSubtotal || 0),
      totalTax: acc.totalTax + (item.totalTax || 0),
      totalTips: acc.totalTips + (item.totalTips || 0),
    }), {
      orderCount: 0,
      totalAmount: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalTips: 0,
    });
  }, [filteredPackagePurchaseStats]);

  // 定义所有tabs及其对应的权限
  const allTabsConfig = [
    // {
    //   key: 'revenue',
    //   label: t('analytics.tabs.revenueTrend'),
    //   icon: <TrendingUpIcon />,
    //   permission: 'analytics:view_revenue' as const,
    // },
    // {
    //   key: 'service',
    //   label: t('analytics.tabs.serviceAnalysis'),
    //   icon: <AssessmentIcon />,
    //   permission: 'analytics:view_service' as const,
    // },
    // {
    //   key: 'staff',
    //   label: t('analytics.tabs.staffPerformance'),
    //   icon: <PeopleIcon />,
    //   permission: 'analytics:view_performance' as const,
    // },
    // {
    //   key: 'heatmap',
    //   label: t('analytics.tabs.appointmentHeatmap'),
    //   icon: <CalendarIcon />,
    //   permission: 'analytics:view_heatmap' as const,
    // },
    // {
    //   key: 'ai',
    //   label: t('analytics.tabs.aiBusinessInsights'),
    //   icon: <AiIcon />,
    //   permission: 'analytics:view_insights' as const,
    // },
    {
      key: 'orders',
      label: t('analytics.tabs.orderStats'),
      icon: <OrdersIcon />,
      permission: 'analytics:view_order_stats' as const,
    },
  ];

  // 根据权限过滤tabs
  const tabsConfig = allTabsConfig.filter(tab => hasPermission(tab.permission));

  // 获取当前选中tab的key
  const currentTabKey = tabsConfig[selectedTab]?.key;

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleHeatmapViewChange = (event: any) => {
    setHeatmapView(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // 获取分析数据
  const fetchAnalyticsData = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const [data, appointments] = await Promise.all([
        analyticsApi.getOverview(user.tenantId, timeRange),
        appointmentApi.getAllAppointments(user.tenantId).catch(() => [])
      ]);

      setAnalyticsData(data);

      // Process appointments for heatmap
      const weekHeatmap: any = {};
      const monthHeatmap: any = {};

      appointments.forEach((apt: any) => {
        const date = new Date(apt.appointmentDate);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOfMonth = date.getDate();
        const hour = parseInt(apt.appointmentTime.split(':')[0]);

        // Week view data
        const weekKey = `${dayOfWeek}-${hour}`;
        weekHeatmap[weekKey] = (weekHeatmap[weekKey] || 0) + 1;

        // Month view data
        const monthKey = `${dayOfMonth}`;
        monthHeatmap[monthKey] = (monthHeatmap[monthKey] || 0) + 1;
      });

      setHeatmapData({ week: weekHeatmap, month: monthHeatmap });
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // 获取订单统计数据
  const fetchOrderStats = async () => {
    if (!user?.tenantId) return;

    setOrderStatsLoading(true);

    try {
      // 获取商户时区
      const merchantTimezone = getMerchantTimezone();

      // 计算日期范围 - 使用商户时区的当前时间
      const endDate = getMerchantNow(merchantTimezone);
      const startDate = new Date(endDate);

      switch (timeRange) {
        case 'today':
          // 今日：开始和结束都是今天（商户时区）
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisWeek':
          // 本周：从周一00:00:00到今天23:59:59（商户时区）
          const dayOfWeek = endDate.getDay();
          const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日是0，周一是1
          startDate.setDate(endDate.getDate() - diffToMonday);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisMonth':
          // 本月：从月初00:00:00到今天23:59:59（商户时区）
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisQuarter':
          // 本季度：从季度初00:00:00到今天23:59:59（商户时区）
          const currentMonth = endDate.getMonth();
          const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
          startDate.setMonth(quarterStartMonth);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisYear':
          // 本年：从年初00:00:00到今天23:59:59（商户时区）
          startDate.setMonth(0);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      // 将商户时区的时间转换为 UTC datetime 字符串
      const startDateTimeUtc = merchantTimeToUtc(startDate, merchantTimezone);
      const endDateTimeUtc = merchantTimeToUtc(endDate, merchantTimezone);

      const [serviceStats, paymentStats, packagePurchaseStats] = await Promise.all([
        analyticsApi.getOrderStatsByService(user.tenantId, startDateTimeUtc, endDateTimeUtc),
        analyticsApi.getOrderStatsByPaymentMethod(user.tenantId, startDateTimeUtc, endDateTimeUtc),
        analyticsApi.getPackagePurchaseStatsByPaymentMethod(user.tenantId, startDateTimeUtc, endDateTimeUtc),
      ]);

      // 按Category分组并排序：先按Category分组，再在每组内按totalAmount降序排序
      const sortedServiceStats = (serviceStats || []).sort((a: any, b: any) => {
        const categoryA = a.serviceCategory || '未分类';
        const categoryB = b.serviceCategory || '未分类';

        // 首先按Category名称排序
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }

        // 相同Category内按totalAmount降序排序
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      });

      setOrderStatsByService(sortedServiceStats);

      // 按服务分类聚合数据用于饼图显示
      const categoryMap = new Map<string, any>();
      (serviceStats || []).forEach((item: any) => {
        const category = item.serviceCategory || '未分类';
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category);
          existing.orderCount += item.orderCount || 0;
          existing.totalSubtotal += item.totalSubtotal || 0;
          existing.totalTax += item.totalTax || 0;
          existing.totalTips += item.totalTips || 0;
          existing.totalAmount += item.totalAmount || 0;
        } else {
          categoryMap.set(category, {
            serviceCategory: category,
            orderCount: item.orderCount || 0,
            totalSubtotal: item.totalSubtotal || 0,
            totalTax: item.totalTax || 0,
            totalTips: item.totalTips || 0,
            totalAmount: item.totalAmount || 0,
          });
        }
      });
      const categoryStats = Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
      setOrderStatsByServiceCategory(categoryStats);

      setOrderStatsByPayment(paymentStats || []);
      setPackagePurchaseStats(packagePurchaseStats || []);

      // 计算卡片数据（基于商户时区的订单统计）
      // 订单销售总额（按支付方式统计的订单总金额）
      const orderSalesTotal = (paymentStats || []).reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
      // 套餐购买总额
      const packagePurchaseTotal = (packagePurchaseStats || []).reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0);
      // 总收入 = 订单销售 + 套餐购买
      const calculatedTotalRevenue = orderSalesTotal + packagePurchaseTotal;
      // 总小费（订单小费 + 套餐购买小费）
      const calculatedTotalTips = (paymentStats || []).reduce((sum: number, item: any) => sum + (item.totalTips || 0), 0) +
                                   (packagePurchaseStats || []).reduce((sum: number, item: any) => sum + (item.totalTips || 0), 0);

      // 更新analyticsData，保留原有数据但覆盖关键指标
      setAnalyticsData((prev: any) => ({
        ...prev,
        totalRevenue: calculatedTotalRevenue,
        orderSalesTotal: orderSalesTotal,
        packagePurchaseTotal: packagePurchaseTotal,
        totalTips: calculatedTotalTips,
      }));
    } catch (err: any) {
      console.error('Failed to fetch order stats:', err);
    } finally {
      setOrderStatsLoading(false);
    }
  };

  useEffect(() => {
    // 获取订单统计数据（用于卡片和订单统计Tab，基于商户时区和时间维度）
    fetchOrderStats();
    setLoading(false);
  }, [user?.tenantId, timeRange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mb={4}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box mb={4}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t('analytics.noDataAvailable')}
        </Alert>
      </Box>
    );
  }

  const {
    totalRevenue = 0,
    orderSalesTotal = 0,
    packagePurchaseTotal = 0,
    totalTips = 0,
    revenueData = [],
    serviceStats = [],
    staffPerformance = [],
    businessMetrics = {}
  } = analyticsData || {};

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {`${t('analytics.dateLabel')}: ${label}`}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb={isMobile ? 2 : 4}>
        <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h1"
              sx={{
                fontWeight: 600,
                color: THEME_COLOR,
                mb: isMobile ? 0 : 0.5,
                fontSize: isMobile ? '1.1rem' : undefined,
              }}
            >
              {t('analytics.title')}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: '#888' }}>
                {t('analytics.subtitle')}
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={2} sx={{ flexShrink: 0, mt: isMobile ? 0.5 : 0 }}>
            <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 140 }}>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              sx={{
                borderRadius: 1.5,
                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(THEME_COLOR, 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: THEME_COLOR,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: THEME_COLOR,
                },
              }}
            >
              <MenuItem value="today" sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>{t('analytics.timePeriods.today')}</MenuItem>
              <MenuItem value="thisWeek" sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>{t('analytics.timePeriods.thisWeek')}</MenuItem>
              <MenuItem value="thisMonth" sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>{t('analytics.timePeriods.thisMonth')}</MenuItem>
              <MenuItem value="thisQuarter" sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>{t('analytics.timePeriods.thisQuarter')}</MenuItem>
              <MenuItem value="thisYear" sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}>{t('analytics.timePeriods.thisYear')}</MenuItem>
            </Select>
          </FormControl>
          </Box>
        </Box>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={isMobile ? 1.5 : 2.5} mb={isMobile ? 2 : 4}>
        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: isMobile ? 2 : 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
              <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 36 : 44,
                    height: isMobile ? 36 : 44,
                    borderRadius: 1.5,
                    bgcolor: alpha(isMonochrome ? '#1a1a1a' : '#10B981', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#10B981',
                    flexShrink: 0,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: isMobile ? 18 : 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.65rem' : '0.75rem', mb: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('analytics.totalRevenue')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1rem' : '1.25rem', lineHeight: 1.2 }}>
                    {CurrencyUtils.formatAmountWithCommas(totalRevenue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: isMobile ? 2 : 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
              <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 36 : 44,
                    height: isMobile ? 36 : 44,
                    borderRadius: 1.5,
                    bgcolor: alpha(isMonochrome ? '#1a1a1a' : '#8B5CF6', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                    flexShrink: 0,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: isMobile ? 18 : 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.65rem' : '0.75rem', mb: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('analytics.packagePurchaseTotal')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1rem' : '1.25rem', lineHeight: 1.2 }}>
                    {CurrencyUtils.formatAmountWithCommas(packagePurchaseTotal)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: isMobile ? 2 : 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
              <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 36 : 44,
                    height: isMobile ? 36 : 44,
                    borderRadius: 1.5,
                    bgcolor: alpha(isMonochrome ? '#1a1a1a' : '#6366F1', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#6366F1',
                    flexShrink: 0,
                  }}
                >
                  <OrdersIcon sx={{ fontSize: isMobile ? 18 : 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.65rem' : '0.75rem', mb: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('analytics.orderSalesTotal')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1rem' : '1.25rem', lineHeight: 1.2 }}>
                    {CurrencyUtils.formatAmountWithCommas(orderSalesTotal)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: isMobile ? 2 : 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
              <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2.5}>
                <Box
                  sx={{
                    width: isMobile ? 36 : 44,
                    height: isMobile ? 36 : 44,
                    borderRadius: 1.5,
                    bgcolor: alpha(isMonochrome ? '#1a1a1a' : '#F59E0B', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isMonochrome ? '#1a1a1a' : '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: isMobile ? 18 : 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: isMobile ? '0.65rem' : '0.75rem', mb: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('analytics.totalTips')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1rem' : '1.25rem', lineHeight: 1.2 }}>
                    {CurrencyUtils.formatAmountWithCommas(totalTips)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab 导航 */}
      <Box mb={isMobile ? 2 : 3}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'scrollable'}
          scrollButtons="auto"
          sx={{
            borderBottom: '2px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              textTransform: 'none',
              minHeight: isMobile ? 44 : 56,
              py: isMobile ? 1 : 1.5,
              '&.Mui-selected': {
                fontWeight: 600,
                color: THEME_COLOR,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: THEME_COLOR,
            },
          }}
        >
          {tabsConfig.map((tab, index) => (
            <Tab
              key={index}
              icon={isMobile ? undefined : tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab 内容 */}
      <Card
        sx={{
          borderRadius: isMobile ? 2 : 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >

        {/* 收入趋势 */}
        {currentTabKey === 'revenue' && (
        <Box sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('analytics.charts.revenueOrderTrend')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    name={t('analytics.chartLabels.revenue')}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fill="url(#ordersGradient)"
                    name={t('analytics.chartLabels.orders')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </Box>
        )}

        {/* 服务分析 */}
        {currentTabKey === 'service' && (
        <Box sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('analytics.charts.serviceRevenueDistribution')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={serviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="percentage"
                    nameKey="serviceName"
                  >
                    {serviceStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('analytics.charts.serviceRevenueRanking')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={serviceStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                  <XAxis
                    dataKey="serviceName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [CurrencyUtils.formatAmountWithCommas(value), t('analytics.chartLabels.income')]}
                  />
                  <Bar dataKey="totalRevenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </Box>
        )}

        {/* 员工表现 */}
        {currentTabKey === 'staff' && (
        <Box sx={{ pt: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                width: 6,
                height: 24,
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                borderRadius: 1,
                mr: 2,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('analytics.charts.staffPerformanceRanking')}
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('analytics.tableHeaders.staff')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>{t('analytics.tableHeaders.revenue')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>{t('analytics.tableHeaders.orders')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>{t('analytics.tableHeaders.rating')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>{t('analytics.tableHeaders.efficiency')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('analytics.tableHeaders.mainServices')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffPerformance.map((resource: any) => (
                  <TableRow key={resource.staffId} sx={{ '&:hover': { backgroundColor: alpha('#8B5CF6', 0.04) } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                          bgcolor: resource.resourceType === 'ROOM' ? '#EC4899' : '#8B5CF6', 
                          width: 32, 
                          height: 32 
                        }}>
                          {resource.resourceType === 'ROOM' ? 'R' : resource.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {resource.staffName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {resource.resourceType === 'ROOM' ? t('resources.type.room') : t('resources.type.staff')}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                        {CurrencyUtils.formatAmountWithCommas(resource.totalRevenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {resource.orderCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {resource.avgRating}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={resource.efficiencyScore}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha('#8B5CF6', 0.2),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8B5CF6',
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                          {resource.efficiencyScore}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {resource.topServices?.map((service: string, index: number) => (
                          <Chip
                            key={index}
                            label={service}
                            size="small"
                            sx={{
                              backgroundColor: alpha(COLORS[index % COLORS.length], 0.1),
                              color: COLORS[index % COLORS.length],
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        )}

        {/* 预约热力图 */}
        {currentTabKey === 'heatmap' && (
        <Box sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('analytics.appointmentHeatmap.title')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('analytics.appointmentHeatmap.subtitle')}
                      </Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={heatmapView}
                        onChange={handleHeatmapViewChange}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="week">{t('analytics.appointmentHeatmap.weekly')}</MenuItem>
                        <MenuItem value="month">{t('analytics.appointmentHeatmap.monthly')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 热力图主体 */}
                  <Box sx={{ overflowX: 'auto' }}>
                    {heatmapView === 'week' ? (
                      // 周视图
                      <Box sx={{ minWidth: 900, display: 'grid', gridTemplateColumns: 'auto repeat(7, 1fr)', gap: 1 }}>
                        {/* 星期标题 */}
                        <Box />
                        {[
                          t('staff.weekdays.monday'),
                          t('staff.weekdays.tuesday'),
                          t('staff.weekdays.wednesday'),
                          t('staff.weekdays.thursday'),
                          t('staff.weekdays.friday'),
                          t('staff.weekdays.saturday'),
                          t('staff.weekdays.sunday'),
                        ].map((day, index) => (
                          <Box key={index} sx={{ textAlign: 'center', py: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {day}
                            </Typography>
                          </Box>
                        ))}
                      
                      {/* 时段热力图 */}
                      {Array.from({ length: 14 }, (_, hour) => hour + 8).map((hour) => (
                        <React.Fragment key={hour}>
                          <Box sx={{ pr: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Typography variant="caption" color="text.secondary">
                              {`${hour}:00`}
                            </Typography>
                          </Box>
                          {Array.from({ length: 7 }, (_, day) => {
                            // Monday = 1, Tuesday = 2, ... Sunday = 0
                            // Reorder to match our display (Monday first)
                            const dayIndex = day === 6 ? 0 : day + 1;
                            const key = `${dayIndex}-${hour}`;
                            const appointments = heatmapData.week?.[key] || 0;
                            const maxAppointments = Math.max(...Object.values(heatmapData.week || {}).map((v: any) => Number(v) || 0), 15);
                            const intensity = appointments / maxAppointments;
                            const getColor = (intensity: number) => {
                              if (intensity > 0.8) return '#DC2626';
                              if (intensity > 0.6) return '#EA580C';
                              if (intensity > 0.4) return '#F59E0B';
                              if (intensity > 0.2) return '#84CC16';
                              if (intensity > 0) return '#10B981';
                              return '#E5E7EB';
                            };
                            
                            return (
                              <Box
                                key={`${day}-${hour}`}
                                sx={{
                                  height: 40,
                                  backgroundColor: getColor(intensity),
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: intensity > 0 ? 0.9 : 0.3,
                                  transition: 'all 0.2s',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  '&:hover': {
                                    opacity: 1,
                                    transform: 'scale(1.05)',
                                    zIndex: 1,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  },
                                }}
                              >
                                {appointments > 0 && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: intensity > 0.4 ? 'white' : 'text.primary',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {appointments}
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </Box>
                    ) : (
                      // 月视图
                      <Box>
                        <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                          {getMerchantNow().toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                          {/* 星期标题 */}
                          {[
                            t('staff.weekdays.sunday'),
                            t('staff.weekdays.monday'),
                            t('staff.weekdays.tuesday'),
                            t('staff.weekdays.wednesday'),
                            t('staff.weekdays.thursday'),
                            t('staff.weekdays.friday'),
                            t('staff.weekdays.saturday'),
                          ].map((day, index) => (
                            <Box key={index} sx={{ textAlign: 'center', py: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                {day.substring(0, 2)}
                              </Typography>
                            </Box>
                          ))}
                          
                          {/* 生成月份日历 */}
                          {(() => {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = now.getMonth();
                            const firstDay = new Date(year, month, 1);
                            const lastDay = new Date(year, month + 1, 0);
                            const startPadding = firstDay.getDay();
                            const daysInMonth = lastDay.getDate();
                            
                            const days = [];
                            
                            // 添加月初的空白天
                            for (let i = 0; i < startPadding; i++) {
                              days.push(
                                <Box key={`empty-${i}`} sx={{ height: 60 }} />
                              );
                            }
                            
                            // 添加月份的每一天
                            for (let day = 1; day <= daysInMonth; day++) {
                              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              // 使用真实的预约数据
                              const appointments = heatmapData.month?.[day] || 0;
                              const maxAppointments = Math.max(...Object.values(heatmapData.month || {}).map((v: any) => Number(v) || 0), 10);
                              const intensity = maxAppointments > 0 ? appointments / maxAppointments : 0;
                              
                              const getColor = (intensity: number) => {
                                if (intensity > 0.8) return '#DC2626';
                                if (intensity > 0.6) return '#EA580C';
                                if (intensity > 0.4) return '#F59E0B';
                                if (intensity > 0.2) return '#84CC16';
                                if (intensity > 0) return '#10B981';
                                return '#F3F4F6';
                              };
                              
                              days.push(
                                <Box
                                  key={day}
                                  sx={{
                                    height: 60,
                                    backgroundColor: getColor(intensity),
                                    borderRadius: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    },
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {day}
                                  </Typography>
                                  {appointments > 0 && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        fontSize: '0.65rem',
                                        color: intensity > 0.4 ? 'white' : 'text.secondary'
                                      }}
                                    >
                                      {appointments}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            }
                            
                            return days;
                          })()}
                        </Box>
                      </Box>
                    )}
                    
                    {/* 图例和统计 */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            {t('analytics.appointmentHeatmap.legend')}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 20, height: 20, bgcolor: '#E5E7EB', borderRadius: 0.5 }} />
                              <Typography variant="caption">{t('analytics.appointmentHeatmap.empty')}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 20, height: 20, bgcolor: '#10B981', borderRadius: 0.5 }} />
                              <Typography variant="caption">{t('analytics.appointmentHeatmap.low')}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 20, height: 20, bgcolor: '#F59E0B', borderRadius: 0.5 }} />
                              <Typography variant="caption">{t('analytics.appointmentHeatmap.medium')}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 20, height: 20, bgcolor: '#DC2626', borderRadius: 0.5 }} />
                              <Typography variant="caption">{t('analytics.appointmentHeatmap.high')}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            {t('analytics.appointmentHeatmap.insights')}
                          </Typography>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              • {t('analytics.appointmentHeatmap.peakTime')}: <strong>14:00-16:00</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              • {t('analytics.appointmentHeatmap.quietTime')}: <strong>8:00-10:00</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • {t('analytics.appointmentHeatmap.busiestDay')}: <strong>{t('staff.weekdays.saturday')}</strong>
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        )}

        {/* AI 业务洞察 */}
        {currentTabKey === 'ai' && (
        <Box sx={{ pt: 3 }}>
          <AiBusinessInsights />
        </Box>
        )}

        {/* 订单统计 */}
        {currentTabKey === 'orders' && (
        <Box sx={{ pt: isMobile ? 2 : 3, px: isMobile ? 1.5 : 0 }}>
          {orderStatsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress size={60} />
            </Box>
          ) : (
            <Grid container spacing={isMobile ? 2 : 3}>
              {/* 按服务维度统计 */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5}>
                  <Box
                    sx={{
                      width: isMobile ? 3 : 4,
                      height: isMobile ? 16 : 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#6366F1',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                    {t('analytics.orderStats.byService')}
                  </Typography>
                </Box>

                <Grid container spacing={isMobile ? 1.5 : 2.5}>
                  {/* 饼图 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                          {t('analytics.orderStats.serviceRevenueDistribution')}
                        </Typography>
                        {orderStatsByServiceCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                            <PieChart>
                              <Pie
                                data={orderStatsByServiceCategory}
                                cx="50%"
                                cy="50%"
                                innerRadius={isMobile ? 40 : 60}
                                outerRadius={isMobile ? 70 : 100}
                                paddingAngle={2}
                                dataKey="totalAmount"
                                nameKey="serviceCategory"
                                label={({ serviceCategory, totalAmount }) =>
                                  `${serviceCategory}: ${CurrencyUtils.formatAmountWithCommas(totalAmount)}`
                                }
                              >
                                {orderStatsByServiceCategory.map((entry: any, index: number) => {
                                  const category = entry.serviceCategory || '未分类';
                                  const categoryColor = categoryColorMap.get(category) || COLORS[index % COLORS.length];
                                  return (
                                    <Cell key={`cell-${index}`} fill={categoryColor} />
                                  );
                                })}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => CurrencyUtils.formatAmountWithCommas(value)}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                            <Typography variant="body2" color="text.secondary">
                              {t('analytics.noDataAvailable')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 柱状图 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                          {t('analytics.orderStats.serviceOrderCount')}
                        </Typography>
                        {orderStatsByServiceCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                            <BarChart data={orderStatsByServiceCategory}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                              <XAxis
                                dataKey="serviceCategory"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isMobile ? 9 : 11, fill: '#999' }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isMobile ? 9 : 11, fill: '#999' }}
                              />
                              <Tooltip />
                              <Bar dataKey="orderCount" radius={[4, 4, 0, 0]}>
                                {orderStatsByServiceCategory.map((entry: any, index: number) => {
                                  const category = entry.serviceCategory || '未分类';
                                  const categoryColor = categoryColorMap.get(category) || COLORS[index % COLORS.length];
                                  return (
                                    <Cell key={`cell-${index}`} fill={categoryColor} />
                                  );
                                })}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height={isMobile ? 220 : 300}>
                            <Typography variant="body2" color="text.secondary">
                              {t('analytics.noDataAvailable')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 服务统计表格 */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        {/* Category筛选器 */}
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1.5 : 0} mb={2}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.8rem' : undefined }}>
                            {t('analytics.orderStats.serviceDetails')}
                          </Typography>
                          <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1 : 2} alignItems={isMobile ? 'stretch' : 'center'} width={isMobile ? '100%' : 'auto'}>
                            <FormControl size="small" sx={{ minWidth: isMobile ? undefined : 180, width: isMobile ? '100%' : 'auto' }}>
                              <Select
                                multiple
                                displayEmpty
                                value={selectedCategories}
                                onChange={(e) => setSelectedCategories(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                  if (selected.length === 0) {
                                    return (
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                          {t('analytics.orderStats.allCategories')}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                      {selected.slice(0, 2).map((cat) => (
                                        <Chip
                                          key={cat}
                                          label={cat}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha(categoryColorMap.get(cat) || COLORS[0], 0.15),
                                            color: categoryColorMap.get(cat) || COLORS[0],
                                            fontWeight: 500,
                                          }}
                                        />
                                      ))}
                                      {selected.length > 2 && (
                                        <Chip
                                          label={`+${selected.length - 2}`}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha(THEME_COLOR, 0.1),
                                            color: THEME_COLOR,
                                            fontWeight: 500,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  );
                                }}
                                sx={{
                                  borderRadius: 1.5,
                                  fontSize: '0.875rem',
                                  backgroundColor: '#fafbfc',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha('#cbd5e1', 0.5),
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: THEME_COLOR,
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: THEME_COLOR,
                                    borderWidth: 1,
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 2,
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                      mt: 0.5,
                                      maxHeight: 320,
                                    }
                                  }
                                }}
                              >
                                {allCategories.map((category) => (
                                  <MenuItem
                                    key={category}
                                    value={category}
                                    sx={{
                                      py: 1,
                                      px: 2,
                                      '&:hover': {
                                        backgroundColor: alpha(THEME_COLOR, 0.05),
                                      },
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedCategories.indexOf(category) > -1}
                                      size="small"
                                      sx={{
                                        p: 0,
                                        mr: 1.5,
                                        '&.Mui-checked': {
                                          color: THEME_COLOR,
                                        }
                                      }}
                                    />
                                    <ListItemText
                                      primary={category}
                                      primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: categoryColorMap.get(category) || COLORS[0],
                                        ml: 1,
                                      }}
                                    />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: isMobile ? undefined : 180, width: isMobile ? '100%' : 'auto' }}>
                              <Select
                                multiple
                                displayEmpty
                                value={selectedServiceNames}
                                onChange={(e) => setSelectedServiceNames(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                  if (selected.length === 0) {
                                    return (
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                          {t('analytics.orderStats.allServices')}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                      {selected.slice(0, 2).map((service) => (
                                        <Chip
                                          key={service}
                                          label={service}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha(THEME_COLOR, 0.1),
                                            color: THEME_COLOR,
                                            fontWeight: 500,
                                          }}
                                        />
                                      ))}
                                      {selected.length > 2 && (
                                        <Chip
                                          label={`+${selected.length - 2}`}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha(THEME_COLOR, 0.1),
                                            color: THEME_COLOR,
                                            fontWeight: 500,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  );
                                }}
                                sx={{
                                  borderRadius: 1.5,
                                  fontSize: '0.875rem',
                                  backgroundColor: '#fafbfc',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha('#cbd5e1', 0.5),
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: THEME_COLOR,
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: THEME_COLOR,
                                    borderWidth: 1,
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 2,
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                      mt: 0.5,
                                      maxHeight: 320,
                                    }
                                  }
                                }}
                              >
                                {allServiceNames.map((serviceName) => (
                                  <MenuItem
                                    key={serviceName}
                                    value={serviceName}
                                    sx={{
                                      py: 1,
                                      px: 2,
                                      '&:hover': {
                                        backgroundColor: alpha(THEME_COLOR, 0.05),
                                      },
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedServiceNames.indexOf(serviceName) > -1}
                                      size="small"
                                      sx={{
                                        p: 0,
                                        mr: 1.5,
                                        '&.Mui-checked': {
                                          color: THEME_COLOR,
                                        }
                                      }}
                                    />
                                    <ListItemText
                                      primary={serviceName}
                                      primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                      }}
                                    />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            {(selectedCategories.length > 0 || selectedServiceNames.length > 0) && (
                              <Button
                                size="small"
                                onClick={() => {
                                  setSelectedCategories([]);
                                  setSelectedServiceNames([]);
                                }}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.875rem',
                                  color: '#64748b',
                                  borderColor: alpha('#cbd5e1', 0.5),
                                  px: 2,
                                  '&:hover': {
                                    backgroundColor: alpha('#f1f5f9', 0.8),
                                    borderColor: THEME_COLOR,
                                    color: THEME_COLOR,
                                  }
                                }}
                                variant="outlined"
                              >
                                {t('analytics.orderStats.clearFilter')}
                              </Button>
                            )}
                          </Box>
                        </Box>

                        <TableContainer sx={{ overflowX: 'auto' }}>
                          <Table size="small" sx={{ minWidth: isMobile ? 500 : 'auto' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{
                                  fontWeight: 600,
                                  color: '#666',
                                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                                  py: isMobile ? 1 : 1.5,
                                  fontSize: isMobile ? '0.7rem' : undefined,
                                  position: isMobile ? 'sticky' : 'static',
                                  left: 0,
                                  bgcolor: '#fff',
                                  zIndex: 1,
                                  minWidth: isMobile ? 100 : 'auto',
                                  boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                }}>{t('analytics.orderStats.serviceName')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.category')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.salesCount')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.originalPrice')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>
                                  {t('analytics.orderStats.totalAmount')}
                                  {!isMobile && (
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.6rem', display: 'block' }}>
                                      ({t('analytics.actualPaymentAmount')})
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.tips')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredOrderStatsByService.map((row: any, index: number) => {
                                const category = row.serviceCategory || '未分类';
                                const categoryColor = categoryColorMap.get(category) || COLORS[0];
                                return (
                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                                  <TableCell sx={{
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    py: isMobile ? 1 : 1.5,
                                    color: '#1a1a1a',
                                    fontSize: isMobile ? '0.75rem' : undefined,
                                    position: isMobile ? 'sticky' : 'static',
                                    left: 0,
                                    bgcolor: '#fff',
                                    zIndex: 1,
                                    boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                  }}>{row.serviceName}</TableCell>
                                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                    <Typography variant="caption" sx={{ color: categoryColor, fontWeight: 500, fontSize: isMobile ? '0.7rem' : undefined }}>
                                      {row.serviceCategory || '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#1a1a1a', fontSize: isMobile ? '0.75rem' : undefined }}>{row.orderCount}</TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#666', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {row.originalPrice ? CurrencyUtils.formatAmountWithCommas(row.originalPrice) : '-'}
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {CurrencyUtils.formatAmountWithCommas(row.totalAmount || 0)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#F59E0B', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {CurrencyUtils.formatAmountWithCommas(row.totalTips || 0)}
                                  </TableCell>
                                </TableRow>
                                );
                              })}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell sx={{
                                  fontWeight: 600,
                                  color: '#1a1a1a',
                                  borderTop: '1px solid rgba(0,0,0,0.08)',
                                  py: isMobile ? 1 : 1.5,
                                  fontSize: isMobile ? '0.75rem' : undefined,
                                  position: isMobile ? 'sticky' : 'static',
                                  left: 0,
                                  bgcolor: '#fff',
                                  zIndex: 1,
                                  boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                }}>
                                  {t('analytics.orderStats.total')}
                                </TableCell>
                                <TableCell sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5 }}></TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {summaryData.serviceItemCount}
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#999', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  -
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {CurrencyUtils.formatAmountWithCommas(summaryData.totalAmount)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#F59E0B', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {CurrencyUtils.formatAmountWithCommas(summaryData.totalTips)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* 按支付方式统计 */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5} mt={isMobile ? 2 : 3}>
                  <Box
                    sx={{
                      width: isMobile ? 3 : 4,
                      height: isMobile ? 16 : 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#10B981',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                    {t('analytics.orderStats.byPaymentMethod')}
                  </Typography>
                </Box>

                <Grid container spacing={isMobile ? 1.5 : 2.5}>
                  {/* 饼图 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                          {t('analytics.orderStats.paymentMethodDistribution')}
                        </Typography>
                        {orderStatsByPayment.length > 0 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                            <PieChart>
                              <Pie
                                data={orderStatsByPayment}
                                cx="50%"
                                cy="50%"
                                innerRadius={isMobile ? 40 : 60}
                                outerRadius={isMobile ? 70 : 100}
                                paddingAngle={2}
                                dataKey="totalAmount"
                                nameKey="paymentMethod"
                                label={({ paymentMethod, totalAmount }) =>
                                  `${paymentMethod}: ${CurrencyUtils.formatAmountWithCommas(totalAmount)}`
                                }
                              >
                                {orderStatsByPayment.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => CurrencyUtils.formatAmountWithCommas(value)}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                            <Typography variant="body2" color="text.secondary">
                              {t('analytics.noDataAvailable')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 柱状图 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                          {t('analytics.orderStats.paymentMethodOrderCount')}
                        </Typography>
                        {orderStatsByPayment.length > 0 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                            <BarChart data={orderStatsByPayment}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                              <XAxis
                                dataKey="paymentMethod"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isMobile ? 9 : 11, fill: '#999' }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isMobile ? 9 : 11, fill: '#999' }}
                              />
                              <Tooltip />
                              <Bar dataKey="orderCount" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                            <Typography variant="body2" color="text.secondary">
                              {t('analytics.noDataAvailable')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 支付方式统计表格 */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        {/* Payment Method筛选器 */}
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1.5 : 0} mb={2}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.8rem' : undefined }}>
                            {t('analytics.orderStats.paymentMethodDetails')}
                          </Typography>
                          <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1 : 2} alignItems={isMobile ? 'stretch' : 'center'} width={isMobile ? '100%' : 'auto'}>
                            <FormControl size="small" sx={{ minWidth: isMobile ? undefined : 180, width: isMobile ? '100%' : 'auto' }}>
                              <Select
                                multiple
                                displayEmpty
                                value={selectedPaymentMethods}
                                onChange={(e) => setSelectedPaymentMethods(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                  if (selected.length === 0) {
                                    return (
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                          {t('analytics.orderStats.allPaymentMethods')}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                      {selected.slice(0, 2).map((method) => (
                                        <Chip
                                          key={method}
                                          label={method}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha('#10B981', 0.1),
                                            color: '#10B981',
                                            fontWeight: 500,
                                          }}
                                        />
                                      ))}
                                      {selected.length > 2 && (
                                        <Chip
                                          label={`+${selected.length - 2}`}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha('#10B981', 0.1),
                                            color: '#10B981',
                                            fontWeight: 500,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  );
                                }}
                                sx={{
                                  borderRadius: 1.5,
                                  fontSize: '0.875rem',
                                  backgroundColor: '#fafbfc',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha('#cbd5e1', 0.5),
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10B981',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10B981',
                                    borderWidth: 1,
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 2,
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                      mt: 0.5,
                                      maxHeight: 320,
                                    }
                                  }
                                }}
                              >
                                {allPaymentMethods.map((paymentMethod) => (
                                  <MenuItem
                                    key={paymentMethod}
                                    value={paymentMethod}
                                    sx={{
                                      py: 1,
                                      px: 2,
                                      '&:hover': {
                                        backgroundColor: alpha('#10B981', 0.05),
                                      },
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedPaymentMethods.indexOf(paymentMethod) > -1}
                                      size="small"
                                      sx={{
                                        p: 0,
                                        mr: 1.5,
                                        '&.Mui-checked': {
                                          color: '#10B981',
                                        }
                                      }}
                                    />
                                    <ListItemText
                                      primary={paymentMethod}
                                      primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                      }}
                                    />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {selectedPaymentMethods.length > 0 && (
                              <Button
                                size="small"
                                onClick={() => setSelectedPaymentMethods([])}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.875rem',
                                  color: '#64748b',
                                  borderColor: alpha('#cbd5e1', 0.5),
                                  px: 2,
                                  '&:hover': {
                                    backgroundColor: alpha('#f1f5f9', 0.8),
                                    borderColor: '#10B981',
                                    color: '#10B981',
                                  }
                                }}
                                variant="outlined"
                              >
                                {t('analytics.orderStats.clearFilter')}
                              </Button>
                            )}
                          </Box>
                        </Box>

                        <TableContainer sx={{ overflowX: 'auto' }}>
                          <Table size="small" sx={{ minWidth: isMobile ? 380 : 'auto' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{
                                  fontWeight: 600,
                                  color: '#666',
                                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                                  py: isMobile ? 1 : 1.5,
                                  fontSize: isMobile ? '0.7rem' : undefined,
                                  position: isMobile ? 'sticky' : 'static',
                                  left: 0,
                                  bgcolor: '#fff',
                                  zIndex: 1,
                                  minWidth: isMobile ? 90 : 'auto',
                                  boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                }}>{t('analytics.orderStats.paymentMethod')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.paymentCount')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>
                                  {t('analytics.orderStats.totalAmount')}
                                  {!isMobile && (
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.6rem', display: 'block' }}>
                                      ({t('analytics.actualPaymentAmount')})
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.tips')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredOrderStatsByPayment.map((row: any, index: number) => (
                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                                  <TableCell sx={{
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    py: isMobile ? 1 : 1.5,
                                    position: isMobile ? 'sticky' : 'static',
                                    left: 0,
                                    bgcolor: '#fff',
                                    zIndex: 1,
                                    boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                  }}>
                                    <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1}>
                                      {!isMobile && getPaymentMethodIcon(row.paymentMethod)}
                                      <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: isMobile ? '0.75rem' : undefined }}>
                                        {row.paymentMethod}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#1a1a1a', fontSize: isMobile ? '0.75rem' : undefined }}>{row.orderCount}</TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {CurrencyUtils.formatAmountWithCommas(row.totalAmount)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#F59E0B', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {CurrencyUtils.formatAmountWithCommas(row.totalTips || 0)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell sx={{
                                  fontWeight: 600,
                                  color: '#1a1a1a',
                                  borderTop: '1px solid rgba(0,0,0,0.08)',
                                  py: isMobile ? 1 : 1.5,
                                  fontSize: isMobile ? '0.75rem' : undefined,
                                  position: isMobile ? 'sticky' : 'static',
                                  left: 0,
                                  bgcolor: '#fff',
                                  zIndex: 1,
                                  boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                }}>
                                  {t('analytics.orderStats.total')}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {paymentSummaryData.orderCount}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {CurrencyUtils.formatAmountWithCommas(paymentSummaryData.totalAmount)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#F59E0B', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {CurrencyUtils.formatAmountWithCommas(paymentSummaryData.totalTips)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* 按支付方式统计Package购买 */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={isMobile ? 2 : 2.5} mt={isMobile ? 2 : 3}>
                  <Box
                    sx={{
                      width: isMobile ? 3 : 4,
                      height: isMobile ? 16 : 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                    {t('analytics.orderStats.packagePurchaseStats')}
                  </Typography>
                </Box>

                <Grid container spacing={isMobile ? 1.5 : 2.5}>
                  {/* 饼图 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                          {t('analytics.orderStats.packagePurchaseDistribution')}
                        </Typography>
                        {packagePurchaseStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                            <PieChart>
                              <Pie
                                data={packagePurchaseStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={isMobile ? 40 : 60}
                                outerRadius={isMobile ? 70 : 100}
                                paddingAngle={2}
                                dataKey="totalAmount"
                                nameKey="paymentMethod"
                                label={({ paymentMethod, totalAmount }) =>
                                  `${paymentMethod}: ${CurrencyUtils.formatAmountWithCommas(totalAmount)}`
                                }
                              >
                                {packagePurchaseStats.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => CurrencyUtils.formatAmountWithCommas(value)}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                            <Typography variant="body2" color="text.secondary">
                              {t('analytics.noDataAvailable')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 柱状图 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                          {t('analytics.orderStats.packagePurchaseCount')}
                        </Typography>
                        {packagePurchaseStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                            <BarChart data={packagePurchaseStats}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                              <XAxis
                                dataKey="paymentMethod"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isMobile ? 9 : 11, fill: '#999' }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: isMobile ? 9 : 11, fill: '#999' }}
                              />
                              <Tooltip />
                              <Bar dataKey="orderCount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                            <Typography variant="body2" color="text.secondary">
                              {t('analytics.noDataAvailable')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Package购买统计表格 */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: isMobile ? 2 : 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', bgcolor: '#fff' }}>
                      <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        {/* Payment Method筛选器 */}
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1.5 : 0} mb={2}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.8rem' : undefined }}>
                            {t('analytics.orderStats.packagePurchaseDetails')}
                          </Typography>
                          <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1 : 2} alignItems={isMobile ? 'stretch' : 'center'} width={isMobile ? '100%' : 'auto'}>
                            <FormControl size="small" sx={{ minWidth: isMobile ? undefined : 180, width: isMobile ? '100%' : 'auto' }}>
                              <Select
                                multiple
                                displayEmpty
                                value={selectedPackagePurchasePaymentMethods}
                                onChange={(e) => setSelectedPackagePurchasePaymentMethods(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                input={<OutlinedInput />}
                                renderValue={(selected) => {
                                  if (selected.length === 0) {
                                    return (
                                      <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                          {t('analytics.orderStats.allPaymentMethods')}
                                        </Typography>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                      {selected.slice(0, 2).map((method) => (
                                        <Chip
                                          key={method}
                                          label={method}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha('#8B5CF6', 0.1),
                                            color: '#8B5CF6',
                                            fontWeight: 500,
                                          }}
                                        />
                                      ))}
                                      {selected.length > 2 && (
                                        <Chip
                                          label={`+${selected.length - 2}`}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.75rem',
                                            backgroundColor: alpha('#8B5CF6', 0.1),
                                            color: '#8B5CF6',
                                            fontWeight: 500,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  );
                                }}
                                sx={{
                                  borderRadius: 1.5,
                                  fontSize: '0.875rem',
                                  backgroundColor: '#fafbfc',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha('#cbd5e1', 0.5),
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#8B5CF6',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#8B5CF6',
                                    borderWidth: 1,
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 2,
                                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                      mt: 0.5,
                                      maxHeight: 320,
                                    }
                                  }
                                }}
                              >
                                {allPackagePurchasePaymentMethods.map((paymentMethod) => (
                                  <MenuItem
                                    key={paymentMethod}
                                    value={paymentMethod}
                                    sx={{
                                      py: 1,
                                      px: 2,
                                      '&:hover': {
                                        backgroundColor: alpha('#8B5CF6', 0.05),
                                      },
                                      '&.Mui-selected': {
                                        backgroundColor: alpha('#8B5CF6', 0.08),
                                        '&:hover': {
                                          backgroundColor: alpha('#8B5CF6', 0.12),
                                        },
                                      },
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedPackagePurchasePaymentMethods.indexOf(paymentMethod) > -1}
                                      sx={{
                                        color: alpha('#8B5CF6', 0.4),
                                        '&.Mui-checked': {
                                          color: '#8B5CF6',
                                        },
                                      }}
                                    />
                                    <ListItemText
                                      primary={paymentMethod}
                                      sx={{
                                        '& .MuiTypography-root': {
                                          fontSize: '0.875rem',
                                        },
                                      }}
                                    />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            {selectedPackagePurchasePaymentMethods.length > 0 && (
                              <Button
                                size="small"
                                onClick={() => setSelectedPackagePurchasePaymentMethods([])}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.875rem',
                                  color: '#64748b',
                                  borderColor: alpha('#cbd5e1', 0.5),
                                  px: 2,
                                  '&:hover': {
                                    backgroundColor: alpha('#f1f5f9', 0.8),
                                    borderColor: '#8B5CF6',
                                    color: '#8B5CF6',
                                  }
                                }}
                                variant="outlined"
                              >
                                {t('analytics.orderStats.clearFilter')}
                              </Button>
                            )}
                          </Box>
                        </Box>

                        <TableContainer sx={{ overflowX: 'auto' }}>
                          <Table size="small" sx={{ minWidth: isMobile ? 380 : 'auto' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{
                                  fontWeight: 600,
                                  color: '#666',
                                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                                  py: isMobile ? 1 : 1.5,
                                  fontSize: isMobile ? '0.7rem' : undefined,
                                  position: isMobile ? 'sticky' : 'static',
                                  left: 0,
                                  bgcolor: '#fff',
                                  zIndex: 1,
                                  minWidth: isMobile ? 90 : 'auto',
                                  boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                }}>{t('analytics.orderStats.paymentMethod')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.orderCount')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>
                                  {t('analytics.orderStats.totalAmount')}
                                  {!isMobile && (
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.6rem', display: 'block' }}>
                                      ({t('analytics.actualPaymentAmount')})
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#666', borderBottom: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.7rem' : undefined, whiteSpace: 'nowrap' }}>{t('analytics.orderStats.tips')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredPackagePurchaseStats.map((row: any, index: number) => (
                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } }}>
                                  <TableCell sx={{
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    py: isMobile ? 1 : 1.5,
                                    position: isMobile ? 'sticky' : 'static',
                                    left: 0,
                                    bgcolor: '#fff',
                                    zIndex: 1,
                                    boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                  }}>
                                    <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1}>
                                      {!isMobile && getPaymentMethodIcon(row.paymentMethod)}
                                      <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: isMobile ? '0.75rem' : undefined }}>
                                        {row.paymentMethod}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#1a1a1a', fontSize: isMobile ? '0.75rem' : undefined }}>{row.orderCount}</TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {CurrencyUtils.formatAmountWithCommas(row.totalAmount)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.04)', py: isMobile ? 1 : 1.5, color: '#F59E0B', fontSize: isMobile ? '0.75rem' : undefined }}>
                                    {CurrencyUtils.formatAmountWithCommas(row.totalTips || 0)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell sx={{
                                  fontWeight: 600,
                                  color: '#1a1a1a',
                                  borderTop: '1px solid rgba(0,0,0,0.08)',
                                  py: isMobile ? 1 : 1.5,
                                  fontSize: isMobile ? '0.75rem' : undefined,
                                  position: isMobile ? 'sticky' : 'static',
                                  left: 0,
                                  bgcolor: '#fff',
                                  zIndex: 1,
                                  boxShadow: isMobile ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                                }}>
                                  {t('analytics.orderStats.total')}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {packagePurchaseSummaryData.orderCount}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#1a1a1a', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {CurrencyUtils.formatAmountWithCommas(packagePurchaseSummaryData.totalAmount)}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#F59E0B', borderTop: '1px solid rgba(0,0,0,0.08)', py: isMobile ? 1 : 1.5, fontSize: isMobile ? '0.75rem' : undefined }}>
                                  {CurrencyUtils.formatAmountWithCommas(packagePurchaseSummaryData.totalTips)}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Box>
        )}
      </Card>
    </Box>
  );
};

export default Analytics; 