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
    TextField,
    Button,
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
    onBack?: () => void;
}

const DetailedAvailabilityView: React.FC<DetailedAvailabilityViewProps> = ({
    resourceId,
    resourceName,
    resourceType,
    onBack,
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
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    p: 4,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha('#f8fafc', 0.5)}, white)`,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha('#3B82F6', 0.1)}, ${alpha('#3B82F6', 0.05)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    }}
                >
                    <CircularProgress sx={{ color: '#3B82F6' }} size={24} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                    {t('appointments.loadingAvailability')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    正在获取详细可用性信息...
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    p: 4,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha('#EF4444', 0.02)}, white)`,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha('#EF4444', 0.1)}, ${alpha('#EF4444', 0.05)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    }}
                >
                    <UnavailableIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#EF4444', mb: 0.5 }}>
                    加载失败
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {error}
                </Typography>
            </Paper>
        );
    }

    const themeColor = '#3B82F6';

    return (
        <Box>
            {/* 头部信息卡片 */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    mb: 3,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.02)})`,
                        p: 3,
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                            {onBack && (
                                <Button
                                    variant="contained"
                                    onClick={onBack}
                                    sx={{
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${themeColor}, ${alpha(themeColor, 0.8)})`,
                                        boxShadow: `0 2px 8px ${alpha(themeColor, 0.3)}`,
                                        fontWeight: 600,
                                        minWidth: 'auto',
                                        px: 2,
                                        '&:hover': {
                                            background: `linear-gradient(135deg, ${alpha(themeColor, 0.9)}, ${themeColor})`,
                                            transform: 'translateY(-1px)',
                                            boxShadow: `0 4px 12px ${alpha(themeColor, 0.4)}`,
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    ← {t('common.back')}
                                </Button>
                            )}
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${themeColor}, ${alpha(themeColor, 0.8)})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 2px 8px ${alpha(themeColor, 0.3)}`,
                                }}
                            >
                                {resourceType === 'STAFF' ? (
                                    <AvailableIcon sx={{ color: 'white', fontSize: 20 }} />
                                ) : (
                                    <BookedIcon sx={{ color: 'white', fontSize: 20 }} />
                                )}
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                                    {resourceName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
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
                                    backgroundColor: alpha(themeColor, 0.1),
                                    '&:hover': {
                                        backgroundColor: alpha(themeColor, 0.2),
                                        transform: 'scale(1.05)',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {/* 日期选择卡片 */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    mb: 3,
                    p: 2,
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                    <IconButton 
                        size="small"
                        onClick={() => navigateDate('prev')} 
                        sx={{ 
                            color: themeColor,
                            backgroundColor: alpha(themeColor, 0.1),
                            '&:hover': {
                                backgroundColor: alpha(themeColor, 0.2),
                                transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <PrevIcon fontSize="small" />
                    </IconButton>
                    
                    <Box
                        sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.02)})`,
                            border: `1px solid ${alpha(themeColor, 0.1)}`,
                        }}
                    >
                        <TextField
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    minWidth: 140,
                                    backgroundColor: 'white',
                                    border: 'none',
                                    '& fieldset': {
                                        border: 'none',
                                    },
                                    '&:hover': {
                                        backgroundColor: '#f8fafc',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'white',
                                        boxShadow: `0 0 0 2px ${alpha(themeColor, 0.1)}`,
                                    },
                                },
                                '& .MuiInputBase-input': {
                                    fontWeight: 500,
                                    color: themeColor,
                                    fontSize: '0.875rem',
                                },
                            }}
                        />
                    </Box>
                    
                    <IconButton 
                        size="small"
                        onClick={() => navigateDate('next')} 
                        sx={{ 
                            color: themeColor,
                            backgroundColor: alpha(themeColor, 0.1),
                            '&:hover': {
                                backgroundColor: alpha(themeColor, 0.2),
                                transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <NextIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Paper>

            {/* 时间段网格卡片 */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    p: 3,
                    mb: 3,
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2, fontSize: '1rem' }}>
                    📅 时间段可用性
                </Typography>
                
                <Grid container spacing={1}>
                    {timeSlots.map((timeSlot) => {
                        const status = getTimeSlotStatus(timeSlot);
                        const statusDisplay = getStatusDisplay(status);

                        return (
                            <Grid item xs={4} sm={3} md={2} lg={1.5} key={timeSlot}>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 1.5,
                                        background: `linear-gradient(135deg, ${statusDisplay.backgroundColor}, ${alpha(statusDisplay.color, 0.05)})`,
                                        border: `1px solid ${alpha(statusDisplay.color, 0.15)}`,
                                        textAlign: 'center',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        minHeight: 48,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            boxShadow: `0 2px 8px ${alpha(statusDisplay.color, 0.2)}`,
                                            borderColor: alpha(statusDisplay.color, 0.3),
                                        },
                                    }}
                                >
                                    <Box sx={{ color: statusDisplay.color, mb: 0.25 }}>
                                        {React.cloneElement(statusDisplay.icon, { sx: { fontSize: 14 } })}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 600,
                                            color: statusDisplay.color,
                                            fontSize: '0.7rem',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {timeSlot}
                                    </Typography>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>

            {/* 图例和统计信息 */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
                {/* 图例卡片 */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        p: 2.5,
                        flex: 1,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5, fontSize: '0.875rem' }}>
                        🎯 {t('resources.availability.legend')}
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                        {['available', 'booked', 'unavailable'].map((status) => {
                            const statusDisplay = getStatusDisplay(status);
                            return (
                                <Box key={status} display="flex" alignItems="center" gap={1.5}>
                                    <Box
                                        sx={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 1.5,
                                            background: `linear-gradient(135deg, ${statusDisplay.color}, ${alpha(statusDisplay.color, 0.8)})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                        }}
                                    >
                                        {React.cloneElement(statusDisplay.icon, { sx: { fontSize: 12 } })}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem' }}>
                                        {statusDisplay.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>

                {/* 预约统计卡片 */}
                {availabilityData?.bookingSlots && availabilityData.bookingSlots.length > 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(0,0,0,0.04)',
                            p: 2.5,
                            flex: 1,
                            background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.02)}, white)`,
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#F59E0B', mb: 1.5, fontSize: '0.875rem' }}>
                            📊 {t('resources.availability.todayBookings')} ({availabilityData.bookingSlots.length})
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {availabilityData.bookingSlots.map((slot: any, index: number) => (
                                <Box
                                    key={index}
                                    sx={{
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1.5,
                                        background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.1)}, ${alpha('#F59E0B', 0.05)})`,
                                        border: `1px solid ${alpha('#F59E0B', 0.2)}`,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            transform: 'scale(1.02)',
                                            boxShadow: `0 1px 4px ${alpha('#F59E0B', 0.3)}`,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 600,
                                            color: '#F59E0B',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {slot.startTime.slice(0, 5)}-{slot.endTime.slice(0, 5)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default DetailedAvailabilityView;