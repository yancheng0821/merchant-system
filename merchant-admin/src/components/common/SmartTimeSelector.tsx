import React, { useState, useEffect, useMemo } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    Alert,
    CircularProgress,
    Grid,
    Paper,
    alpha,
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { resourceApi } from '../../services/api';

interface SmartTimeSelectorProps {
    selectedDate: string;
    selectedTime: string;
    onTimeChange: (time: string) => void;
    resourceId?: number;
    duration?: number; // 预约时长（分钟）
    disabled?: boolean;
}

const SmartTimeSelector: React.FC<SmartTimeSelectorProps> = ({
    selectedDate,
    selectedTime,
    onTimeChange,
    resourceId,
    duration = 60,
    disabled = false,
}) => {
    const { t } = useTranslation();
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 生成时间段选项（30分钟间隔）
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 6; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
        return slots;
    }, []);

    // 检查资源可用性
    useEffect(() => {
        const checkAvailability = async () => {
            if (!resourceId || !selectedDate) {
                setAvailableSlots(timeSlots);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // 获取资源的基础可用性（工作时间）
                const resourceAvailability = await resourceApi.getResourceAvailability(resourceId);
                
                // 获取当天是星期几
                const date = new Date(selectedDate);
                const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 转换为1-7格式

                // 找到当天的工作时间
                const dayAvailability = resourceAvailability.filter(
                    av => av.dayOfWeek === dayOfWeek && av.isAvailable
                );

                if (dayAvailability.length === 0) {
                    setAvailableSlots([]);
                    return;
                }

                // 检查每个时间段是否可用
                const availabilityPromises = timeSlots.map(async (timeSlot) => {
                    // 检查是否在工作时间内
                    const isInWorkingHours = dayAvailability.some(av => {
                        const slotTime = timeSlot + ':00';
                        return slotTime >= av.startTime && slotTime < av.endTime;
                    });

                    if (!isInWorkingHours) {
                        return { timeSlot, available: false };
                    }

                    // 计算结束时间
                    const [hours, minutes] = timeSlot.split(':').map(Number);
                    const startDate = new Date();
                    startDate.setHours(hours, minutes, 0, 0);
                    const endDate = new Date(startDate.getTime() + duration * 60000);
                    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

                    try {
                        // 检查基础可用性
                        const basicAvailable = await resourceApi.checkResourceAvailability(
                            resourceId,
                            selectedDate,
                            timeSlot,
                            endTime
                        );

                        // 检查是否已被预约
                        const isBooked = await resourceApi.checkResourceBookingSlot(
                            resourceId,
                            selectedDate,
                            timeSlot,
                            endTime
                        );

                        return { timeSlot, available: basicAvailable && !isBooked };
                    } catch (error) {
                        console.error(`Failed to check availability for ${timeSlot}:`, error);
                        return { timeSlot, available: false };
                    }
                });

                const results = await Promise.all(availabilityPromises);
                const available = results
                    .filter(result => result.available)
                    .map(result => result.timeSlot);

                setAvailableSlots(available);
            } catch (err) {
                console.error('Failed to check resource availability:', err);
                setError(t('appointments.availabilityCheckError'));
                setAvailableSlots([]);
            } finally {
                setLoading(false);
            }
        };

        checkAvailability();
    }, [resourceId, selectedDate, duration, timeSlots, t]);

    // 如果没有选择资源，显示提示
    if (!resourceId) {
        return (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
                {t('appointments.selectResourceFirst')}
            </Alert>
        );
    }

    if (loading) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                    {t('appointments.checkingAvailability')}
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
        <Box>
            <FormControl fullWidth disabled={disabled}>
                <InputLabel>{t('appointments.appointmentTime')}</InputLabel>
                <Select
                    value={selectedTime}
                    label={t('appointments.appointmentTime')}
                    onChange={(e) => onTimeChange(e.target.value)}
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
                    {timeSlots.map((timeSlot) => {
                        const isAvailable = availableSlots.includes(timeSlot);
                        return (
                            <MenuItem 
                                key={timeSlot} 
                                value={timeSlot}
                                disabled={!isAvailable}
                                sx={{
                                    opacity: isAvailable ? 1 : 0.5,
                                }}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                    <Typography>{timeSlot}</Typography>
                                    {isAvailable ? (
                                        <AvailableIcon sx={{ color: '#10B981', fontSize: 16 }} />
                                    ) : (
                                        <UnavailableIcon sx={{ color: '#EF4444', fontSize: 16 }} />
                                    )}
                                </Box>
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>

            {/* 可用时间段概览 */}
            {availableSlots.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        mt: 2,
                        p: 2,
                        border: '1px solid',
                        borderColor: alpha('#10B981', 0.2),
                        borderRadius: 2,
                        background: alpha('#10B981', 0.02),
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#10B981', mb: 1 }}>
                        {t('appointments.availableTimeSlots')} ({availableSlots.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {availableSlots.map((timeSlot) => (
                            <Chip
                                key={timeSlot}
                                label={timeSlot}
                                size="small"
                                clickable
                                onClick={() => onTimeChange(timeSlot)}
                                sx={{
                                    backgroundColor: selectedTime === timeSlot 
                                        ? '#8B5CF6' 
                                        : alpha('#10B981', 0.1),
                                    color: selectedTime === timeSlot 
                                        ? 'white' 
                                        : '#10B981',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: selectedTime === timeSlot 
                                            ? '#7C3AED' 
                                            : alpha('#10B981', 0.2),
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {availableSlots.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                    {t('appointments.noAvailableTimeSlots')}
                </Alert>
            )}
        </Box>
    );
};

export default SmartTimeSelector;