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
} from '@mui/material';
import {
    Person as PersonIcon,
    Room as RoomIcon,
    CheckCircle as AvailableIcon,
    Cancel as UnavailableIcon,
    Today as TodayIcon,
    DateRange as WeekIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getFullImageUrl, ResourceStatus, Resource, ResourceAvailability } from '../../../services/api';

interface ResourceAvailabilityViewProps {
    resourceType: 'STAFF' | 'ROOM';
}

const ResourceAvailabilityView: React.FC<ResourceAvailabilityViewProps> = ({ resourceType }) => {
    const { t } = useTranslation();
    const [resources, setResources] = useState<Resource[]>([]);
    const [availabilities, setAvailabilities] = useState<Record<number, ResourceAvailability[]>>({});
    const [resourceStatuses, setResourceStatuses] = useState<Record<number, ResourceStatus>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'today' | 'week'>('today');

    // 主题色
    const themeColor = '#DC2626';

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
            setResources(resourcesData.filter((r: Resource) => r.status === 'ACTIVE'));

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
            <Grid container spacing={3}>
                {resources.map((resource) => (
                    <Grid item xs={12} md={6} lg={4} key={resource.id}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                height: '100%',
                            }}
                        >
                            <CardContent>
                                {/* 资源头部信息 */}
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    {getResourceIcon(resource)}
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {resource.name}
                                            </Typography>
                                            {/* 实时状态指示器 */}
                                            {resourceStatuses[resource.id] && (
                                                <Chip
                                                    size="small"
                                                    icon={resourceStatuses[resource.id].currentlyAvailable ?
                                                        <AvailableIcon /> : <UnavailableIcon />}
                                                    label={resourceStatuses[resource.id].currentlyAvailable ?
                                                        t('resources.availability.available') :
                                                        t('resources.availability.unavailable')}
                                                    sx={{
                                                        backgroundColor: resourceStatuses[resource.id].currentlyAvailable
                                                            ? alpha('#10B981', 0.1)
                                                            : alpha('#EF4444', 0.1),
                                                        color: resourceStatuses[resource.id].currentlyAvailable
                                                            ? '#10B981' : '#EF4444',
                                                        fontWeight: 500,
                                                        '& .MuiChip-icon': {
                                                            fontSize: 14,
                                                        },
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {resource.type === 'STAFF' ? t('resources.type.staff') : t('resources.type.room')}
                                            {resource.capacity && ` • ${resource.capacity}人`}
                                            {resource.location && ` • ${resource.location}`}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* 今日可用性时间段 */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                        {t('resources.availability.todaySchedule')}
                                    </Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1}>
                                        {timeSlots.map((time) => {
                                            const isAvailable = checkResourceAvailability(resource.id, todayDayOfWeek, time);
                                            return (
                                                <Chip
                                                    key={time}
                                                    label={time}
                                                    size="small"
                                                    icon={isAvailable ? <AvailableIcon /> : <UnavailableIcon />}
                                                    sx={{
                                                        backgroundColor: isAvailable
                                                            ? alpha('#10B981', 0.1)
                                                            : alpha('#EF4444', 0.1),
                                                        color: isAvailable ? '#10B981' : '#EF4444',
                                                        fontWeight: 500,
                                                        '& .MuiChip-icon': {
                                                            fontSize: 16,
                                                        },
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    // 渲染周视图
    const renderWeekView = () => {
        return (
            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 800 }}>
                        {/* 表头 */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '200px repeat(7, 1fr)',
                                backgroundColor: '#f8fafc',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            <Box sx={{ p: 2, fontWeight: 600 }}>
                                {resourceType === 'STAFF' ? t('resources.type.staff') : t('resources.type.room')}
                            </Box>
                            {weekDays.map((day) => (
                                <Box key={day.key} sx={{ p: 2, textAlign: 'center', fontWeight: 600 }}>
                                    {day.label}
                                </Box>
                            ))}
                        </Box>

                        {/* 资源行 */}
                        {resources.map((resource) => (
                            <Box
                                key={resource.id}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '200px repeat(7, 1fr)',
                                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                                    '&:hover': {
                                        backgroundColor: alpha(themeColor, 0.02),
                                    },
                                }}
                            >
                                {/* 资源信息 */}
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {getResourceIcon(resource)}
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {resource.description || '-'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* 每天的可用性 */}
                                {weekDays.map((day) => {
                                    const dayAvailability = availabilities[resource.id]?.filter(
                                        a => a.dayOfWeek === day.key && a.isAvailable
                                    ) || [];

                                    return (
                                        <Box key={day.key} sx={{ p: 1, textAlign: 'center' }}>
                                            {dayAvailability.length > 0 ? (
                                                <Box>
                                                    {dayAvailability.map((availability, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={`${availability.startTime.slice(0, 5)}-${availability.endTime.slice(0, 5)}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: alpha('#10B981', 0.1),
                                                                color: '#10B981',
                                                                fontSize: '0.7rem',
                                                                height: 20,
                                                                mb: 0.5,
                                                                display: 'block',
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Chip
                                                    label={t('resources.availability.unavailable')}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: alpha('#EF4444', 0.1),
                                                        color: '#EF4444',
                                                        fontSize: '0.7rem',
                                                        height: 20,
                                                    }}
                                                />
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {resourceType === 'STAFF' ? (
                            <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                        ) : (
                            <RoomIcon sx={{ color: 'white', fontSize: 20 }} />
                        )}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {resourceType === 'STAFF'
                                ? t('resources.availability.staffAvailability')
                                : t('resources.availability.roomAvailability')
                            }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('resources.availability.subtitle')}
                        </Typography>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    <Tooltip title={t('common.refresh')}>
                        <IconButton onClick={fetchResources} sx={{ color: themeColor }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    <Tabs
                        value={viewMode}
                        onChange={(_, newValue) => setViewMode(newValue)}
                        sx={{
                            minHeight: 'auto',
                            '& .MuiTab-root': {
                                minHeight: 'auto',
                                py: 1,
                                px: 2,
                                fontSize: '0.875rem',
                                '&.Mui-selected': {
                                    color: themeColor,
                                },
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: themeColor,
                            },
                        }}
                    >
                        <Tab
                            value="today"
                            label={t('resources.availability.todayView')}
                            icon={<TodayIcon />}
                            iconPosition="start"
                        />
                        <Tab
                            value="week"
                            label={t('resources.availability.weekView')}
                            icon={<WeekIcon />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>
            </Box>

            {/* 统计信息 */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: themeColor }}>
                                        {resources.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {resourceType === 'STAFF'
                                            ? t('resources.totalStaff')
                                            : t('resources.totalRooms')
                                        }
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {resourceType === 'STAFF' ? (
                                        <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
                                    ) : (
                                        <RoomIcon sx={{ color: 'white', fontSize: 24 }} />
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                                        {resources.filter(r => {
                                            const todayDayOfWeek = getTodayDayOfWeek();
                                            const resourceAvailability = availabilities[r.id] || [];
                                            return resourceAvailability.some(a =>
                                                a.dayOfWeek === todayDayOfWeek && a.isAvailable
                                            );
                                        }).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('resources.availability.availableToday')}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #10B981, #10B98180)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <AvailableIcon sx={{ color: 'white', fontSize: 24 }} />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 内容区域 */}
            {resources.length === 0 ? (
                <Card
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        p: 4,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h6" color="text.secondary" mb={2}>
                        {resourceType === 'STAFF'
                            ? t('resources.availability.noStaffAvailable')
                            : t('resources.availability.noRoomsAvailable')
                        }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('resources.availability.addResourcesFirst')}
                    </Typography>
                </Card>
            ) : (
                viewMode === 'today' ? renderTodayView() : renderWeekView()
            )}
        </Box>
    );
};

export default ResourceAvailabilityView;