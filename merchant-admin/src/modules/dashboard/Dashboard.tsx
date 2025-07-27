import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  LineChart,
  Line,
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
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { CurrencyUtils } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../services/api';

// 时间范围类型
type TimeRange = '7days' | '30days' | '6months' | '1year';

// 数据类型定义
interface SalesData {
  date: string;
  sales: number;
  orders: number;
  visitors: number;
}

interface ProductCategoryData {
  name: string;
  value: number;
  color: string;
}

interface TopProductData {
  name: string;
  sales: number;
  growth: number;
}

interface MetricCardData {
  title: string;
  value: string;
  change: number;
  icon: React.ReactElement;
  color: string;
  gradient: string;
}

// 现代化颜色主题 - 使用更鲜艳和现代的颜色
const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [salesTrendData, setSalesTrendData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<ProductCategoryData[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopProductData[]>([]);

  const handleTimeRangeChange = (event: SelectChangeEvent<TimeRange>) => {
    setTimeRange(event.target.value as TimeRange);
  };

  // 获取天数
  const getDaysFromTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '7days': return 7;
      case '30days': return 30;
      case '6months': return 180;
      case '1year': return 365;
      default: return 30;
    }
  };

  // 加载 Dashboard 数据
  const loadDashboardData = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const days = getDaysFromTimeRange(timeRange);

      // 并行获取所有数据
      const [stats, salesTrend, serviceCategories, topServices] = await Promise.all([
        dashboardApi.getDashboardStats(user.tenantId, days),
        dashboardApi.getSalesTrend(user.tenantId, days),
        dashboardApi.getServiceCategoryStats(user.tenantId, days),
        dashboardApi.getTopServices(user.tenantId, days, 5)
      ]);

      setDashboardStats(stats);
      
      // 处理销售趋势数据
      if (salesTrend.success && salesTrend.data) {
        setSalesTrendData(salesTrend.data);
      }

      // 处理服务分类数据
      if (serviceCategories.success && serviceCategories.data) {
        const formattedCategories = serviceCategories.data.map((item: any, index: number) => ({
          name: item.name === 'No Data' ? t('dashboard.noData') : 
                item.name === 'Uncategorized' ? t('dashboard.uncategorized') : item.name,
          value: item.value,
          color: COLORS[index % COLORS.length]
        }));
        setCategoryData(formattedCategories);
      }

      // 处理热门服务数据
      if (topServices.success && topServices.data) {
        const formattedServices = topServices.data.map((item: any) => ({
          ...item,
          name: item.name === 'No Data' ? t('dashboard.noData') : 
                item.name === 'Unknown Service' ? t('dashboard.unknownService') : item.name
        }));
        setTopServicesData(formattedServices);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // 使用默认数据
      setDashboardStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        totalAppointments: 0,
        avgOrderValue: 0,
        revenueGrowth: 0,
        orderGrowth: 0,
        customerGrowth: 0
      });
      setSalesTrendData([]);
      setCategoryData([]);
      setTopServicesData([]);
    } finally {
      setLoading(false);
    }
  };

  // 当组件挂载或时间范围改变时加载数据
  useEffect(() => {
    loadDashboardData();
  }, [user?.tenantId, timeRange]);

  // 计算关键指标
  const totalSales = dashboardStats?.totalRevenue || 0;
  const totalOrders = dashboardStats?.totalOrders || 0;
  const totalVisitors = dashboardStats?.totalAppointments * 2 || 0; // 假设每个预约代表2个访客
  const avgOrderValue = dashboardStats?.avgOrderValue || 0;

  const metricsData: MetricCardData[] = [
    {
      title: t('dashboard.totalSales'),
      value: CurrencyUtils.formatAmountWithCommas(totalSales),
      change: dashboardStats?.revenueGrowth || 0,
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: '#10B981',
      gradient: GRADIENTS[2],
    },
    {
      title: t('dashboard.totalOrders'),
      value: totalOrders.toLocaleString(),
      change: dashboardStats?.orderGrowth || 0,
      icon: <ShoppingCartIcon sx={{ fontSize: 32 }} />,
      color: '#6366F1',
      gradient: GRADIENTS[0],
    },
    {
      title: t('dashboard.totalCustomers'),
      value: (dashboardStats?.totalCustomers || 0).toLocaleString(),
      change: dashboardStats?.customerGrowth || 0,
      icon: <VisibilityIcon sx={{ fontSize: 32 }} />,
      color: '#F59E0B',
      gradient: GRADIENTS[3],
    },
    {
      title: t('dashboard.avgOrderValue'),
      value: CurrencyUtils.formatAmountWithCommas(Math.round(avgOrderValue)),
      change: dashboardStats?.appointmentGrowth || 0,
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      color: '#EC4899',
      gradient: GRADIENTS[1],
    },
  ];

  // 自定义现代化Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {`${t('dashboard.date')}: ${label}`}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* 加载状态 */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #6366F1, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            {t('nav.dashboard')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('dashboard.subtitle')}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select 
            value={timeRange} 
            onChange={handleTimeRangeChange}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.primary.main, 0.2),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <MenuItem value="7days">{t('dashboard.last7Days')}</MenuItem>
            <MenuItem value="30days">{t('dashboard.last30Days')}</MenuItem>
            <MenuItem value="6months">{t('dashboard.last6Months')}</MenuItem>
            <MenuItem value="1year">{t('dashboard.last1Year')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 美化的关键指标卡片 */}
      <Grid container spacing={3} mb={4}>
        {metricsData.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'visible',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: metric.gradient,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      background: metric.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 4px 15px ${alpha(metric.color, 0.3)}`,
                    }}
                  >
                    {metric.icon}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: metric.change >= 0 ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                      color: metric.change >= 0 ? '#10B981' : '#EF4444',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {metric.change >= 0 ? '↗' : '↘'} {Math.abs(metric.change)}%
                  </Typography>
                </Box>
                <Typography 
                  color="text.secondary" 
                  variant="body2" 
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  {metric.title}
                </Typography>
                <Typography 
                  variant="h4" 
                  component="h2" 
                  className="numeric"
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 美化的图表区域 */}
      <Grid container spacing={3}>
        {/* 销售趋势折线图 */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.salesTrend')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    name={t('dashboard.sales')}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#10B981"
                    strokeWidth={3}
                    name={t('dashboard.orders')}
                    dot={{ r: 4, strokeWidth: 2, fill: '#10B981' }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 产品分类饼状图 */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #EC4899, #F59E0B)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.serviceCategories')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    {categoryData.map((entry, index) => (
                      <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient${index})`}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, '占比']}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 访客流量面积图 */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.visitorTraffic')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fill="url(#visitorGradient)"
                    name={t('dashboard.visitors')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 热门产品条形图 */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.topServices')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topServicesData} layout="horizontal" margin={{ top: 20, right: 30, left: 50, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis 
                    type="number" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      t('dashboard.sales')
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="url(#barGradient)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 今日预约概览 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.todayAppointments')}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                  {dashboardStats?.totalAppointments || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: dashboardStats?.appointmentGrowth >= 0 ? '#10B981' : '#EF4444',
                    fontWeight: 600 
                  }}
                >
                  {dashboardStats?.appointmentGrowth >= 0 ? '↗' : '↘'} {Math.abs(dashboardStats?.appointmentGrowth || 0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.appointmentsTrend')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 客户满意度 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.customerSatisfaction')}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f5576c' }}>
                  4.8
                </Typography>
                <Box display="flex" alignItems="center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Box
                      key={star}
                      sx={{
                        color: star <= 4.8 ? '#FFD700' : '#E0E0E0',
                        fontSize: 20,
                        mr: 0.5,
                      }}
                    >
                      ★
                    </Box>
                  ))}
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.basedOnReviews')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 