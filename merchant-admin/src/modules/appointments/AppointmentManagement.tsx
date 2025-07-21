import React, { useState } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  Box,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AddAppointmentDialog from './components/AddAppointmentDialog';
import { Customer } from '../customers/Customers';

// 预约记录接口
export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  serviceItems: string[];
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
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
    customerName: 'Emily Johnson',
    customerPhone: '+1-555-0123',
    serviceType: 'Hair & Beauty',
    serviceItems: ['Hair Cut', 'Hair Color', 'Blow Dry'],
    appointmentDate: '2024-01-25',
    appointmentTime: '14:00',
    duration: 120,
    staff: 'Sarah Johnson',
    status: 'confirmed',
    price: 165.00,
    notes: 'Customer requested layers, prefers afternoon slots',
    createdAt: '2024-01-23T10:00:00Z'
  },
  {
    id: 'apt_002',
    customerId: '2',
    customerName: 'Michael Chen',
    customerPhone: '+1-555-0234',
    serviceType: 'Spa Package',
    serviceItems: ['Full Body Massage', 'Facial', 'Manicure'],
    appointmentDate: '2024-01-24',
    appointmentTime: '10:00',
    duration: 180,
    staff: 'Jennifer Wong',
    status: 'confirmed',
    price: 230.00,
    notes: 'First-time customer, allergic to certain oils',
    createdAt: '2024-01-22T15:30:00Z'
  },
  {
    id: 'apt_003',
    customerId: '3',
    customerName: 'Sarah Thompson',
    customerPhone: '+1-555-0345',
    serviceType: 'Nail Care',
    serviceItems: ['Manicure', 'Pedicure'],
    appointmentDate: '2024-01-26',
    appointmentTime: '11:30',
    duration: 105,
    staff: 'Maria Lopez',
    status: 'completed',
    price: 100.00,
    rating: 5,
    review: 'Excellent service, will definitely come back!',
    createdAt: '2024-01-24T09:15:00Z'
  },
];

const AppointmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [filteredAppointments] = useState<Appointment[]>(mockAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // 对话框状态
  const [addAppointmentOpen, setAddAppointmentOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 模拟客户数据
  const mockCustomers: Customer[] = [];

  const getStatusChip = (status: string) => {
    const statusConfig = {
          confirmed: { color: '#3B82F6', bg: alpha('#3B82F6', 0.1), label: t('appointments.appointmentStatuses.confirmed') },
    completed: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('appointments.appointmentStatuses.completed') },
    cancelled: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('appointments.appointmentStatuses.cancelled') },
    'no-show': { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('appointments.appointmentStatuses.no-show') },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    
    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 2,
          },
        }}
      />
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric',
      weekday: 'short'
    });
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
                background: 'linear-gradient(45deg, #7C3AED, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('appointments.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('appointments.subtitle')}
            </Typography>
          </Box>
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
                  <EventNoteIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                  {appointments.length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.totalAppointments')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#3B82F6', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)',
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
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CheckIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                  {appointments.filter(apt => apt.status === 'confirmed').length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.pendingService')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

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
                  <TrendingUpIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  {appointments.filter(apt => apt.status === 'completed').length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.completedAppointments')}
              </Typography>
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
                  <MoneyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  ¥{appointments.reduce((sum, apt) => sum + apt.price, 0).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('appointments.totalRevenue')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 现代化搜索和过滤区域 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('appointments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('appointments.statusFilter')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('appointments.statusFilter')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                  }}
                >
                              <MenuItem value="all">{t('appointments.allStatuses')}</MenuItem>
            <MenuItem value="confirmed">{t('appointments.appointmentStatuses.confirmed')}</MenuItem>
            <MenuItem value="completed">{t('appointments.appointmentStatuses.completed')}</MenuItem>
            <MenuItem value="cancelled">{t('appointments.appointmentStatuses.cancelled')}</MenuItem>
            <MenuItem value="no-show">{t('appointments.appointmentStatuses.no-show')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('appointments.dateFilter')}</InputLabel>
                <Select
                  value={dateFilter}
                  label={t('appointments.dateFilter')}
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8B5CF6',
                    },
                  }}
                >
                  <MenuItem value="all">{t('appointments.dateOptions.allDates')}</MenuItem>
                  <MenuItem value="today">{t('appointments.dateOptions.today')}</MenuItem>
                  <MenuItem value="tomorrow">{t('appointments.dateOptions.tomorrow')}</MenuItem>
                  <MenuItem value="this-week">{t('appointments.dateOptions.thisWeek')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddAppointmentOpen(true)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('appointments.newAppointment')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 现代化表格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>{t('appointments.tableHeaders.customer')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.services')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.dateTime')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.staff')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.amount')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.rating')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('appointments.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAppointments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((appointment) => (
                  <TableRow 
                    key={appointment.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#8B5CF6', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#8B5CF6',
                            fontSize: '0.875rem',
                          }}
                        >
                          {appointment.customerName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {appointment.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.customerPhone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {appointment.serviceType}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.serviceItems.join(', ')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <CalendarIcon sx={{ fontSize: 14, color: '#8B5CF6' }} />
                        <Typography variant="body2">
                          {formatDate(appointment.appointmentDate)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(appointment.appointmentTime)} ({appointment.duration} {t('appointments.duration')})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                        <Typography variant="body2">
                          {appointment.staff}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ¥{appointment.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(appointment.status)}
                    </TableCell>
                    <TableCell>
                      {appointment.rating ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box display="flex">
                            {[...Array(5)].map((_, index) => (
                              <StarIcon
                                key={index}
                                sx={{
                                  fontSize: 14,
                                  color: index < appointment.rating! ? '#F59E0B' : '#E5E7EB',
                                }}
                              />
                            ))}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.rating}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          暂无评价
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchorEl(e.currentTarget);
                          setSelectedAppointment(appointment);
                        }}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha('#8B5CF6', 0.1),
                          },
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredAppointments.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#f8fafc',
          }}
        />
      </Card>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          }
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#6366F1', 0.08) } }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#6366F1' }} />
          查看详情
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAddAppointmentOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#8B5CF6', 0.08) } }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 18, color: '#8B5CF6' }} />
          编辑预约
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#10B981', 0.08) } }}
        >
          <CheckIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
          标记完成
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
        >
          <CancelIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
          取消预约
        </MenuItem>
      </Menu>

      {/* 对话框组件 */}
      <AddAppointmentDialog 
        open={addAppointmentOpen} 
        onClose={() => setAddAppointmentOpen(false)}
        customers={mockCustomers}
        onSave={(appointment) => {
          // 处理保存逻辑
          setAddAppointmentOpen(false);
        }}
      />

      {/* 删除确认对话框 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
            确认取消预约
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            确定要取消 {selectedAppointment?.customerName} 的预约吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              px: 3,
            }}
          >
            取消
          </Button>
          <Button 
            onClick={() => {
              // 处理取消预约逻辑
              setDeleteDialogOpen(false);
            }}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            确认取消
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagement; 