import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    alpha,
    CircularProgress,
    IconButton,
    Tooltip,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    Popover,
} from '@mui/material';
import {
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon,
    Event as BookedIcon,
    Refresh as RefreshIcon,
    NavigateBefore as PrevIcon,
    NavigateNext as NextIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Close as CloseIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS, zhCN } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { resourceApi, appointmentApi, staffAttendanceApi } from '../../services/api';
import i18n from '../../i18n/config';
import { format as formatDate } from 'date-fns';
import { getMerchantNow } from '../../utils/timezoneUtils';

interface DetailedAvailabilityViewProps {
    resourceId: number;
    resourceName: string;
    resourceType: 'STAFF' | 'ROOM';
    onBack?: () => void;
}

const DetailedAvailabilityView: React.FC<DetailedAvailabilityViewProps> = ({
    resourceId,
    resourceName,
    resourceType,
    onBack,
}) => {
    const { t } = useTranslation();
    // 获取本地日期字符串（避免时区问题）
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
    const [availabilityData, setAvailabilityData] = useState<any>(null);
    const [staffAttendance, setStaffAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollPositionRef = React.useRef(0);
    const shouldPreserveScrollRef = React.useRef(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
    const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
    const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLElement | null>(null);

    // 日历语言设置
    const locale = i18n.language === 'zh-CN' ? zhCN : enUS;

    // 日期选择器处理函数
    const handleDatePickerOpen = (event: React.MouseEvent<HTMLElement>) => {
        setDatePickerAnchor(event.currentTarget);
    };

    const handleDatePickerClose = () => {
        setDatePickerAnchor(null);
    };

    const handleDateChange = (newDate: Date | null) => {
        if (newDate) {
            scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
            shouldPreserveScrollRef.current = true;
            setSelectedDate(getLocalDateString(newDate));
        }
        setDatePickerAnchor(null);
    };

    // 生成时间段（30分钟间隔）
    const timeSlots = React.useMemo(() => {
        const slots = [];
        for (let hour = 6; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
        return slots;
    }, []);

    // 获取详细可用性数据
    const fetchDetailedAvailability = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await resourceApi.getResourceDetailedAvailability(resourceId, selectedDate);
            setAvailabilityData(data);

            // 如果是员工资源，同时获取当天的考勤数据（check-in/check-out时间）
            if (resourceType === 'STAFF') {
                try {
                    const attendance = await staffAttendanceApi.getByResourceAndDate(resourceId, selectedDate);
                    setStaffAttendance(attendance || null);
                } catch (err) {
                    console.warn('Failed to fetch staff attendance:', err);
                    setStaffAttendance(null);
                }
            }

            // 如果需要保留滚动位置，在数据加载完成后恢复
            if (shouldPreserveScrollRef.current && scrollPositionRef.current > 0) {
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: scrollPositionRef.current,
                        behavior: 'instant'
                    });
                    // 重置标记
                    shouldPreserveScrollRef.current = false;
                });
            }
        } catch (err) {
            console.error('Failed to fetch detailed availability:', err);
            setError(t('resources.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetailedAvailability();
    }, [resourceId, selectedDate]);

    // 检查时间段状态
    const getTimeSlotStatus = (timeSlot: string) => {
        if (!availabilityData) return 'unavailable';

        // 解析日期字符串，避免时区问题
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

        // 如果没有可用性数据，默认为不可用
        if (!availabilityData.availabilities || availabilityData.availabilities.length === 0) {
            return 'unavailable';
        }

        // 如果是员工资源且有考勤记录（check-in/check-out），优先使用考勤时间
        let isInWorkingHours = false;
        if (resourceType === 'STAFF' && staffAttendance && staffAttendance.checkInTime && staffAttendance.checkOutTime) {
            const slotTime = timeSlot + ':00';
            const checkInTime = staffAttendance.checkInTime.length === 5
                ? staffAttendance.checkInTime + ':00'
                : staffAttendance.checkInTime;
            const checkOutTime = staffAttendance.checkOutTime.length === 5
                ? staffAttendance.checkOutTime + ':00'
                : staffAttendance.checkOutTime;

            // 使用实际的check-in/check-out时间判断
            isInWorkingHours = slotTime >= checkInTime && slotTime < checkOutTime;
        } else {
            // 没有考勤记录，使用排班时间
            isInWorkingHours = availabilityData.availabilities.some((av: any) => {
                if (av.dayOfWeek !== dayOfWeek) return false;

                // 如果 isAvailable 为 false，则不可用
                if (av.isAvailable === false) return false;

                const slotTime = timeSlot + ':00';
                const startTime = av.startTime.length === 5 ? av.startTime + ':00' : av.startTime;
                const endTime = av.endTime.length === 5 ? av.endTime + ':00' : av.endTime;

                return slotTime >= startTime && slotTime < endTime;
            });
        }

        if (!isInWorkingHours) return 'unavailable';

        // 检查是否已被预约
        if (availabilityData.bookingSlots && availabilityData.bookingSlots.length > 0) {
            const isBooked = availabilityData.bookingSlots.some((slot: any) => {
                const slotTime = timeSlot + ':00';
                // 确保时间格式一致，都使用HH:mm:ss格式进行比较
                const slotStartTime = slot.startTime.length === 5 ? slot.startTime + ':00' : slot.startTime;
                const slotEndTime = slot.endTime.length === 5 ? slot.endTime + ':00' : slot.endTime;

                return slotTime >= slotStartTime && slotTime < slotEndTime && slot.status === 'BOOKED';
            });

            return isBooked ? 'booked' : 'available';
        }

        return 'available';
    };

    // 获取状态颜色和图标
    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'available':
                return {
                    color: '#10B981',
                    backgroundColor: alpha('#10B981', 0.1),
                    icon: <AvailableIcon />,
                    label: t('resources.availability.available'),
                };
            case 'booked':
                return {
                    color: '#F59E0B',
                    backgroundColor: alpha('#F59E0B', 0.1),
                    icon: <BookedIcon />,
                    label: t('resources.availability.booked'),
                };
            case 'unavailable':
            default:
                return {
                    color: '#EF4444',
                    backgroundColor: alpha('#EF4444', 0.1),
                    icon: <UnavailableIcon />,
                    label: t('resources.availability.unavailable'),
                };
        }
    };

    // 获取预约详情
    const fetchBookingDetails = async (bookingSlot: any) => {
        setLoadingBookingDetails(true);
        
        try {
            // 如果有appointmentId，尝试从API获取完整信息
            if (bookingSlot.appointmentId) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const tenantId = user.tenantId || 1;
                
                try {
                    const appointmentDetails = await appointmentApi.getAppointmentById(bookingSlot.appointmentId, tenantId);
                    setSelectedBooking(appointmentDetails);
                    setBookingDetailsOpen(true);
                    return;
                } catch (error) {
                    // 如果API调用失败，继续使用本地数据
                }
            }
            
            const bookingDetails = {
                appointmentId: bookingSlot.appointmentId,
                appointmentTime: bookingSlot.startTime,
                endTime: bookingSlot.endTime,
                duration: bookingSlot.duration,
                status: bookingSlot.status || 'CONFIRMED',
                appointmentDate: selectedDate,
                totalAmount: bookingSlot.totalAmount,
                customer: bookingSlot.customerName ? {
                    firstName: bookingSlot.customerName.split(' ')[0] || bookingSlot.customerName,
                    lastName: bookingSlot.customerName.split(' ')[1] || '',
                    phone: bookingSlot.customerPhone,
                    email: bookingSlot.customerEmail,
                } : bookingSlot.customer || null,
                resource: bookingSlot.resource || null,
                appointmentServices: bookingSlot.appointmentServices || (bookingSlot.serviceName ? [{
                    serviceName: bookingSlot.serviceName,
                    duration: bookingSlot.duration,
                    price: bookingSlot.price,
                }] : []),
                notes: bookingSlot.notes,
            };
            
            setSelectedBooking(bookingDetails);
            setBookingDetailsOpen(true);
        } finally {
            setLoadingBookingDetails(false);
        }
    };

    // 日期导航
    const navigateDate = (direction: 'prev' | 'next') => {
        // 保存当前滚动位置到ref
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        shouldPreserveScrollRef.current = true;
        
        // 解析日期字符串，避免时区问题
        const [year, month, day] = selectedDate.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day); // month是0-based
        
        // 根据方向调整日期
        if (direction === 'next') {
            currentDate.setDate(currentDate.getDate() + 1);
        } else {
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        // 设置新日期，这会触发useEffect重新获取数据
        setSelectedDate(getLocalDateString(currentDate));
    };



    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={24} sx={{ color: '#666' }} />
                <Typography variant="body2" sx={{ color: '#999', mt: 2 }}>
                    {t('appointments.loadingAvailability')}
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" sx={{ color: '#EF4444' }}>
                    {error}
                </Typography>
            </Box>
        );
    }

    const themeColor = '#3B82F6';

    return (
        <Box>
            {/* 头部信息卡片 */}
            <Box
                sx={{
                    mb: 2.5,
                    pb: 2,
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1.5}>
                        {onBack && (
                            <Button
                                variant="outlined"
                                onClick={onBack}
                                size="small"
                                sx={{
                                    borderRadius: 1.5,
                                    borderColor: alpha(themeColor, 0.3),
                                    color: themeColor,
                                    fontWeight: 500,
                                    minWidth: 'auto',
                                    px: 1.5,
                                    '&:hover': {
                                        borderColor: themeColor,
                                        bgcolor: alpha(themeColor, 0.05),
                                    },
                                }}
                            >
                                ← {t('common.back')}
                            </Button>
                        )}
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                bgcolor: alpha(themeColor, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {resourceType === 'STAFF' ? (
                                <PersonIcon sx={{ color: themeColor, fontSize: 20 }} />
                            ) : (
                                <BookedIcon sx={{ color: themeColor, fontSize: 20 }} />
                            )}
                        </Box>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                {resourceName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                                {t('resources.availability.detailedView')}
                            </Typography>
                        </Box>
                    </Box>

                    <Tooltip title={t('common.refresh')}>
                        <IconButton
                            size="small"
                            onClick={fetchDetailedAvailability}
                            sx={{
                                color: themeColor,
                                bgcolor: alpha(themeColor, 0.08),
                                '&:hover': { bgcolor: alpha(themeColor, 0.15) },
                            }}
                        >
                            <RefreshIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 日期选择器 */}
            <Box display="flex" alignItems="center" justifyContent="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <IconButton
                        onClick={() => navigateDate('prev')}
                        size="small"
                        sx={{
                            color: themeColor,
                            bgcolor: alpha(themeColor, 0.08),
                            '&:hover': { bgcolor: alpha(themeColor, 0.15) },
                        }}
                    >
                        <PrevIcon />
                    </IconButton>
                    <Box
                        onClick={handleDatePickerOpen}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: alpha(themeColor, 0.08),
                            cursor: 'pointer',
                            minWidth: 180,
                            justifyContent: 'center',
                            '&:hover': {
                                bgcolor: alpha(themeColor, 0.12),
                            },
                        }}
                    >
                        <CalendarIcon sx={{ color: themeColor, fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: themeColor }}>
                            {(() => {
                                const [year, month, day] = selectedDate.split('-').map(Number);
                                const localDate = new Date(year, month - 1, day);
                                return localDate.toLocaleDateString(
                                    i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US',
                                    { year: 'numeric', month: 'long', day: 'numeric' }
                                );
                            })()}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => navigateDate('next')}
                        size="small"
                        sx={{
                            color: themeColor,
                            bgcolor: alpha(themeColor, 0.08),
                            '&:hover': { bgcolor: alpha(themeColor, 0.15) },
                        }}
                    >
                        <NextIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 时间段网格 */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
                    {t('resources.timeSlotAvailability')}
                </Typography>

                <Grid container spacing={0.5}>
                    {timeSlots.map((timeSlot) => {
                        const status = getTimeSlotStatus(timeSlot);
                        const statusDisplay = getStatusDisplay(status);

                        return (
                            <Grid item xs={4} sm={3} md={2} lg={1.5} key={timeSlot}>
                                <Box
                                    sx={{
                                        py: 0.75,
                                        borderRadius: 1,
                                        bgcolor: status === 'available' ? 'rgba(16,185,129,0.08)' :
                                                 status === 'booked' ? 'rgba(245,158,11,0.08)' :
                                                 'rgba(0,0,0,0.04)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: statusDisplay.color,
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        {timeSlot}
                                    </Typography>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* 图例和统计信息 */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
                {/* 图例 */}
                <Box sx={{ flex: 1 }}>
                    <Box display="flex" gap={3}>
                        {['available', 'booked', 'unavailable'].map((status) => {
                            const statusDisplay = getStatusDisplay(status);
                            return (
                                <Box key={status} display="flex" alignItems="center" gap={1}>
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: statusDisplay.color,
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                        {statusDisplay.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* 今日预约统计 */}
                {availabilityData?.bookingSlots && availabilityData.bookingSlots.length > 0 && (
                    <Box sx={{ flex: 2, mt: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                {t('resources.availability.todayBookings')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                                ({availabilityData.bookingSlots.length})
                            </Typography>
                        </Box>
                        
                        <Grid container spacing={1.5}>
                            {availabilityData.bookingSlots.map((slot: any, index: number) => {
                                const actualStatus = slot.appointment?.status || slot.status;

                                const getStatusColor = () => {
                                    switch(actualStatus) {
                                        case 'COMPLETED': return '#10B981';
                                        case 'CANCELLED': return '#EF4444';
                                        case 'NO_SHOW': return '#8B5CF6';
                                        case 'CHECKED_IN': return '#F59E0B';
                                        default: return '#3B82F6';
                                    }
                                };

                                const statusColor = getStatusColor();

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Box
                                            sx={{
                                                cursor: 'pointer',
                                                p: 2,
                                                borderRadius: 2,
                                                border: '1px solid rgba(0,0,0,0.06)',
                                                bgcolor: '#fff',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.02)',
                                                },
                                            }}
                                            onClick={() => fetchBookingDetails(slot)}
                                        >
                                            {/* 时间和状态 */}
                                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                                    {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusColor }} />
                                                    <Typography variant="caption" sx={{ color: statusColor }}>
                                                        {(() => {
                                                            const statusMap: { [key: string]: string } = {
                                                                'BOOKED': 'appointments.appointmentStatuses.confirmed',
                                                                'CONFIRMED': 'appointments.appointmentStatuses.confirmed',
                                                                'CHECKED_IN': 'appointments.appointmentStatuses.checked-in',
                                                                'COMPLETED': 'appointments.appointmentStatuses.completed',
                                                                'CANCELLED': 'appointments.appointmentStatuses.cancelled',
                                                                'NO_SHOW': 'appointments.appointmentStatuses.no-show'
                                                            };
                                                            const translationKey = statusMap[actualStatus];
                                                            return translationKey ? t(translationKey) : actualStatus;
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* 客户信息 */}
                                            {slot.customerName && (
                                                <Typography variant="body2" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                                                    {slot.customerName}
                                                </Typography>
                                            )}

                                            {/* 服务信息 */}
                                            {(slot.appointmentServices && slot.appointmentServices.length > 0) && (
                                                <Typography variant="caption" sx={{ color: '#999' }}>
                                                    {slot.appointmentServices.map((s: any) => s.serviceName).join(', ')}
                                                </Typography>
                                            )}

                                            {/* 价格 */}
                                            {(slot.totalAmount !== undefined && slot.totalAmount !== null) && (
                                                <Box display="flex" justifyContent="flex-end" mt={1}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                                        ${slot.totalAmount}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}
            </Box>

            {/* 预约详情对话框 */}
            <Dialog
                open={bookingDetailsOpen}
                onClose={() => setBookingDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
                disableAutoFocus
                disableEnforceFocus
                PaperProps={{
                    sx: {
                        borderRadius: 2.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }
                }}
            >
                <DialogTitle sx={{ py: 2, px: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {t('appointments.appointmentDetails')}
                        </Typography>
                        <IconButton size="small" onClick={() => setBookingDetailsOpen(false)} sx={{ color: '#999' }}>
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
            <DialogContent>
                {loadingBookingDetails ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress sx={{ color: themeColor }} />
                    </Box>
                ) : selectedBooking ? (
                    <Grid container spacing={3}>
                        {/* 客户信息 */}
                        {selectedBooking.customer && (
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    {t('appointments.customerInfo')}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                        {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2">{selectedBooking.customer.phone || '-'}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2">{selectedBooking.customer.email || '-'}</Typography>
                                </Box>
                            </Grid>
                        )}

                        {/* 预约信息 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                {t('appointments.appointmentInfo')}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">{selectedBooking.appointmentDate}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                    {selectedBooking.appointmentTime}
                                    {selectedBooking.duration && ` (${selectedBooking.duration} ${t('appointments.minutesUnit')})`}
                                </Typography>
                            </Box>
                            {selectedBooking.resource && (
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2">{selectedBooking.resource.name}</Typography>
                                </Box>
                            )}
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {t('appointments.status')}:
                                    <Chip
                                        size="small"
                                        label={(() => {
                                            const statusMap: { [key: string]: string } = {
                                                'BOOKED': 'appointments.appointmentStatuses.confirmed',
                                                'CONFIRMED': 'appointments.appointmentStatuses.confirmed',
                                                'CHECKED_IN': 'appointments.appointmentStatuses.checked-in',
                                                'COMPLETED': 'appointments.appointmentStatuses.completed',
                                                'CANCELLED': 'appointments.appointmentStatuses.cancelled',
                                                'NO_SHOW': 'appointments.appointmentStatuses.no-show'
                                            };
                                            const translationKey = statusMap[selectedBooking.status];
                                            return translationKey ? t(translationKey) : selectedBooking.status;
                                        })()}
                                        sx={{
                                            backgroundColor: (() => {
                                                switch(selectedBooking.status) {
                                                    case 'COMPLETED': return alpha('#10B981', 0.1);
                                                    case 'CANCELLED': return alpha('#EF4444', 0.1);
                                                    case 'NO_SHOW': return alpha('#8B5CF6', 0.1);
                                                    case 'CHECKED_IN': return alpha('#F59E0B', 0.1);
                                                    default: return alpha('#3B82F6', 0.1);
                                                }
                                            })(),
                                            color: (() => {
                                                switch(selectedBooking.status) {
                                                    case 'COMPLETED': return '#10B981';
                                                    case 'CANCELLED': return '#EF4444';
                                                    case 'NO_SHOW': return '#8B5CF6';
                                                    case 'CHECKED_IN': return '#F59E0B';
                                                    default: return '#3B82F6';
                                                }
                                            })(),
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            height: 24,
                                            '& .MuiChip-label': {
                                                px: 2,
                                            },
                                        }}
                                    />
                                </Typography>
                            </Box>
                        </Grid>

                        {/* 服务信息 */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                {t('appointments.services')}
                            </Typography>
                            {selectedBooking.appointmentServices && selectedBooking.appointmentServices.length > 0 ? (
                                <Box>
                                    {selectedBooking.appointmentServices.map((service: any, index: number) => (
                                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="body2">{service.serviceName}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ${service.price} ({service.duration} {t('appointments.minutesUnit')})
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        mt={2}
                                        pt={2}
                                        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                                    >
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {t('appointments.total')}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                                            ${selectedBooking.totalAmount || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('appointments.noServiceDetails')}
                                </Typography>
                            )}
                        </Grid>

                        {/* 备注 */}
                        {selectedBooking.notes && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    {t('appointments.notes')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedBooking.notes}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                ) : (
                    <Box textAlign="center" py={4}>
                        <Typography color="text.secondary">
                            {t('appointments.noDetailsAvailable')}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>

        {/* 日期选择器弹出框 */}
        <Popover
            open={Boolean(datePickerAnchor)}
            anchorEl={datePickerAnchor}
            onClose={handleDatePickerClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
        >
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
                <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={(() => {
                        // 解析日期字符串，避免时区问题
                        const [year, month, day] = selectedDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                    })()}
                    onChange={handleDateChange}
                    slotProps={{
                        actionBar: {
                            actions: []
                        }
                    }}
                />
            </LocalizationProvider>
        </Popover>
        </Box>
    );
};

export default DetailedAvailabilityView;