import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, addDays } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import ShiftDialog from './ShiftDialog';
import ShiftCalendarView from '../ShiftCalendarView';
import { shiftApi, handleApiError } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { getMerchantNow } from '../../../utils/timezoneUtils';

interface ResourceShift {
  id: number;
  tenantId: number;
  resourceId: number;
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  allowOnlineBooking: boolean;
  maxAppointments?: number;
  notes?: string;
  createdBy?: number;
}

interface ShiftManagementProps {
  resourceId?: number; // 如果传入resourceId，只显示该资源的排班
}

const ShiftManagement: React.FC<ShiftManagementProps> = ({ resourceId }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [shifts, setShifts] = useState<ResourceShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ResourceShift | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(getMerchantNow(), { weekStartsOn: 1 }));

  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;

  useEffect(() => {
    loadShifts();
  }, [currentWeekStart, resourceId]);

  const loadShifts = async () => {
    setLoading(true);
    setError(null);

    // 使用模拟数据
    setTimeout(() => {
      const mockShifts: ResourceShift[] = [
        // 周一
        {
          id: 1,
          tenantId: 1,
          resourceId: 1,
          shiftName: 'Emma - 早班',
          shiftDate: format(addDays(currentWeekStart, 0), 'yyyy-MM-dd'),
          startTime: '09:00:00',
          endTime: '17:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 8,
          notes: '常规工作日',
        },
        {
          id: 2,
          tenantId: 1,
          resourceId: 2,
          shiftName: 'Sophia - 早班',
          shiftDate: format(addDays(currentWeekStart, 0), 'yyyy-MM-dd'),
          startTime: '08:00:00',
          endTime: '16:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 10,
        },
        // 周二
        {
          id: 3,
          tenantId: 1,
          resourceId: 1,
          shiftName: 'Emma - 晚班',
          shiftDate: format(addDays(currentWeekStart, 1), 'yyyy-MM-dd'),
          startTime: '13:00:00',
          endTime: '21:00:00',
          breakStart: '17:00:00',
          breakEnd: '18:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 6,
        },
        {
          id: 4,
          tenantId: 1,
          resourceId: 3,
          shiftName: 'Olivia - 全天',
          shiftDate: format(addDays(currentWeekStart, 1), 'yyyy-MM-dd'),
          startTime: '09:00:00',
          endTime: '18:00:00',
          breakStart: '12:30:00',
          breakEnd: '13:30:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 12,
        },
        // 周三
        {
          id: 5,
          tenantId: 1,
          resourceId: 2,
          shiftName: 'Sophia - 早班',
          shiftDate: format(addDays(currentWeekStart, 2), 'yyyy-MM-dd'),
          startTime: '08:00:00',
          endTime: '16:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 10,
        },
        {
          id: 6,
          tenantId: 1,
          resourceId: 3,
          shiftName: 'Olivia - 早班',
          shiftDate: format(addDays(currentWeekStart, 2), 'yyyy-MM-dd'),
          startTime: '09:00:00',
          endTime: '17:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 8,
        },
        // 周四
        {
          id: 7,
          tenantId: 1,
          resourceId: 1,
          shiftName: 'Emma - 全天',
          shiftDate: format(addDays(currentWeekStart, 3), 'yyyy-MM-dd'),
          startTime: '09:00:00',
          endTime: '18:00:00',
          breakStart: '13:00:00',
          breakEnd: '14:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 12,
        },
        // 周五
        {
          id: 8,
          tenantId: 1,
          resourceId: 1,
          shiftName: 'Emma - 早班',
          shiftDate: format(addDays(currentWeekStart, 4), 'yyyy-MM-dd'),
          startTime: '09:00:00',
          endTime: '17:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 8,
        },
        {
          id: 9,
          tenantId: 1,
          resourceId: 2,
          shiftName: 'Sophia - 全天',
          shiftDate: format(addDays(currentWeekStart, 4), 'yyyy-MM-dd'),
          startTime: '08:00:00',
          endTime: '18:00:00',
          breakStart: '12:00:00',
          breakEnd: '13:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 14,
        },
        {
          id: 10,
          tenantId: 1,
          resourceId: 3,
          shiftName: 'Olivia - 晚班',
          shiftDate: format(addDays(currentWeekStart, 4), 'yyyy-MM-dd'),
          startTime: '14:00:00',
          endTime: '22:00:00',
          breakStart: '18:00:00',
          breakEnd: '19:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 6,
        },
        // 周六
        {
          id: 11,
          tenantId: 1,
          resourceId: 2,
          shiftName: 'Sophia - 早班',
          shiftDate: format(addDays(currentWeekStart, 5), 'yyyy-MM-dd'),
          startTime: '09:00:00',
          endTime: '15:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 6,
          notes: '周末短班',
        },
        {
          id: 12,
          tenantId: 1,
          resourceId: 3,
          shiftName: 'Olivia - 全天',
          shiftDate: format(addDays(currentWeekStart, 5), 'yyyy-MM-dd'),
          startTime: '10:00:00',
          endTime: '18:00:00',
          breakStart: '13:00:00',
          breakEnd: '14:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 10,
        },
        // 周日
        {
          id: 13,
          tenantId: 1,
          resourceId: 1,
          shiftName: 'Emma - 半天',
          shiftDate: format(addDays(currentWeekStart, 6), 'yyyy-MM-dd'),
          startTime: '10:00:00',
          endTime: '16:00:00',
          status: 'SCHEDULED',
          allowOnlineBooking: true,
          maxAppointments: 6,
          notes: '周日营业',
        },
      ];

      setShifts(mockShifts);
      setLoading(false);
    }, 500);

    // 真实 API 调用
    /* 暂时注释，等API准备好后启用
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      let data;
      if (resourceId) {
        data = await shiftApi.getShiftsByResource(resourceId, startDate, endDate);
      } else {
        data = await shiftApi.getShiftsByTenant(user?.tenantId || 0, startDate, endDate);
      }

      setShifts(data);
    } catch (err: any) {
      setError(t('shift.loadError'));
      handleApiError(err);
    } finally {
      setLoading(false);
    }
    */
  };

  const handleAddShift = () => {
    if (!hasPermission('schedule:create')) {
      setError(t('common.noPermission'));
      return;
    }
    setSelectedShift(null);
    setDialogOpen(true);
  };

  const handleEditShift = (shift: ResourceShift) => {
    if (!hasPermission('schedule:update')) {
      setError(t('common.noPermission'));
      return;
    }
    setSelectedShift(shift);
    setDialogOpen(true);
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!hasPermission('schedule:cancel')) {
      setError(t('common.noPermission'));
      return;
    }

    if (!window.confirm(t('shift.deleteConfirm'))) {
      return;
    }

    try {
      await shiftApi.deleteShift(shiftId);
      await loadShifts();
    } catch (err: any) {
      setError(t('shift.deleteError'));
      handleApiError(err);
    }
  };

  const handleDialogClose = (reload?: boolean) => {
    setDialogOpen(false);
    setSelectedShift(null);
    if (reload) {
      loadShifts();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderListView = () => (
    <Grid container spacing={2}>
      {shifts.length === 0 ? (
        <Grid item xs={12}>
          <Alert severity="info">{t('shift.noShifts')}</Alert>
        </Grid>
      ) : (
        shifts.map((shift) => (
          <Grid item xs={12} md={6} lg={4} key={shift.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {shift.shiftName || t('shift.untitled')}
                    </Typography>
                    <Chip
                      label={t(`shift.status.${shift.status.toLowerCase()}`)}
                      color={getStatusColor(shift.status)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleEditShift(shift)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteShift(shift.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(shift.shiftDate), 'PPP', { locale })}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {shift.startTime.substring(0, 5)} - {shift.endTime.substring(0, 5)}
                  </Typography>
                </Box>

                {shift.breakStart && shift.breakEnd && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('shift.break')}: {shift.breakStart.substring(0, 5)} - {shift.breakEnd.substring(0, 5)}
                    </Typography>
                  </Box>
                )}

                {shift.maxAppointments && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <GroupIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('shift.maxAppointments')}: {shift.maxAppointments}
                    </Typography>
                  </Box>
                )}

                {shift.notes && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {shift.notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  return (
    <Box>
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 内容区域 */}
      <ShiftCalendarView
        shifts={shifts}
        weekStart={currentWeekStart}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
        onAddShift={handleAddShift}
        loading={loading}
      />

      {/* 排班对话框 */}
      <ShiftDialog
        open={dialogOpen}
        shift={selectedShift}
        resourceId={resourceId}
        onClose={handleDialogClose}
      />
    </Box>
  );
};

export default ShiftManagement;
