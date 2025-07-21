import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
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

// 颜色主题 - 使用现代化配色
const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

// 模拟数据生成
const generateRevenueData = (days: number) => {
  const data = [];
  const baseDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 2000) + 800,
      orders: Math.floor(Math.random() * 20) + 5,
      tips: Math.floor(Math.random() * 300) + 100,
    });
  }
  return data;
};

// serviceData will be defined inside component

// staffPerformanceData will be defined inside component

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
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedTab, setSelectedTab] = useState(0);
  
  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const revenueData = useMemo(() => generateRevenueData(30), []);
  
  const serviceData = [
    { name: t('analytics.serviceCategories.hairCare'), value: 35, revenue: 12500, count: 85, color: '#EC4899' },
    { name: t('analytics.serviceCategories.spaTreatments'), value: 28, revenue: 9800, count: 45, color: '#10B981' },
    { name: t('analytics.serviceCategories.facialCare'), value: 20, revenue: 7200, count: 65, color: '#F59E0B' },
    { name: t('analytics.serviceCategories.nailCare'), value: 17, revenue: 4800, count: 95, color: '#8B5CF6' },
  ];

  const staffPerformanceData = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'SJ',
      revenue: 15600,
      orders: 124,
      avgRating: 4.8,
      topServices: [t('analytics.serviceCategories.hairCare'), t('analytics.serviceCategories.facialCare')],
      efficiency: 92,
    },
    {
      id: '2',
      name: 'Jennifer Wong',
      avatar: 'JW',
      revenue: 13800,
      orders: 98,
      avgRating: 4.9,
      topServices: [t('analytics.serviceCategories.spaTreatments'), t('analytics.serviceCategories.facialCare')],
      efficiency: 88,
    },
    {
      id: '3',
      name: 'Maria Lopez',
      avatar: 'ML',
      revenue: 11200,
      orders: 156,
      avgRating: 4.6,
      topServices: [t('analytics.serviceCategories.nailCare'), t('analytics.serviceCategories.hairCare')],
      efficiency: 85,
    },
    {
      id: '4',
      name: 'Alex Chen',
      avatar: 'AC',
      revenue: 9800,
      orders: 89,
      avgRating: 4.7,
      topServices: [t('analytics.serviceCategories.hairCare')],
      efficiency: 78,
    },
  ];
  
  // 计算汇总数据
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

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
                background: 'linear-gradient(45deg, #DC2626, #EF4444)',
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
                  borderColor: alpha('#EF4444', 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#EF4444',
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
                  ¥{Math.round(totalRevenue).toLocaleString()}
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
              borderColor: alpha('#F59E0B', 0.1),
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
                  ¥{Math.round(avgOrderValue)}
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
              borderColor: alpha('#EC4899', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(236, 72, 153, 0.15)',
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
                    background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC4899' }}>
                  {staffPerformanceData.length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('analytics.activeStaff')}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <StarIcon sx={{ fontSize: 16, color: '#F59E0B', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                  {t('analytics.avgRating')} 4.7
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
                  backgroundColor: alpha('#EF4444', 0.08),
                  transform: 'translateY(-1px)',
                },
                '&.Mui-selected': {
                  fontWeight: 600,
                  backgroundColor: alpha('#EF4444', 0.1),
                  color: '#EF4444',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #EF4444, #DC2626)',
              },
            }}
          >
            <Tab icon={<TrendingUpIcon />} iconPosition="start" label={t('analytics.tabs.revenueTrend')} />
            <Tab icon={<AssessmentIcon />} iconPosition="start" label={t('analytics.tabs.serviceAnalysis')} />
            <Tab icon={<PeopleIcon />} iconPosition="start" label={t('analytics.tabs.staffPerformance')} />
            <Tab icon={<InsightsIcon />} iconPosition="start" label={t('analytics.tabs.businessInsights')} />
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
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
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
                    background: 'linear-gradient(135deg, #EC4899, #DB2777)',
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
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}%`, name]}
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
                <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                  <XAxis 
                    dataKey="name" 
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
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, t('analytics.chartLabels.income')]}
                  />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
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
                {staffPerformanceData.map((staff) => (
                  <TableRow key={staff.id} sx={{ '&:hover': { backgroundColor: alpha('#8B5CF6', 0.04) } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: '#8B5CF6', width: 32, height: 32 }}>
                          {staff.avatar}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {staff.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                        ¥{staff.revenue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {staff.orders}
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
                          value={staff.efficiency}
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
                          {staff.efficiency}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {staff.topServices.map((service, index) => (
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

        {/* 业务洞察 */}
        <TabPanel value={selectedTab} index={3}>
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                width: 6,
                height: 24,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                borderRadius: 1,
                mr: 2,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('analytics.charts.keyBusinessMetrics')}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              { title: t('analytics.metrics.customerSatisfaction'), value: '4.8', unit: '/5.0', color: '#F59E0B', trend: '+0.2' },
              { title: t('analytics.metrics.serviceCompletionRate'), value: '94.2', unit: '%', color: '#10B981', trend: '+2.1%' },
              { title: t('analytics.metrics.appointmentCancellationRate'), value: '8.5', unit: '%', color: '#EF4444', trend: '-1.3%' },
              { title: t('analytics.metrics.repeatCustomerRate'), value: '67.3', unit: '%', color: '#8B5CF6', trend: '+5.7%' },
            ].map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(metric.color, 0.2),
                    p: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                    {metric.title}
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: metric.color }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.unit}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                    {metric.trend} {t('analytics.metrics.vsLastMonth')}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Analytics; 