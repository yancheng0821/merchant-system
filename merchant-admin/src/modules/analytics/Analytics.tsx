import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Business as AiIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../services/api';
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
const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedTab, setSelectedTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
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
      const data = await analyticsApi.getOverview(user.tenantId, timeRange);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
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
    totalOrders = 0,
    avgOrderValue = 0,
    activeStaff = 0,
    avgRating = 0,
    revenueData = [],
    serviceStats = [],
    staffPerformance = [],
    businessMetrics = {}
  } = analyticsData;

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
      {/* 现代化页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #0891B2, #0E7490)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('analytics.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('analytics.subtitle')}
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha('#0891B2', 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0891B2',
                },
              }}
            >
              <MenuItem value="7days">{t('analytics.timePeriods.7days')}</MenuItem>
              <MenuItem value="30days">{t('analytics.timePeriods.30days')}</MenuItem>
              <MenuItem value="6months">{t('analytics.timePeriods.6months')}</MenuItem>
              <MenuItem value="1year">{t('analytics.timePeriods.1year')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 现代化统计卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#10B981', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  {CurrencyUtils.formatAmountWithCommas(Math.round(totalRevenue))}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('analytics.totalRevenue')}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                  +12.5%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#6366F1', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <OrdersIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1' }}>
                  {totalOrders}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('analytics.totalOrders')}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                  +8.3%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#0891B2', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <AssessmentIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  {CurrencyUtils.formatAmountWithCommas(Math.round(avgOrderValue))}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('analytics.avgOrderValue')}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#10B981', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                  +4.1%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#8B5CF6', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(139, 92, 246, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                  {activeStaff}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('analytics.activeStaff')}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <StarIcon sx={{ fontSize: 16, color: '#8B5CF6', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#8B5CF6', fontWeight: 600 }}>
                  {t('analytics.avgRating')} {avgRating}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 现代化标签页 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.02), rgba(220, 38, 38, 0.02))',
        }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9rem',
                py: 2,
                px: 3,
                mx: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha('#0891B2', 0.08),
                  // 移除transform效果，避免左右跳动
                },
                '&.Mui-selected': {
                  fontWeight: 600,
                  backgroundColor: alpha('#0891B2', 0.1),
                  color: '#0891B2',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #0891B2, #0E7490)',
              },
            }}
          >
            <Tab icon={<TrendingUpIcon />} iconPosition="start" label={t('analytics.tabs.revenueTrend')} />
            <Tab icon={<AssessmentIcon />} iconPosition="start" label={t('analytics.tabs.serviceAnalysis')} />
            <Tab icon={<PeopleIcon />} iconPosition="start" label={t('analytics.tabs.staffPerformance')} />
            <Tab icon={<AiIcon />} iconPosition="start" label={t('analytics.tabs.aiBusinessInsights')} />
          </Tabs>
        </Box>

        {/* 收入趋势 */}
        <TabPanel value={selectedTab} index={0}>
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
        </TabPanel>

        {/* 服务分析 */}
        <TabPanel value={selectedTab} index={1}>
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
        </TabPanel>

        {/* 员工表现 */}
        <TabPanel value={selectedTab} index={2}>
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
                {staffPerformance.map((staff: any) => (
                  <TableRow key={staff.staffId} sx={{ '&:hover': { backgroundColor: alpha('#8B5CF6', 0.04) } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: '#8B5CF6', width: 32, height: 32 }}>
                          {staff.avatar}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {staff.staffName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                        {CurrencyUtils.formatAmountWithCommas(staff.totalRevenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {staff.orderCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {staff.avgRating}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={staff.efficiencyScore}
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
                          {staff.efficiencyScore}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {staff.topServices?.map((service: string, index: number) => (
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
        </TabPanel>

        {/* AI 业务洞察 */}
        <TabPanel value={selectedTab} index={3}>
          <AiBusinessInsights />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Analytics; 