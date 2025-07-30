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
import { getFullImageUrl, ResourceStatus, Resource, ResourceAvailability } from '../../../services/api';
import DetailedAvailabilityView from '../../../components/common/DetailedAvailabilityView';

interface ResourceAvailabilityViewProps {
    resourceType: 'STAFF' | 'ROOM';
}

const ResourceAvailabilityView: React.FC<ResourceAvailabilityViewProps> = ({ resourceType }) => {
    const { t } = useTranslation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [availabilities, setAvailabilities] = useState<Record<number, ResourceAvailability[]>>({});
    const [resourceStatuses, setResourceStatuses] = useState<Record<number, ResourceStatus>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
    const [selectedResourceForDetail, setSelectedResourceForDetail] = useState<Resource | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 主题色
    const themeColor = '#3B82F6';

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

    // 获取资源数据
    const fetchResources = async () => {
        try {
            setLoading(true);
            const { resourceApi } = await import('../../../services/api');
            const resourcesData = await resourceApi.getResourcesByType(tenantId, resourceType);
            const activeResources = resourcesData.filter((r: Resource) => r.status === 'ACTIVE');
            setResources(activeResources);

            // 获取每个资源的可用性和实时状态
            const dataPromises = resourcesData.map(async (resource: Resource) => {
                try {
                    const [availability, status] = await Promise.all([
                        resourceApi.getResourceAvailability(resource.id),
                        resourceApi.getResourceStatus(resource.id)
                    ]);
                    return { resourceId: resource.id, availability, status };
                } catch (err) {
                    console.warn(`Failed to fetch data for resource ${resource.id}:`, err);
                    return { resourceId: resource.id, availability: [], status: null };
                }
            });

            const dataResults = await Promise.all(dataPromises);
            const availabilityMap: Record<number, ResourceAvailability[]> = {};
            const statusMap: Record<number, ResourceStatus> = {};

            dataResults.forEach(({ resourceId, availability, status }) => {
                availabilityMap[resourceId] = availability;
                if (status) {
                    statusMap[resourceId] = status;
                }
            });

            setAvailabilities(availabilityMap);
            setResourceStatuses(statusMap);
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

    // 检查资源在特定时间的可用性
    const checkResourceAvailability = (resourceId: number, dayOfWeek: number, time: string): boolean => {
        const resourceAvailability = availabilities[resourceId] || [];
        const timeHour = parseInt(time.split(':')[0]);
        const timeMinute = parseInt(time.split(':')[1]);
        const timeInMinutes = timeHour * 60 + timeMinute;

        return resourceAvailability.some(availability => {
            if (availability.dayOfWeek !== dayOfWeek || !availability.isAvailable) {
                return false;
            }

            const startHour = parseInt(availability.startTime.split(':')[0]);
            const startMinute = parseInt(availability.startTime.split(':')[1]);
            const startInMinutes = startHour * 60 + startMinute;

            const endHour = parseInt(availability.endTime.split(':')[0]);
            const endMinute = parseInt(availability.endTime.split(':')[1]);
            const endInMinutes = endHour * 60 + endMinute;

            return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
        });
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
                        checkResourceAvailability(resource.id, todayDayOfWeek, time)
                    );
                    const unavailableSlots = timeSlots.filter(time => 
                        !checkResourceAvailability(resource.id, todayDayOfWeek, time)
                    );
                    const availabilityPercentage = Math.round((availableSlots.length / timeSlots.length) * 100);
                    
                    return (
                        <Grid item xs={12} md={6} lg={4} key={resource.id}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    border: '1px solid rgba(0,0,0,0.04)',
                                    height: '100%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                    },
                                }}
                            >
                                {/* 顶部装饰条 */}
                                <Box
                                    sx={{
                                        height: 4,
                                        background: `linear-gradient(90deg, ${themeColor}, ${alpha(themeColor, 0.7)})`,
                                    }}
                                />
                                
                                <CardContent sx={{ p: 3 }}>
                                    {/* 资源头部信息 */}
                                    <Box display="flex" alignItems="center" gap={2} mb={3}>
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
                                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                                                    {resource.name}
                                                </Typography>
                                                {/* 实时状态指示器 */}
                                                {resourceStatuses[resource.id] && (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            px: 1.5,
                                                            py: 0.5,
                                                            borderRadius: 2,
                                                            backgroundColor: resourceStatuses[resource.id].currentlyAvailable
                                                                ? alpha('#10B981', 0.1)
                                                                : alpha('#EF4444', 0.1),
                                                            border: `1px solid ${resourceStatuses[resource.id].currentlyAvailable
                                                                ? alpha('#10B981', 0.2)
                                                                : alpha('#EF4444', 0.2)}`,
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 6,
                                                                height: 6,
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
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: resourceStatuses[resource.id].currentlyAvailable
                                                                    ? '#10B981' : '#EF4444',
                                                            }}
                                                        >
                                                            {resourceStatuses[resource.id].currentlyAvailable ?
                                                                t('resources.availability.available') :
                                                                t('resources.availability.unavailable')}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {resource.type === 'STAFF' ? t('resources.type.staff') : t('resources.type.room')}
                                                {resource.capacity && ` • ${resource.capacity}人`}
                                                {resource.location && ` • ${resource.location}`}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* 可用性统计 */}
                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                                                {t('resources.availability.todaySchedule')}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    background: `linear-gradient(135deg, ${alpha('#10B981', 0.1)}, ${alpha('#10B981', 0.05)})`,
                                                    border: `1px solid ${alpha('#10B981', 0.2)}`,
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: '#10B981',
                                                    }}
                                                >
                                                    {availabilityPercentage}% 可用
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        {/* 进度条 */}
                                        <Box
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                backgroundColor: alpha('#EF4444', 0.1),
                                                overflow: 'hidden',
                                                mb: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    width: `${availabilityPercentage}%`,
                                                    background: 'linear-gradient(90deg, #10B981, #059669)',
                                                    borderRadius: 3,
                                                    transition: 'width 0.5s ease',
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* 时间段网格 */}
                                    <Box mb={3}>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: 1,
                                                mb: 2,
                                            }}
                                        >
                                            {timeSlots.slice(0, 8).map((time) => {
                                                const isAvailable = checkResourceAvailability(resource.id, todayDayOfWeek, time);
                                                return (
                                                    <Box
                                                        key={time}
                                                        sx={{
                                                            p: 1,
                                                            borderRadius: 2,
                                                            textAlign: 'center',
                                                            backgroundColor: isAvailable
                                                                ? alpha('#10B981', 0.1)
                                                                : alpha('#EF4444', 0.1),
                                                            border: `1px solid ${isAvailable
                                                                ? alpha('#10B981', 0.2)
                                                                : alpha('#EF4444', 0.2)}`,
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                transform: 'scale(1.05)',
                                                                boxShadow: `0 2px 8px ${isAvailable
                                                                    ? alpha('#10B981', 0.3)
                                                                    : alpha('#EF4444', 0.3)}`,
                                                            },
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: isAvailable ? '#10B981' : '#EF4444',
                                                            }}
                                                        >
                                                            {time}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                        
                                        {timeSlots.length > 8 && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ textAlign: 'center', display: 'block' }}
                                            >
                                                +{timeSlots.length - 8} {t('resources.moreTimeSlots')}
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    {/* 查看详细按钮 */}
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={() => {
                                            setSelectedResourceForDetail(resource);
                                        }}
                                        sx={{
                                            borderRadius: 3,
                                            py: 1.5,
                                            background: `linear-gradient(135deg, ${themeColor}, ${alpha(themeColor, 0.8)})`,
                                            boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                                            fontWeight: 600,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, ${alpha(themeColor, 0.9)}, ${themeColor})`,
                                                transform: 'translateY(-1px)',
                                                boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
                                            },
                                            transition: 'all 0.3s ease',
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
                                                <Box>
                                                    {dayAvailability.map((availability, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                mb: 0.5,
                                                                p: 1,
                                                                borderRadius: 2,
                                                                background: `linear-gradient(135deg, ${alpha('#10B981', 0.1)}, ${alpha('#10B981', 0.05)})`,
                                                                border: `1px solid ${alpha('#10B981', 0.2)}`,
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    transform: 'scale(1.05)',
                                                                    boxShadow: `0 2px 8px ${alpha('#10B981', 0.3)}`,
                                                                },
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: '#10B981',
                                                                    fontSize: '0.75rem',
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
                                                        p: 1,
                                                        borderRadius: 2,
                                                        background: `linear-gradient(135deg, ${alpha('#EF4444', 0.1)}, ${alpha('#EF4444', 0.05)})`,
                                                        border: `1px solid ${alpha('#EF4444', 0.2)}`,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#EF4444',
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        不可用
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
            <Card
                sx={{
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    mb: 4,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.02)})`,
                        p: 3,
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={3}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${themeColor}, ${alpha(themeColor, 0.8)})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                                }}
                            >
                                {resourceType === 'STAFF' ? (
                                    <PersonIcon sx={{ color: 'white', fontSize: 28 }} />
                                ) : (
                                    <RoomIcon sx={{ color: 'white', fontSize: 28 }} />
                                )}
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                                    {resourceType === 'STAFF'
                                        ? t('resources.availability.staffAvailability')
                                        : t('resources.availability.roomAvailability')
                                    }
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {t('resources.availability.subtitle')}
                                </Typography>
                            </Box>
                        </Box>

                        {!selectedResourceForDetail && (
                            <Box display="flex" alignItems="center" gap={3}>
                                <Tooltip title={t('common.refresh')}>
                                    <IconButton 
                                        onClick={fetchResources} 
                                        sx={{ 
                                            color: themeColor,
                                            backgroundColor: alpha(themeColor, 0.1),
                                            '&:hover': {
                                                backgroundColor: alpha(themeColor, 0.2),
                                                transform: 'scale(1.1)',
                                            },
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>

                                <Box
                                    sx={{
                                        backgroundColor: 'white',
                                        borderRadius: 3,
                                        p: 0.5,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <Tabs
                                        value={viewMode}
                                        onChange={(_, newValue) => setViewMode(newValue)}
                                        sx={{
                                            minHeight: 'auto',
                                            '& .MuiTab-root': {
                                                minHeight: 'auto',
                                                py: 1.5,
                                                px: 3,
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                borderRadius: 2,
                                                transition: 'all 0.2s ease',
                                                '&.Mui-selected': {
                                                    color: 'white',
                                                    backgroundColor: themeColor,
                                                    boxShadow: `0 2px 8px ${alpha(themeColor, 0.3)}`,
                                                },
                                                '&:not(.Mui-selected)': {
                                                    color: '#6b7280',
                                                    '&:hover': {
                                                        backgroundColor: alpha(themeColor, 0.05),
                                                        color: themeColor,
                                                    },
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
                                            icon={<TodayIcon sx={{ fontSize: 18 }} />}
                                            iconPosition="start"
                                        />
                                        <Tab
                                            value="week"
                                            label={t('resources.availability.weekView')}
                                            icon={<WeekIcon sx={{ fontSize: 18 }} />}
                                            iconPosition="start"
                                        />
                                    </Tabs>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Card>

            {/* 搜索框 - 仅员工类型显示且不在详细视图中 */}
            {resourceType === 'STAFF' && !selectedResourceForDetail && (
                <Card
                    sx={{
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        mb: 4,
                        p: 3,
                    }}
                >
                    <Box display="flex" alignItems="center" gap={3}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(themeColor, 0.1)}, ${alpha(themeColor, 0.05)})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <SearchIcon sx={{ color: themeColor, fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                            <TextField
                                fullWidth
                                placeholder={t('resources.availability.searchStaffPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        backgroundColor: alpha('#f8fafc', 0.5),
                                        border: '2px solid transparent',
                                        fontSize: '1rem',
                                        '&:hover': {
                                            backgroundColor: '#f1f5f9',
                                            borderColor: alpha(themeColor, 0.3),
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: 'white',
                                            borderColor: themeColor,
                                            boxShadow: `0 0 0 4px ${alpha(themeColor, 0.1)}`,
                                        },
                                    },
                                }}
                            />
                            {!searchTerm && (
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                        mt: 1, 
                                        display: 'block',
                                        fontWeight: 500,
                                    }}
                                >
                                    💡 {t('resources.availability.showingFirst9Staff')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Card>
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