import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Grid,
    Collapse,
    IconButton,
    alpha,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Schedule as ScheduleIcon,
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { resourceApi, ResourceAvailability } from '../../services/api';

interface ResourceAvailabilityDisplayProps {
    resourceId: number;
    resourceName: string;
    resourceType: 'STAFF' | 'ROOM';
    selectedDate?: string;
    compact?: boolean;
}

const ResourceAvailabilityDisplay: React.FC<ResourceAvailabilityDisplayProps> = ({
    resourceId,
    resourceName,
    resourceType,
    selectedDate,
    compact = false,
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const [availabilities, setAvailabilities] = useState<ResourceAvailability[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 星期配置
    const weekDays = [
        { key: 1, label: t('staff.weekdays.monday'), short: 'Mon' },
        { key: 2, label: t('staff.weekdays.tuesday'), short: 'Tue' },
        { key: 3, label: t('staff.weekdays.wednesday'), short: 'Wed' },
        { key: 4, label: t('staff.weekdays.thursday'), short: 'Thu' },
        { key: 5, label: t('staff.weekdays.friday'), short: 'Fri' },
        { key: 6, label: t('staff.weekdays.saturday'), short: 'Sat' },
        { key: 7, label: t('staff.weekdays.sunday'), short: 'Sun' },
    ];

    // 获取资源可用性
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            setError(null);

            try {
                const availability = await resourceApi.getResourceAvailability(resourceId);
                setAvailabilities(availability);

                // 如果选择了日期，获取当天的预约情况
                if (selectedDate) {
                    // 这里可以添加获取当天已预约时间段的逻辑
                    // const bookings = await resourceApi.getResourceBookingSlots(resourceId, selectedDate);
                    // setBookedSlots(bookings.map(booking => `${booking.startTime}-${booking.endTime}`));
                }
            } catch (err) {
                console.error('Failed to fetch resource availability:', err);
                setError(t('resources.loadError'));
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [resourceId, selectedDate, t]);

    // 获取今天是星期几
    const getTodayDayOfWeek = () => {
        const today = selectedDate ? new Date(selectedDate) : new Date();
        const dayOfWeek = today.getDay();
        return dayOfWeek === 0 ? 7 : dayOfWeek;
    };

    // 获取指定日期的可用性
    const getAvailabilityForDay = (dayOfWeek: number) => {
        return availabilities.filter(av => av.dayOfWeek === dayOfWeek && av.isAvailable);
    };

    // 紧凑模式 - 只显示今天或选择日期的可用性
    if (compact) {
        const todayDayOfWeek = getTodayDayOfWeek();
        const todayAvailability = getAvailabilityForDay(todayDayOfWeek);
        const todayLabel = weekDays.find(day => day.key === todayDayOfWeek)?.label || '';

        if (loading) {
            return (
                <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">
                        {t('appointments.loadingAvailability')}
                    </Typography>
                </Box>
            );
        }

        if (error) {
            return (
                <Alert severity="error" sx={{ borderRadius: 1, py: 0.5 }}>
                    <Typography variant="caption">{error}</Typography>
                </Alert>
            );
        }

        return (
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: alpha('#8B5CF6', 0.2),
                    borderRadius: 2,
                    background: alpha('#8B5CF6', 0.02),
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                        {resourceName} - {todayLabel}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                        sx={{ color: '#8B5CF6' }}
                    >
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                {todayAvailability.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={0.25}>
                        {todayAvailability.map((availability, index) => (
                            <Box
                                key={index}
                                sx={{
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: 1,
                                    backgroundColor: alpha('#10B981', 0.1),
                                    border: `1px solid ${alpha('#10B981', 0.2)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.25,
                                    minHeight: 18,
                                }}
                            >
                                <AvailableIcon sx={{ fontSize: 10, color: '#10B981' }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#10B981',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        lineHeight: 1,
                                    }}
                                >
                                    {availability.startTime.slice(0, 5)}-{availability.endTime.slice(0, 5)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            backgroundColor: alpha('#EF4444', 0.1),
                            border: `1px solid ${alpha('#EF4444', 0.2)}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.25,
                            minHeight: 18,
                            width: 'fit-content',
                        }}
                    >
                        <UnavailableIcon sx={{ fontSize: 10, color: '#EF4444' }} />
                        <Typography
                            variant="caption"
                            sx={{
                                color: '#EF4444',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                lineHeight: 1,
                            }}
                        >
                            {t('resources.availability.unavailable')}
                        </Typography>
                    </Box>
                )}

                <Collapse in={expanded}>
                    <Box mt={2}>
                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                            {t('resources.availability.weekView')}
                        </Typography>
                        <Grid container spacing={1}>
                            {weekDays.map((day) => {
                                const dayAvailability = getAvailabilityForDay(day.key);
                                return (
                                    <Grid item xs={12} key={day.key}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="caption" sx={{ minWidth: 40, fontWeight: 500 }}>
                                                {day.short}
                                            </Typography>
                                            {dayAvailability.length > 0 ? (
                                                <Box display="flex" flexWrap="wrap" gap={0.25}>
                                                    {dayAvailability.map((availability, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                px: 0.5,
                                                                py: 0.125,
                                                                borderRadius: 0.75,
                                                                backgroundColor: alpha('#10B981', 0.1),
                                                                border: `1px solid ${alpha('#10B981', 0.2)}`,
                                                                minHeight: 14,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: '#10B981',
                                                                    fontSize: '0.55rem',
                                                                    fontWeight: 600,
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                {availability.startTime.slice(0, 5)}-{availability.endTime.slice(0, 5)}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        px: 0.5,
                                                        py: 0.125,
                                                        borderRadius: 0.75,
                                                        backgroundColor: alpha('#EF4444', 0.1),
                                                        border: `1px solid ${alpha('#EF4444', 0.2)}`,
                                                        minHeight: 14,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        width: 'fit-content',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: '#EF4444',
                                                            fontSize: '0.55rem',
                                                            fontWeight: 600,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {t('resources.availability.unavailable')}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>
        );
    }

    // 完整模式 - 显示完整的周可用性
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={2}>
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
                p: 2,
                border: '1px solid',
                borderColor: alpha('#8B5CF6', 0.2),
                borderRadius: 2,
                background: alpha('#8B5CF6', 0.02),
            }}
        >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ScheduleIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                    {resourceName} {t('resources.availability.title')}
                </Typography>
            </Box>

            <Grid container spacing={1}>
                {weekDays.map((day) => {
                    const dayAvailability = getAvailabilityForDay(day.key);
                    const isToday = day.key === getTodayDayOfWeek();
                    
                    return (
                        <Grid item xs={12} key={day.key}>
                            <Box
                                sx={{
                                    p: 1,
                                    border: '1px solid',
                                    borderColor: isToday ? '#8B5CF6' : alpha('#8B5CF6', 0.1),
                                    borderRadius: 1,
                                    background: isToday ? alpha('#8B5CF6', 0.05) : 'white',
                                }}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Typography 
                                        variant="subtitle2" 
                                        sx={{ 
                                            fontWeight: 600,
                                            color: isToday ? '#8B5CF6' : 'text.primary'
                                        }}
                                    >
                                        {day.label} {isToday && `(${t('appointments.today')})`}
                                    </Typography>
                                </Box>

                                {dayAvailability.length > 0 ? (
                                    <Box display="flex" flexWrap="wrap" gap={0.25}>
                                        {dayAvailability.map((availability, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    px: 0.75,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    backgroundColor: alpha('#10B981', 0.1),
                                                    border: `1px solid ${alpha('#10B981', 0.2)}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.25,
                                                    minHeight: 20,
                                                }}
                                            >
                                                <AvailableIcon sx={{ fontSize: 11, color: '#10B981' }} />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: '#10B981',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    {availability.startTime.slice(0, 5)}-{availability.endTime.slice(0, 5)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            px: 0.75,
                                            py: 0.25,
                                            borderRadius: 1,
                                            backgroundColor: alpha('#EF4444', 0.1),
                                            border: `1px solid ${alpha('#EF4444', 0.2)}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.25,
                                            minHeight: 20,
                                            width: 'fit-content',
                                        }}
                                    >
                                        <UnavailableIcon sx={{ fontSize: 11, color: '#EF4444' }} />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: '#EF4444',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {t('resources.availability.unavailable')}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
};

export default ResourceAvailabilityDisplay;