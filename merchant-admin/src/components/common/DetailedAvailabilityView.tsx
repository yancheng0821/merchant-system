import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Grid,
    alpha,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    TextField,
} from '@mui/material';
import {
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon,
    Event as BookedIcon,
    Refresh as RefreshIcon,
    NavigateBefore as PrevIcon,
    NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { resourceApi } from '../../services/api';

interface DetailedAvailabilityViewProps {
    resourceId: number;
    resourceName: string;
    resourceType: 'STAFF' | 'ROOM';
}

const DetailedAvailabilityView: React.FC<DetailedAvailabilityViewProps> = ({
    resourceId,
    resourceName,
    resourceType,
}) => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availabilityData, setAvailabilityData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            console.log('Detailed availability data:', data);
            console.log('Booking slots:', data.bookingSlots);
            setAvailabilityData(data);
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

        const date = new Date(selectedDate);
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

        // 检查是否在工作时间内
        const isInWorkingHours = availabilityData.availabilities?.some((av: any) => {
            if (av.dayOfWeek !== dayOfWeek || !av.isAvailable) return false;
            const slotTime = timeSlot + ':00';
            return slotTime >= av.startTime && slotTime < av.endTime;
        });

        if (!isInWorkingHours) return 'unavailable';

        // 检查是否已被预约
        const isBooked = availabilityData.bookingSlots?.some((slot: any) => {
            const slotTime = timeSlot + ':00';
            // 确保时间格式一致，都使用HH:mm:ss格式进行比较
            const slotStartTime = slot.startTime.length === 5 ? slot.startTime + ':00' : slot.startTime;
            const slotEndTime = slot.endTime.length === 5 ? slot.endTime + ':00' : slot.endTime;
            
            const isInSlot = slotTime >= slotStartTime && slotTime < slotEndTime && slot.status === 'BOOKED';
            if (isInSlot) {
                console.log(`Time slot ${timeSlot} is booked by slot:`, slot);
            }
            return isInSlot;
        });

        const status = isBooked ? 'booked' : 'available';
        if (timeSlot === '10:00' || timeSlot === '14:00') { // 调试特定时间段
            console.log(`Time slot ${timeSlot} status: ${status}, booking slots:`, availabilityData.bookingSlots);
        }
        
        return status;
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

    // 日期导航
    const navigateDate = (direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate);
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        setSelectedDate(newDate.toISOString().split('T')[0]);
    };



    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                    {t('appointments.loadingAvailability')}
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                border: '1px solid',
                borderColor: alpha('#8B5CF6', 0.2),
                borderRadius: 2,
                background: alpha('#8B5CF6', 0.02),
            }}
        >
            {/* 头部 */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                    {resourceName} - {t('resources.availability.detailedView')}
                </Typography>
                <Tooltip title={t('common.refresh')}>
                    <IconButton onClick={fetchDetailedAvailability} sx={{ color: '#8B5CF6' }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* 日期选择和导航 */}
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={3}>
                <IconButton onClick={() => navigateDate('prev')} sx={{ color: '#8B5CF6' }}>
                    <PrevIcon />
                </IconButton>
                
                <TextField
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minWidth: 150,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#8B5CF6',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#8B5CF6',
                            },
                        },
                    }}
                />
                
                <IconButton onClick={() => navigateDate('next')} sx={{ color: '#8B5CF6' }}>
                    <NextIcon />
                </IconButton>
            </Box>

            {/* 时间段网格 */}
            <Grid container spacing={1}>
                {timeSlots.map((timeSlot) => {
                    const status = getTimeSlotStatus(timeSlot);
                    const statusDisplay = getStatusDisplay(status);

                    return (
                        <Grid item xs={6} sm={4} md={3} lg={2} key={timeSlot}>
                            <Chip
                                label={timeSlot}
                                icon={statusDisplay.icon}
                                sx={{
                                    width: '100%',
                                    height: 32,
                                    backgroundColor: statusDisplay.backgroundColor,
                                    color: statusDisplay.color,
                                    fontWeight: 500,
                                    '& .MuiChip-icon': {
                                        fontSize: 16,
                                    },
                                }}
                            />
                        </Grid>
                    );
                })}
            </Grid>

            {/* 图例 */}
            <Box mt={3} p={2} sx={{ backgroundColor: alpha('#F8FAFC', 0.5), borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('resources.availability.legend')}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                    {['available', 'booked', 'unavailable'].map((status) => {
                        const statusDisplay = getStatusDisplay(status);
                        return (
                            <Box key={status} display="flex" alignItems="center" gap={1}>
                                <Box
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        backgroundColor: statusDisplay.color,
                                    }}
                                />
                                <Typography variant="caption">
                                    {statusDisplay.label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* 预约统计 */}
            {availabilityData?.bookingSlots && availabilityData.bookingSlots.length > 0 && (
                <Box mt={2} p={2} sx={{ backgroundColor: alpha('#F59E0B', 0.05), borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#F59E0B', mb: 1 }}>
                        {t('resources.availability.todayBookings')} ({availabilityData.bookingSlots.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {availabilityData.bookingSlots.map((slot: any, index: number) => (
                            <Chip
                                key={index}
                                label={`${slot.startTime.slice(0, 5)}-${slot.endTime.slice(0, 5)}`}
                                size="small"
                                sx={{
                                    backgroundColor: alpha('#F59E0B', 0.1),
                                    color: '#F59E0B',
                                    fontSize: '0.75rem',
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
};

export default DetailedAvailabilityView;