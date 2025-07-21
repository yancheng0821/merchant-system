import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TablePagination,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer } from '../Customers';

interface AppointmentHistoryProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

// 预约记录接口
export interface Appointment {
  id: string;
  customerId: string;
  serviceType: string;
  serviceItems: string[];
  appointmentDate: string;
  appointmentTime: string;
  duration: number; // 分钟
  staff: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  price: number;
  notes?: string;
  createdAt: string;
  rating?: number;
  review?: string;
}

// 模拟预约数据
const mockAppointments: Appointment[] = [
  {
    id: 'apt_001',
    customerId: '1',
    serviceType: 'Hair & Beauty',
    serviceItems: ['Hair Cut', 'Hair Color', 'Blow Dry'],
    appointmentDate: '2024-01-22',
    appointmentTime: '14:00',
    duration: 120,
    staff: 'Sarah Johnson',
    status: 'completed',
    price: 165.00,
    notes: 'Customer requested layers, happy with color choice',
    createdAt: '2024-01-20T10:00:00Z',
    rating: 5,
    review: 'Excellent service! Sarah did an amazing job with my hair color.'
  },
  {
    id: 'apt_002',
    customerId: '1',
    serviceType: 'Nail Care',
    serviceItems: ['Manicure', 'Gel Polish'],
    appointmentDate: '2024-01-15',
    appointmentTime: '11:30',
    duration: 60,
    staff: 'Maria Lopez',
    status: 'completed',
    price: 45.00,
    notes: 'Used OPI gel polish in "Berry Delicious"',
    createdAt: '2024-01-13T15:30:00Z',
    rating: 4,
    review: 'Good service, nails lasted two weeks'
  },
  {
    id: 'apt_003',
    customerId: '1',
    serviceType: 'Hair Care',
    serviceItems: ['Hair Cut', 'Deep Conditioning'],
    appointmentDate: '2024-01-08',
    appointmentTime: '16:00',
    duration: 90,
    staff: 'Alex Chen',
    status: 'completed',
    price: 85.00,
    createdAt: '2024-01-06T12:00:00Z',
    rating: 5,
    review: 'Alex is fantastic! Great attention to detail.'
  },
  {
    id: 'apt_004',
    customerId: '1',
    serviceType: 'Spa Package',
    serviceItems: ['Facial', 'Relaxing Massage'],
    appointmentDate: '2024-01-25',
    appointmentTime: '10:00',
    duration: 150,
    staff: 'Jennifer Wong',
    status: 'confirmed',
    price: 220.00,
    notes: 'Booked spa package for relaxation',
    createdAt: '2024-01-23T14:20:00Z'
  },
  {
    id: 'apt_005',
    customerId: '1',
    serviceType: 'Hair Care',
    serviceItems: ['Hair Cut'],
    appointmentDate: '2023-12-18',
    appointmentTime: '13:00',
    duration: 45,
    staff: 'Sarah Johnson',
    status: 'cancelled',
    price: 55.00,
    notes: 'Customer cancelled due to illness',
    createdAt: '2023-12-16T09:15:00Z'
  }
];

const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({
  open,
  onClose,
  customer,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // 根据客户ID筛选预约记录
  const customerAppointments = useMemo(() => {
    if (!customer) return [];
    return mockAppointments.filter(apt => apt.customerId === customer.id);
  }, [customer]);

  // 根据标签页筛选预约记录
  const filteredAppointments = useMemo(() => {
    switch (activeTab) {
      case 1: // 即将到来
        return customerAppointments.filter(apt => 
          apt.status === 'confirmed' && new Date(apt.appointmentDate) >= new Date()
        );
      case 2: // 已完成
        return customerAppointments.filter(apt => apt.status === 'completed');
      case 3: // 已取消
        return customerAppointments.filter(apt => 
          apt.status === 'cancelled' || apt.status === 'no-show'
        );
      default: // 全部
        return customerAppointments;
    }
  }, [customerAppointments, activeTab]);

  // 分页数据
  const paginatedAppointments = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAppointments, page, rowsPerPage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <ScheduleIcon />;
      case 'completed': return <CheckIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'no-show': return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    const completed = customerAppointments.filter(apt => apt.status === 'completed');
    const totalSpent = completed.reduce((sum, apt) => sum + apt.price, 0);
    const avgRating = completed.filter(apt => apt.rating).reduce((sum, apt, _, arr) => 
      sum + (apt.rating || 0) / arr.length, 0
    );
    
    return {
      totalAppointments: customerAppointments.length,
      completedAppointments: completed.length,
      totalSpent,
      avgRating: avgRating || 0
    };
  };

  const stats = getTotalStats();

  if (!customer) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={customer.avatar} sx={{ width: 40, height: 40 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {customer.firstName} {customer.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('customers.appointmentHistory')}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 统计信息卡片 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary.main">
                  {stats.totalAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('customers.totalAppointments')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">
                  {stats.completedAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('customers.completedAppointments')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main">
                  {formatCurrency(stats.totalSpent)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('customers.totalSpent')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <Typography variant="h4" color="warning.main">
                    {stats.avgRating.toFixed(1)}
                  </Typography>
                  <StarIcon color="warning" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('customers.avgRating')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 标签页 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={t('customers.allAppointments')} />
            <Tab label={t('customers.upcoming')} />
            <Tab label={t('customers.completed')} />
            <Tab label={t('customers.cancelled')} />
          </Tabs>
        </Box>

        {/* 预约记录表格 */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('customers.service')}</TableCell>
                <TableCell>{t('customers.dateTime')}</TableCell>
                <TableCell>{t('customers.staff')}</TableCell>
                <TableCell>{t('customers.status')}</TableCell>
                <TableCell>{t('customers.price')}</TableCell>
                <TableCell>{t('customers.rating')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAppointments.map((appointment) => (
                <TableRow key={appointment.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {appointment.serviceType}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {appointment.serviceItems.map((item, index) => (
                          <Chip
                            key={index}
                            label={item}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {appointment.duration} {t('customers.minutes')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <CalendarIcon sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="body2">
                        {formatDate(appointment.appointmentDate)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimeIcon sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="body2">
                        {formatTime(appointment.appointmentTime)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {appointment.staff}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(appointment.status)}
                      label={t(`customers.${appointment.status}`)}
                      color={getStatusColor(appointment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(appointment.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {appointment.rating ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {appointment.rating}
                        </Typography>
                        <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      {t('customers.noAppointments')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredAppointments.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('customers.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentHistory; 