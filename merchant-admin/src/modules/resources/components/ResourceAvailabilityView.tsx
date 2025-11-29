import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Avatar,
    alpha,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Button,
} from '@mui/material';
import {
    Person as PersonIcon,
    Room as RoomIcon,
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon,
    Today as TodayIcon,
    DateRange as WeekIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getFullImageUrl, ResourceStatus, Resource, ResourceAvailability, staffAttendanceApi } from '../../../services/api';
import DetailedAvailabilityView from '../../../components/common/DetailedAvailabilityView';
import { format } from 'date-fns';
import { getMerchantNow } from '../../../utils/timezoneUtils';
import { useTheme } from '../../../contexts/ThemeContext';

interface ResourceAvailabilityViewProps {
    resourceType: 'STAFF' | 'ROOM';
}

const ResourceAvailabilityView: React.FC<ResourceAvailabilityViewProps> = ({ resourceType }) => {
    const { t } = useTranslation();
    const { themeMode } = useTheme();
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [availabilities, setAvailabilities] = useState<Record<number, ResourceAvailability[]>>({});
    const [resourceStatuses, setResourceStatuses] = useState<Record<number, ResourceStatus>>({});
    const [todayBookings, setTodayBookings] = useState<Record<number, any[]>>({});
    const [staffAttendance, setStaffAttendance] = useState<Map<number, any>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
    const [selectedResourceForDetail, setSelectedResourceForDetail] = useState<Resource | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 根据主题模式动态设置主题色
    const isMonochrome = themeMode === 'monochrome';
    const themeColor = isMonochrome ? '#1a1a1a' : '#3B82F6';

    // 获取租户ID
    const tenantId = useMemo(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return Number(user.tenantId || 1);
    }, []);

    // 时间段配置
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 9; hour <= 21; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 21) {
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    }, []);

    // 星期配置
    const weekDays = useMemo(() => [
        { key: 1, label: t('staff.weekdays.monday') },
        { key: 2, label: t('staff.weekdays.tuesday') },
        { key: 3, label: t('staff.weekdays.wednesday') },
        { key: 4, label: t('staff.weekdays.thursday') },
        { key: 5, label: t('staff.weekdays.friday') },
        { key: 6, label: t('staff.weekdays.saturday') },
        { key: 7, label: t('staff.weekdays.sunday') },
    ], [t]);

    // 获取本地日期字符串（避免时区问题）
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 获取资源数据
    const fetchResources = async () => {
        try {
            setLoading(true);
            const { resourceApi } = await import('../../../services/api');
            const resourcesData = await resourceApi.getResourcesByType(tenantId, resourceType);
            const activeResources = resourcesData.filter((r: Resource) => r.status === 'ACTIVE');
            setResources(activeResources);

            // 今天的日期字符串
            const todayStr = getLocalDateString(new Date());

            // 获取每个资源的可用性、实时状态和今日预约
            const dataPromises = resourcesData.map(async (resource: Resource) => {
                try {
                    const [availability, status, detailedAvailability] = await Promise.all([
                        resourceApi.getResourceAvailability(resource.id),
                        resourceApi.getResourceStatus(resource.id),
                        resourceApi.getResourceDetailedAvailability(resource.id, todayStr)
                    ]);
                    return { 
                        resourceId: resource.id, 
                        availability, 
                        status,
                        todayBookings: detailedAvailability?.bookingSlots || []
                    };
                } catch (err) {
                    console.warn(`Failed to fetch data for resource ${resource.id}:`, err);
                    return { resourceId: resource.id, availability: [], status: null, todayBookings: [] };
                }
            });

            const dataResults = await Promise.all(dataPromises);
            const availabilityMap: Record<number, ResourceAvailability[]> = {};
            const statusMap: Record<number, ResourceStatus> = {};
            const bookingsMap: Record<number, any[]> = {};

            dataResults.forEach(({ resourceId, availability, status, todayBookings }) => {
                availabilityMap[resourceId] = availability;
                if (status) {
                    statusMap[resourceId] = status;
                }
                bookingsMap[resourceId] = todayBookings;
            });

            setAvailabilities(availabilityMap);
            setResourceStatuses(statusMap);
            setTodayBookings(bookingsMap);

            // 如果是员工类型，加载今日考勤数据（check-in/check-out时间）
            if (resourceType === 'STAFF') {
                const now = getMerchantNow();
                const today = format(now, 'yyyy-MM-dd');
                const attendanceMap = new Map<number, any>();

                // 并行加载所有员工的今日考勤数据
                const attendancePromises = activeResources.map((resource) =>
                    staffAttendanceApi.getByResourceAndDate(resource.id, today)
                        .then((attendance) => ({ resourceId: resource.id, attendance: attendance || null }))
                        .catch(() => ({ resourceId: resource.id, attendance: null }))
                );

                const attendanceResults = await Promise.all(attendancePromises);
                attendanceResults.forEach(({ resourceId, attendance }) => {
                    if (attendance) {
                        attendanceMap.set(resourceId, attendance);
                    }
                });

                setStaffAttendance(attendanceMap);
            }
        } catch (err) {
            console.error('获取资源数据失败:', err);
            setError(err instanceof Error ? err.message : '获取资源数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [tenantId, resourceType]);

    // 搜索和过滤逻辑
    useEffect(() => {
        let filtered = resources;

        // 如果是员工类型，应用搜索过滤
        if (resourceType === 'STAFF' && searchTerm) {
            filtered = filtered.filter(resource =>
                resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (resource.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (resource.position || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 如果是员工类型且没有搜索，只显示前9个
        if (resourceType === 'STAFF' && !searchTerm) {
            filtered = filtered.slice(0, 9);
        }

        setFilteredResources(filtered);
    }, [resources, searchTerm, resourceType]);

    // 检查员工当前是否可用（基于check-in/check-out时间）
    const isResourceCurrentlyAvailable = (resourceId: number): boolean => {
        // 获取当前时间
        const now = getMerchantNow();
        const currentTime = format(now, 'HH:mm');

        // 检查是否有考勤记录
        const attendance = staffAttendance.get(resourceId);
        if (attendance && attendance.checkInTime && attendance.checkOutTime) {
            // 有考勤记录，使用实际的check-in/check-out时间
            const checkInTime = attendance.checkInTime.slice(0, 5);
            const checkOutTime = attendance.checkOutTime.slice(0, 5);
            return currentTime >= checkInTime && currentTime < checkOutTime;
        }

        // 没有考勤记录，使用排班时间判断
        const resourceAvailability = availabilities[resourceId] || [];
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

        return resourceAvailability.some((av: any) => {
            if (av.dayOfWeek !== dayOfWeek || !av.isAvailable) {
                return false;
            }

            const startTime = av.startTime.slice(0, 5);
            const endTime = av.endTime.slice(0, 5);

            return currentTime >= startTime && currentTime < endTime;
        });
    };

    // 检查资源在特定时间的可用性（包括检查预约占用和员工check-in/check-out时间）
    const checkResourceAvailability = (resourceId: number, dayOfWeek: number, time: string, checkBookings: boolean = false): 'available' | 'booked' | 'unavailable' => {
        const resourceAvailability = availabilities[resourceId] || [];
        const timeHour = parseInt(time.split(':')[0]);
        const timeMinute = parseInt(time.split(':')[1]);
        const timeInMinutes = timeHour * 60 + timeMinute;

        // 如果是员工资源且是今日视图，优先检查实际的check-in/check-out时间
        const isTodayView = dayOfWeek === getTodayDayOfWeek();
        if (resourceType === 'STAFF' && isTodayView) {
            const attendance = staffAttendance.get(resourceId);
            if (attendance && attendance.checkInTime && attendance.checkOutTime) {
                // 员工有check-in/check-out记录，使用实际时间
                const checkInTime = attendance.checkInTime.slice(0, 5); // HH:mm
                const checkOutTime = attendance.checkOutTime.slice(0, 5); // HH:mm

                const [checkInHour, checkInMin] = checkInTime.split(':').map(Number);
                const [checkOutHour, checkOutMin] = checkOutTime.split(':').map(Number);
                const checkInMinutes = checkInHour * 60 + checkInMin;
                const checkOutMinutes = checkOutHour * 60 + checkOutMin;

                // 检查时间是否在check-in和check-out之间
                if (timeInMinutes < checkInMinutes || timeInMinutes >= checkOutMinutes) {
                    return 'unavailable';
                }
            } else {
                // 没有check-in/check-out记录，使用基础排班检查
                const isBasicallyAvailable = resourceAvailability.some(availability => {
                    if (availability.dayOfWeek !== dayOfWeek || !availability.isAvailable) {
                        return false;
                    }

                    const startHour = parseInt(availability.startTime.split(':')[0]);
                    const startMinute = parseInt(availability.startTime.split(':')[1]);
                    const startInMinutes = startHour * 60 + startMinute;

                    const endHour = parseInt(availability.endTime.split(':')[0]);
                    const endMinute = parseInt(availability.endTime.split(':')[1]);
                    const endInMinutes = endHour * 60 + endMinute;

                    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
                });

                if (!isBasicallyAvailable) {
                    return 'unavailable';
                }
            }
        } else {
            // 非今日视图或非员工资源，使用基础排班检查
            const isBasicallyAvailable = resourceAvailability.some(availability => {
                if (availability.dayOfWeek !== dayOfWeek || !availability.isAvailable) {
                    return false;
                }

                const startHour = parseInt(availability.startTime.split(':')[0]);
                const startMinute = parseInt(availability.startTime.split(':')[1]);
                const startInMinutes = startHour * 60 + startMinute;

                const endHour = parseInt(availability.endTime.split(':')[0]);
                const endMinute = parseInt(availability.endTime.split(':')[1]);
                const endInMinutes = endHour * 60 + endMinute;

                return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
            });

            if (!isBasicallyAvailable) {
                return 'unavailable';
            }
        }

        // 如果需要检查预约占用
        if (checkBookings && todayBookings[resourceId]) {
            const timeStr = time + ':00'; // 转换为HH:mm:ss格式
            const isBooked = todayBookings[resourceId].some((booking: any) => {
                const startTime = booking.startTime.length === 5 ? booking.startTime + ':00' : booking.startTime;
                const endTime = booking.endTime.length === 5 ? booking.endTime + ':00' : booking.endTime;
                return timeStr >= startTime && timeStr < endTime && booking.status === 'BOOKED';
            });

            if (isBooked) {
                return 'booked';
            }
        }

        return 'available';
    };

    // 获取资源头像/图标
    const getResourceIcon = (resource: Resource) => {
        if (resource.type === 'STAFF') {
            if (resource.avatar) {
                return (
                    <Avatar
                        src={getFullImageUrl(resource.avatar)}
                        sx={{ width: 32, height: 32 }}
                    >
                        {resource.name.charAt(0)}
                    </Avatar>
                );
            }
            return (
                <Avatar sx={{ width: 32, height: 32, bgcolor: themeColor }}>
                    {resource.name.charAt(0)}
                </Avatar>
            );
        } else {
            if (resource.icon) {
                const isImageUrl = resource.icon.startsWith('http') || resource.icon.startsWith('/api/') || resource.icon.startsWith('data:') || resource.icon.startsWith('blob:');
                if (isImageUrl) {
                    return (
                        <img
                            src={getFullImageUrl(resource.icon)}
                            alt={resource.name}
                            style={{
                                width: '32px',
                                height: '32px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                            }}
                        />
                    );
                }
                return <span style={{ fontSize: '20px' }}>{resource.icon}</span>;
            }
            return <RoomIcon sx={{ fontSize: 24, color: themeColor }} />;
        }
    };

    // 获取今天是星期几
    const getTodayDayOfWeek = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        return dayOfWeek === 0 ? 7 : dayOfWeek; // 转换为1-7格式，1为周一
    };

    // 渲染今日视图
    const renderTodayView = () => {
        const todayDayOfWeek = getTodayDayOfWeek();

        return (
            <Grid container spacing={4}>
                {filteredResources.map((resource) => {
                    const availableSlots = timeSlots.filter(time => 
                        checkResourceAvailability(resource.id, todayDayOfWeek, time, true) === 'available'
                    );
                    const bookedSlots = timeSlots.filter(time =>
                        checkResourceAvailability(resource.id, todayDayOfWeek, time, true) === 'booked'
                    );
                    const unavailableSlots = timeSlots.filter(time => 
                        checkResourceAvailability(resource.id, todayDayOfWeek, time, true) === 'unavailable'
                    );
                    const availabilityPercentage = Math.round((availableSlots.length / timeSlots.length) * 100);
                    
                    return (
                        <Grid item xs={12} md={6} lg={4} key={resource.id}>
                            <Card
                                sx={{
                                    borderRadius: 2.5,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    height: '100%',
                                    bgcolor: '#fff',
                                    '&:hover': {
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    },
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    {/* 资源头部信息 */}
                                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                        {getResourceIcon(resource)}
                                        <Box flex={1}>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                                    {resource.name}
                                                </Typography>
                                                {/* 实时状态指示器 */}
                                                {(() => {
                                                    const currentlyAvailable = isResourceCurrentlyAvailable(resource.id);
                                                    return (
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <Box
                                                                sx={{
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: '50%',
                                                                    bgcolor: currentlyAvailable ? '#10B981' : '#EF4444',
                                                                }}
                                                            />
                                                            <Typography variant="caption" sx={{ color: currentlyAvailable ? '#10B981' : '#EF4444' }}>
                                                                {currentlyAvailable ?
                                                                    t('resources.availability.available') :
                                                                    t('resources.availability.unavailable')}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })()}
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#999' }}>
                                                {resource.type === 'STAFF' ? t('resources.type.staff') : t('resources.type.room')}
                                                {resource.type === 'ROOM' && resource.capacity && ` • ${resource.capacity}人`}
                                                {resource.location && ` • ${resource.location}`}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* 可用性统计 */}
                                    <Box mb={2}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="caption" sx={{ color: '#666' }}>
                                                {t('resources.availability.todaySchedule')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                                {availabilityPercentage}%
                                            </Typography>
                                        </Box>

                                        {/* 进度条 */}
                                        <Box
                                            sx={{
                                                height: 4,
                                                borderRadius: 2,
                                                bgcolor: 'rgba(0,0,0,0.04)',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    width: `${availabilityPercentage}%`,
                                                    bgcolor: '#10B981',
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* 时间段网格 */}
                                    <Box mb={2}>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(6, 1fr)',
                                                gap: 0.5,
                                            }}
                                        >
                                            {timeSlots.slice(0, 24).map((time) => {
                                                const status = checkResourceAvailability(resource.id, todayDayOfWeek, time, true);
                                                return (
                                                    <Box
                                                        key={time}
                                                        sx={{
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            textAlign: 'center',
                                                            bgcolor:
                                                                status === 'available' ? 'rgba(16,185,129,0.08)' :
                                                                status === 'booked' ? 'rgba(245,158,11,0.08)' :
                                                                'rgba(0,0,0,0.04)',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color:
                                                                    status === 'available' ? '#10B981' :
                                                                    status === 'booked' ? '#F59E0B' :
                                                                    '#999',
                                                                fontSize: '0.6rem',
                                                            }}
                                                        >
                                                            {time}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>

                                        {timeSlots.length > 24 && (
                                            <Typography variant="caption" sx={{ color: '#999', textAlign: 'center', display: 'block', mt: 1 }}>
                                                +{timeSlots.length - 24} {t('resources.moreTimeSlots')}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* 查看详细按钮 */}
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => {
                                            setSelectedResourceForDetail(resource);
                                        }}
                                        sx={{
                                            borderRadius: 1.5,
                                            py: 1,
                                            borderColor: 'rgba(0,0,0,0.15)',
                                            color: '#666',
                                            fontWeight: 500,
                                            '&:hover': {
                                                borderColor: themeColor,
                                                color: themeColor,
                                                bgcolor: 'rgba(59,130,246,0.04)',
                                            },
                                        }}
                                    >
                                        {t('resources.availability.viewDetailed')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        );
    };

    // 渲染周视图
    const renderWeekView = () => {
        return (
            <Card
                sx={{
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 900 }}>
                        {/* 表头 */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '240px repeat(7, 1fr)',
                                background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.02)})`,
                                borderBottom: `2px solid ${alpha(themeColor, 0.1)}`,
                            }}
                        >
                            <Box sx={{ p: 3, fontWeight: 700, color: '#374151', fontSize: '0.95rem' }}>
                                {resourceType === 'STAFF' ? t('resources.type.staff') : t('resources.type.room')}
                            </Box>
                            {weekDays.map((day, index) => {
                                const isToday = day.key === getTodayDayOfWeek();
                                return (
                                    <Box 
                                        key={day.key} 
                                        sx={{ 
                                            p: 3, 
                                            textAlign: 'center', 
                                            fontWeight: 700,
                                            color: isToday ? themeColor : '#374151',
                                            fontSize: '0.95rem',
                                            position: 'relative',
                                            ...(isToday && {
                                                '&::after': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    width: 20,
                                                    height: 3,
                                                    backgroundColor: themeColor,
                                                    borderRadius: '2px 2px 0 0',
                                                },
                                            }),
                                        }}
                                    >
                                        {day.label}
                                        {isToday && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: '50%',
                                                    backgroundColor: themeColor,
                                                    animation: 'pulse 2s infinite',
                                                    '@keyframes pulse': {
                                                        '0%': { opacity: 1 },
                                                        '50%': { opacity: 0.5 },
                                                        '100%': { opacity: 1 },
                                                    },
                                                }}
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        {/* 资源行 */}
                        {filteredResources.map((resource, resourceIndex) => (
                            <Box
                                key={resource.id}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '240px repeat(7, 1fr)',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    backgroundColor: resourceIndex % 2 === 0 ? 'transparent' : alpha('#f8fafc', 0.5),
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: alpha(themeColor, 0.03),
                                        transform: 'scale(1.01)',
                                        boxShadow: `inset 0 0 0 1px ${alpha(themeColor, 0.1)}`,
                                    },
                                }}
                            >
                                {/* 资源信息 */}
                                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            '&::after': {
                                                content: '""',
                                                position: 'absolute',
                                                top: -2,
                                                left: -2,
                                                right: -2,
                                                bottom: -2,
                                                borderRadius: '50%',
                                                background: `linear-gradient(45deg, ${themeColor}, ${alpha(themeColor, 0.6)})`,
                                                zIndex: -1,
                                                opacity: 0.1,
                                            },
                                        }}
                                    >
                                        {getResourceIcon(resource)}
                                    </Box>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                                                {resource.name}
                                            </Typography>
                                            {/* 实时状态指示器 */}
                                            {resourceStatuses[resource.id] && (
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: resourceStatuses[resource.id].currentlyAvailable
                                                            ? '#10B981' : '#EF4444',
                                                        animation: resourceStatuses[resource.id].currentlyAvailable 
                                                            ? 'pulse 2s infinite' : 'none',
                                                        '@keyframes pulse': {
                                                            '0%': { opacity: 1 },
                                                            '50%': { opacity: 0.5 },
                                                            '100%': { opacity: 1 },
                                                        },
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                            {resource.description || resource.position || '-'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* 每天的可用性 */}
                                {weekDays.map((day) => {
                                    const dayAvailability = availabilities[resource.id]?.filter(
                                        a => a.dayOfWeek === day.key && a.isAvailable
                                    ) || [];
                                    const isToday = day.key === getTodayDayOfWeek();

                                    return (
                                        <Box 
                                            key={day.key} 
                                            sx={{ 
                                                p: 2, 
                                                textAlign: 'center',
                                                position: 'relative',
                                                ...(isToday && {
                                                    backgroundColor: alpha(themeColor, 0.02),
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: 2,
                                                        backgroundColor: themeColor,
                                                    },
                                                }),
                                            }}
                                        >
                                            {dayAvailability.length > 0 ? (
                                                <Box display="flex" flexWrap="wrap" gap={0.25} justifyContent="center">
                                                    {dayAvailability.map((availability, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                px: 0.5,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                background: `linear-gradient(135deg, ${alpha('#10B981', 0.1)}, ${alpha('#10B981', 0.05)})`,
                                                                border: `1px solid ${alpha('#10B981', 0.2)}`,
                                                                transition: 'all 0.2s ease',
                                                                minHeight: 16,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                '&:hover': {
                                                                    transform: 'scale(1.05)',
                                                                    boxShadow: `0 1px 4px ${alpha('#10B981', 0.3)}`,
                                                                },
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: '#10B981',
                                                                    fontSize: '0.65rem',
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
                                                        background: `linear-gradient(135deg, ${alpha('#EF4444', 0.1)}, ${alpha('#EF4444', 0.05)})`,
                                                        border: `1px solid ${alpha('#EF4444', 0.2)}`,
                                                        minHeight: 16,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#EF4444',
                                                            fontSize: '0.65rem',
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {t('resources.availability.unavailable')}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Card>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress sx={{ color: themeColor }} />
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
            {/* 头部控制栏 */}
            <Box
                sx={{
                    mb: 3,
                    pb: 2,
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                            sx={{
                                width: 4,
                                height: 24,
                                bgcolor: themeColor,
                                borderRadius: 0.5,
                            }}
                        />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                {resourceType === 'STAFF'
                                    ? t('resources.availability.staffAvailability')
                                    : t('resources.availability.roomAvailability')
                                }
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                                {t('resources.availability.subtitle')}
                            </Typography>
                        </Box>
                    </Box>

                    {!selectedResourceForDetail && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <Tooltip title={t('common.refresh')}>
                                <IconButton
                                    size="small"
                                    onClick={fetchResources}
                                    sx={{
                                        color: themeColor,
                                        bgcolor: alpha(themeColor, 0.08),
                                        '&:hover': { bgcolor: alpha(themeColor, 0.15) },
                                    }}
                                >
                                    <RefreshIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>

                            <Box
                                sx={{
                                    bgcolor: alpha(themeColor, 0.08),
                                    borderRadius: 1.5,
                                    p: 0.5,
                                }}
                            >
                                <Tabs
                                    value={viewMode}
                                    onChange={(_, newValue) => setViewMode(newValue)}
                                    sx={{
                                        minHeight: 'auto',
                                        '& .MuiTab-root': {
                                            minHeight: 'auto',
                                            py: 0.75,
                                            px: 2,
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            borderRadius: 1,
                                            textTransform: 'none',
                                            '&.Mui-selected': {
                                                color: '#fff',
                                                bgcolor: themeColor,
                                            },
                                            '&:not(.Mui-selected)': {
                                                color: themeColor,
                                            },
                                        },
                                        '& .MuiTabs-indicator': {
                                            display: 'none',
                                        },
                                    }}
                                >
                                    <Tab
                                        value="today"
                                        label={t('resources.availability.todayView')}
                                        icon={<TodayIcon sx={{ fontSize: 16 }} />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        value="week"
                                        label={t('resources.availability.weekView')}
                                        icon={<WeekIcon sx={{ fontSize: 16 }} />}
                                        iconPosition="start"
                                    />
                                </Tabs>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* 搜索框 - 仅员工类型显示且不在详细视图中 */}
            {resourceType === 'STAFF' && !selectedResourceForDetail && (
                <Box sx={{ mb: 2.5 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={t('resources.availability.searchStaffPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                fontSize: '0.875rem',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(0,0,0,0.12)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: themeColor,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: themeColor,
                                },
                            },
                        }}
                    />
                    {!searchTerm && (
                        <Typography variant="caption" sx={{ color: '#999', mt: 0.5, display: 'block' }}>
                            {t('resources.availability.showingFirst9Staff')}
                        </Typography>
                    )}
                </Box>
            )}

            {/* 内容区域 */}
            {filteredResources.length === 0 ? (
                <Card
                    sx={{
                        borderRadius: 4,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        p: 6,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${alpha('#f8fafc', 0.5)}, white)`,
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${alpha(themeColor, 0.1)}, ${alpha(themeColor, 0.05)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                        }}
                    >
                        {resourceType === 'STAFF' ? (
                            <PersonIcon sx={{ color: themeColor, fontSize: 40 }} />
                        ) : (
                            <RoomIcon sx={{ color: themeColor, fontSize: 40 }} />
                        )}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
                        {resourceType === 'STAFF'
                            ? t('resources.availability.noStaffAvailable')
                            : t('resources.availability.noRoomsAvailable')
                        }
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, maxWidth: 400, mx: 'auto' }}>
                        {t('resources.availability.addResourcesFirst')}
                    </Typography>
                </Card>
            ) : selectedResourceForDetail ? (
                <DetailedAvailabilityView
                    resourceId={selectedResourceForDetail.id}
                    resourceName={selectedResourceForDetail.name}
                    resourceType={selectedResourceForDetail.type}
                    onBack={() => setSelectedResourceForDetail(null)}
                />
            ) : (
                viewMode === 'today' ? renderTodayView() : renderWeekView()
            )}
        </Box>
    );
};

export default ResourceAvailabilityView;