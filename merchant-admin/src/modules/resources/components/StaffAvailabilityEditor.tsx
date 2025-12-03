import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    TextField,
    Paper,
    Grid,
    Menu,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    Tooltip,
    alpha,
    Snackbar,
    useMediaQuery,
    useTheme as useMuiTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { resourceApi } from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';

// 检测是否是原生应用
const isNativeApp = Capacitor.isNativePlatform();

interface TimeSegment {
    id?: number;
    startTime: string;
    endTime: string;
    segmentOrder: number;
}

interface DayAvailability {
    dayOfWeek: number;
    dayName: string;
    segments: TimeSegment[];
}

interface WeekAvailability {
    resourceId: number;
    resourceName: string;
    weekDays: DayAvailability[];
}

interface StaffAvailabilityEditorProps {
    open: boolean;
    onClose: () => void;
    staffId: number;
    staffName: string;
    onSave?: () => void;
}

// 预设模板（使用函数以支持i18n）
const getAvailabilityTemplates = (t: any) => ({
    weekday_split: {
        name: t('staff.availabilityEditor.templates.weekdaySplit.name'),
        description: t('staff.availabilityEditor.templates.weekdaySplit.description'),
        icon: '📅',
    },
    weekday_full: {
        name: t('staff.availabilityEditor.templates.weekdayFull.name'),
        description: t('staff.availabilityEditor.templates.weekdayFull.description'),
        icon: '⏰',
    },
    full_week: {
        name: t('staff.availabilityEditor.templates.fullWeek.name'),
        description: t('staff.availabilityEditor.templates.fullWeek.description'),
        icon: '🌟',
    },
    weekend_only: {
        name: t('staff.availabilityEditor.templates.weekendOnly.name'),
        description: t('staff.availabilityEditor.templates.weekendOnly.description'),
        icon: '🎉',
    },
});

const StaffAvailabilityEditor: React.FC<StaffAvailabilityEditorProps> = ({
    open,
    onClose,
    staffId,
    staffName,
    onSave,
}) => {
    const { t } = useTranslation();
    const { themeMode } = useTheme();
    const muiTheme = useMuiTheme();

    // 移动端检测
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    // 根据主题模式动态设置主题色
    const isMonochrome = themeMode === 'monochrome';
    const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#3B82F6';
    const THEME_COLOR_DARK = isMonochrome ? '#333' : '#2563EB';
    const [weekAvailability, setWeekAvailability] = useState<WeekAvailability | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
    const [copyMenuState, setCopyMenuState] = useState<{
        anchor: null | HTMLElement;
        sourceDayOfWeek: number | null;
    }>({ anchor: null, sourceDayOfWeek: null });

    // 获取模板（使用i18n）
    const availabilityTemplates = getAvailabilityTemplates(t);

    // 星期名称映射
    const dayNames = [
        { key: 1, label: t('staff.weekdays.monday'), short: '周一' },
        { key: 2, label: t('staff.weekdays.tuesday'), short: '周二' },
        { key: 3, label: t('staff.weekdays.wednesday'), short: '周三' },
        { key: 4, label: t('staff.weekdays.thursday'), short: '周四' },
        { key: 5, label: t('staff.weekdays.friday'), short: '周五' },
        { key: 6, label: t('staff.weekdays.saturday'), short: '周六' },
        { key: 7, label: t('staff.weekdays.sunday'), short: '周日' },
    ];

    // 加载员工排班数据
    useEffect(() => {
        if (open && staffId) {
            loadWeekAvailability();
        }
    }, [open, staffId]);

    const loadWeekAvailability = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await resourceApi.getWeekAvailability(staffId);
            setWeekAvailability(data);
        } catch (err: any) {
            console.error('Failed to load week availability:', err);
            setError(err.message || t('staff.availabilityEditor.messages.loadError'));
        } finally {
            setLoading(false);
        }
    };

    // 添加时间段
    const handleAddSegment = (dayOfWeek: number) => {
        if (!weekAvailability) return;

        const updatedWeekDays = weekAvailability.weekDays.map((day) => {
            if (day.dayOfWeek === dayOfWeek) {
                const newSegment: TimeSegment = {
                    startTime: '09:00',
                    endTime: '18:00',
                    segmentOrder: day.segments.length,
                };
                return {
                    ...day,
                    segments: [...day.segments, newSegment],
                };
            }
            return day;
        });

        setWeekAvailability({
            ...weekAvailability,
            weekDays: updatedWeekDays,
        });
    };

    // 删除时间段
    const handleDeleteSegment = (dayOfWeek: number, segmentIndex: number) => {
        if (!weekAvailability) return;

        const updatedWeekDays = weekAvailability.weekDays.map((day) => {
            if (day.dayOfWeek === dayOfWeek) {
                const newSegments = day.segments.filter((_, index) => index !== segmentIndex);
                // 重新排序
                return {
                    ...day,
                    segments: newSegments.map((seg, idx) => ({ ...seg, segmentOrder: idx })),
                };
            }
            return day;
        });

        setWeekAvailability({
            ...weekAvailability,
            weekDays: updatedWeekDays,
        });
    };

    // 更新时间段
    const handleUpdateSegment = (
        dayOfWeek: number,
        segmentIndex: number,
        field: 'startTime' | 'endTime',
        value: string
    ) => {
        if (!weekAvailability) return;

        const updatedWeekDays = weekAvailability.weekDays.map((day) => {
            if (day.dayOfWeek === dayOfWeek) {
                const newSegments = day.segments.map((seg, idx) => {
                    if (idx === segmentIndex) {
                        return { ...seg, [field]: value };
                    }
                    return seg;
                });
                return { ...day, segments: newSegments };
            }
            return day;
        });

        setWeekAvailability({
            ...weekAvailability,
            weekDays: updatedWeekDays,
        });
    };

    // 打开复制菜单
    const handleOpenCopyMenu = (event: React.MouseEvent<HTMLElement>, sourceDayOfWeek: number) => {
        setCopyMenuState({
            anchor: event.currentTarget,
            sourceDayOfWeek,
        });
    };

    // 复制到其他天
    const handleCopyToDay = (targetDayOfWeek: number) => {
        if (!weekAvailability || copyMenuState.sourceDayOfWeek === null) return;

        const sourceDay = weekAvailability.weekDays.find(
            (d) => d.dayOfWeek === copyMenuState.sourceDayOfWeek
        );
        if (!sourceDay) return;

        const updatedWeekDays = weekAvailability.weekDays.map((day) => {
            if (day.dayOfWeek === targetDayOfWeek) {
                // 深拷贝源天的时间段
                return {
                    ...day,
                    segments: sourceDay.segments.map((seg) => ({ ...seg })),
                };
            }
            return day;
        });

        setWeekAvailability({
            ...weekAvailability,
            weekDays: updatedWeekDays,
        });

        setCopyMenuState({ anchor: null, sourceDayOfWeek: null });
        setSuccessMessage(t('staff.availabilityEditor.messages.scheduleCopied'));
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    // 生成模板数据
    const generateTemplateData = (templateName: string): WeekAvailability => {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weekDays: DayAvailability[] = [];

        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
            const dayName = dayNames[dayOfWeek - 1];
            let segments: TimeSegment[] = [];

            switch (templateName) {
                case 'weekday_split':
                    // 工作日分段（上午9-12，下午2-8），周末休息
                    if (dayOfWeek <= 5) {
                        segments = [
                            { startTime: '09:00', endTime: '12:00', segmentOrder: 0 },
                            { startTime: '14:00', endTime: '20:00', segmentOrder: 1 }
                        ];
                    }
                    break;
                case 'weekday_full':
                    // 工作日全天（9-20），周末休息
                    if (dayOfWeek <= 5) {
                        segments = [
                            { startTime: '09:00', endTime: '20:00', segmentOrder: 0 }
                        ];
                    }
                    break;
                case 'full_week':
                    // 全周工作（9-18）
                    segments = [
                        { startTime: '09:00', endTime: '18:00', segmentOrder: 0 }
                    ];
                    break;
                case 'weekend_only':
                    // 仅周末（10-18）
                    if (dayOfWeek >= 6) {
                        segments = [
                            { startTime: '10:00', endTime: '18:00', segmentOrder: 0 }
                        ];
                    }
                    break;
            }

            weekDays.push({
                dayOfWeek,
                dayName,
                segments
            });
        }

        return {
            resourceId: staffId,
            resourceName: staffName || '',
            weekDays
        };
    };

    // 应用模板（只修改本地状态，不调用API）
    const handleApplyTemplate = (templateName: string) => {
        try {
            const templateData = generateTemplateData(templateName);
            setWeekAvailability(templateData);
            setTemplateMenuAnchor(null);
            setSuccessMessage(t('staff.availabilityEditor.messages.templateApplied'));
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err: any) {
            setError(err.message || t('staff.availabilityEditor.messages.templateApplyError'));
        }
    };

    // 清空某一天
    const handleClearDay = (dayOfWeek: number) => {
        if (!weekAvailability) return;

        const updatedWeekDays = weekAvailability.weekDays.map((day) => {
            if (day.dayOfWeek === dayOfWeek) {
                return { ...day, segments: [] };
            }
            return day;
        });

        setWeekAvailability({
            ...weekAvailability,
            weekDays: updatedWeekDays,
        });
    };

    // 验证时间段是否重叠
    const validateTimeSegments = (): string | null => {
        if (!weekAvailability) return null;

        for (const day of weekAvailability.weekDays) {
            const segments = day.segments;
            if (segments.length <= 1) continue;

            // 按开始时间排序
            const sortedSegments = [...segments].sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );

            // 检查相邻时间段是否重叠
            for (let i = 0; i < sortedSegments.length - 1; i++) {
                const current = sortedSegments[i];
                const next = sortedSegments[i + 1];

                // 将时间转换为分钟数以便比较
                const currentEnd = timeToMinutes(current.endTime);
                const nextStart = timeToMinutes(next.startTime);

                if (currentEnd > nextStart) {
                    return t('staff.availabilityEditor.messages.overlapError', {
                        day: day.dayName,
                        segment1: `${current.startTime}-${current.endTime}`,
                        segment2: `${next.startTime}-${next.endTime}`,
                    });
                }
            }

            // 验证每个时间段的开始时间必须早于结束时间
            for (const segment of segments) {
                if (timeToMinutes(segment.startTime) >= timeToMinutes(segment.endTime)) {
                    return t('staff.availabilityEditor.messages.invalidTimeError', {
                        day: day.dayName,
                        time: `${segment.startTime}-${segment.endTime}`,
                    });
                }
            }
        }

        return null;
    };

    // 将时间字符串转换为分钟数
    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // 保存
    const handleSave = async () => {
        if (!weekAvailability) return;

        // 验证时间段
        const validationError = validateTimeSegments();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // 确保所有时间段的segmentOrder正确设置（按开始时间排序）
            const normalizedWeekAvailability = {
                ...weekAvailability,
                weekDays: weekAvailability.weekDays.map(day => ({
                    ...day,
                    segments: day.segments
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((seg, idx) => ({
                            ...seg,
                            segmentOrder: idx,
                        })),
                })),
            };

            await resourceApi.updateWeekAvailability(staffId, normalizedWeekAvailability);
            setSuccessMessage(t('staff.availabilityEditor.messages.saveSuccess'));
            setTimeout(() => {
                onClose();
                // 关闭后再调用 onSave 回调，避免重复显示 snackbar
                if (onSave) {
                    setTimeout(() => onSave(), 100);
                }
            }, 1000);
        } catch (err: any) {
            setError(err.message || t('staff.availabilityEditor.messages.saveError'));
        } finally {
            setSaving(false);
        }
    };

    // 渲染时间段
    const renderTimeSegment = (
        segment: TimeSegment,
        dayOfWeek: number,
        segmentIndex: number
    ) => (
        <Box
            key={segmentIndex}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 1 : 1.5,
                py: 1,
                borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <TextField
                type="time"
                size="small"
                value={segment.startTime}
                onChange={(e) =>
                    handleUpdateSegment(dayOfWeek, segmentIndex, 'startTime', e.target.value)
                }
                sx={{
                    width: isMobile ? 95 : 110,
                    flex: isMobile ? 1 : 'none',
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: '#fafafa',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0,0,0,0.08)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0,0,0,0.15)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: THEME_COLOR,
                            borderWidth: 1,
                        },
                    },
                }}
                InputProps={{
                    sx: { fontSize: isMobile ? '0.75rem' : '0.8rem' },
                }}
            />
            <Typography variant="caption" sx={{ color: '#999', flexShrink: 0 }}>
                —
            </Typography>
            <TextField
                type="time"
                size="small"
                value={segment.endTime}
                onChange={(e) =>
                    handleUpdateSegment(dayOfWeek, segmentIndex, 'endTime', e.target.value)
                }
                sx={{
                    width: isMobile ? 95 : 110,
                    flex: isMobile ? 1 : 'none',
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        bgcolor: '#fafafa',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0,0,0,0.08)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0,0,0,0.15)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: THEME_COLOR,
                            borderWidth: 1,
                        },
                    },
                }}
                InputProps={{
                    sx: { fontSize: isMobile ? '0.75rem' : '0.8rem' },
                }}
            />
            <IconButton
                size="small"
                onClick={() => handleDeleteSegment(dayOfWeek, segmentIndex)}
                sx={{
                    color: '#999',
                    flexShrink: 0,
                    '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' },
                }}
            >
                <DeleteIcon sx={{ fontSize: isMobile ? 16 : 18 }} />
            </IconButton>
        </Box>
    );

    // 渲染每一天
    const renderDay = (day: DayAvailability) => {
        const dayInfo = dayNames.find((d) => d.key === day.dayOfWeek);

        return (
            <Box
                key={day.dayOfWeek}
                sx={{
                    py: isMobile ? 1.5 : 2,
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                {/* 标题栏 */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: THEME_COLOR, minWidth: isMobile ? 50 : 60, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                            {dayInfo?.label}
                        </Typography>
                        {day.segments.length > 0 && (
                            <Typography variant="caption" sx={{ color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                                {day.segments.length} {t('staff.availabilityEditor.labels.segments')}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={t('staff.availabilityEditor.tooltips.copyToOtherDays')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleOpenCopyMenu(e, day.dayOfWeek)}
                                    disabled={day.segments.length === 0}
                                    sx={{ color: '#666', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                                >
                                    <CopyIcon sx={{ fontSize: isMobile ? 16 : 18 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={t('staff.availabilityEditor.tooltips.clear')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => handleClearDay(day.dayOfWeek)}
                                    disabled={day.segments.length === 0}
                                    sx={{ color: '#999', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                                >
                                    <DeleteIcon sx={{ fontSize: isMobile ? 16 : 18 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>

                {/* 时间段列表 */}
                {day.segments.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#999', ml: 0.5, fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                        {t('staff.availabilityEditor.labels.restDay')}
                    </Typography>
                ) : (
                    <Box sx={{ ml: 0.5 }}>
                        {day.segments.map((segment, index) =>
                            renderTimeSegment(segment, day.dayOfWeek, index)
                        )}
                    </Box>
                )}

                {/* 添加时间段按钮 */}
                <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: isMobile ? 14 : 16 }} />}
                    onClick={() => handleAddSegment(day.dayOfWeek)}
                    sx={{
                        mt: 1,
                        ml: 0.5,
                        color: '#666',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                    }}
                >
                    {t('staff.availabilityEditor.actions.addSegment')}
                </Button>
            </Box>
        );
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth={isMobile ? 'sm' : 'md'}
                fullWidth
                sx={isNativeApp ? {
                    '& .MuiDialog-container': {
                        alignItems: 'flex-start',
                        pt: '60px',
                    }
                } : undefined}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 2 : 2.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        bgcolor: '#fff',
                        maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
                        m: isMobile ? 2 : 3,
                    },
                }}
            >
                {/* 标题 */}
                <Box sx={{ px: isMobile ? 2 : 3, py: isMobile ? 1.5 : 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <ScheduleIcon sx={{ color: THEME_COLOR, fontSize: isMobile ? 18 : 20 }} />
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: isMobile ? '0.9rem' : '1rem', color: '#1a1a1a' }}>
                                    {t('staff.availabilityEditor.title')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                                    {staffName}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                color: '#999',
                                '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.04)',
                                    color: '#666',
                                },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </Box>

                {/* 内容 */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    <Box sx={{ px: isMobile ? 2 : 3, py: isMobile ? 1.5 : 2 }}>
                        {/* 快捷操作栏 */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 1 : 0,
                                mb: 2,
                                pb: 2,
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                fullWidth={isMobile}
                                onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
                                startIcon={<ScheduleIcon sx={{ fontSize: isMobile ? 14 : 16 }} />}
                                sx={{
                                    borderRadius: 1.5,
                                    borderColor: 'rgba(0,0,0,0.15)',
                                    color: '#666',
                                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                                    '&:hover': {
                                        borderColor: THEME_COLOR,
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                    },
                                }}
                            >
                                {t('staff.availabilityEditor.actions.applyTemplate')}
                            </Button>
                            <Typography variant="caption" sx={{ color: '#999', fontSize: isMobile ? '0.65rem' : '0.75rem', textAlign: isMobile ? 'center' : 'right' }}>
                                {t('staff.availabilityEditor.labels.timeSlotHint')}
                            </Typography>
                        </Box>

                    {/* 加载状态 */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                        {/* 排班表格 */}
                        {!loading && weekAvailability && (
                            <Grid container spacing={2}>
                                {weekAvailability.weekDays.map((day) => (
                                    <Grid item xs={12} key={day.dayOfWeek}>
                                        {renderDay(day)}
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                </DialogContent>

                {/* 操作按钮 */}
                <DialogActions
                    sx={{
                        px: isMobile ? 2 : 3,
                        py: isMobile ? 1.5 : 2,
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                        gap: isMobile ? 1 : 0,
                    }}
                >
                    <Button
                        onClick={onClose}
                        disabled={saving}
                        size="small"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: 1.5,
                            px: 2,
                            color: '#666',
                            textTransform: 'none',
                            fontSize: isMobile ? '0.75rem' : '0.8125rem',
                        }}
                    >
                        {t('staff.availabilityEditor.actions.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !weekAvailability}
                        size="small"
                        fullWidth={isMobile}
                        sx={{
                            borderRadius: 1.5,
                            px: 2.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: isMobile ? '0.75rem' : '0.8125rem',
                            bgcolor: THEME_COLOR,
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: THEME_COLOR_DARK,
                                boxShadow: 'none',
                            },
                        }}
                    >
                        {saving ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            t('staff.availabilityEditor.actions.save')
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 错误提示 Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={isMobile ? { top: 70 } : undefined}
            >
                <Alert
                    onClose={() => setError(null)}
                    severity="error"
                    sx={{
                        width: '100%',
                        borderRadius: isMobile ? 1.5 : 2,
                        fontSize: isMobile ? '0.8rem' : undefined,
                        py: isMobile ? 0.5 : undefined,
                        '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* 成功提示 Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={isMobile ? { top: 70 } : undefined}
            >
                <Alert
                    onClose={() => setSuccessMessage(null)}
                    severity="success"
                    sx={{
                        width: '100%',
                        borderRadius: isMobile ? 1.5 : 2,
                        fontSize: isMobile ? '0.8rem' : undefined,
                        py: isMobile ? 0.5 : undefined,
                        '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
                    }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* 模板选择菜单 */}
            <Menu
                anchorEl={templateMenuAnchor}
                open={Boolean(templateMenuAnchor)}
                onClose={() => setTemplateMenuAnchor(null)}
                PaperProps={{
                    sx: {
                        minWidth: 240,
                        borderRadius: 1.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.06)',
                    },
                }}
            >
                {Object.entries(availabilityTemplates).map(([key, template]) => (
                    <MenuItem
                        key={key}
                        onClick={() => handleApplyTemplate(key)}
                        sx={{
                            py: 1.5,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                        }}
                    >
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: THEME_COLOR, mb: 0.25 }}>
                                {template.icon} {template.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                                {template.description}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>

            {/* 复制到菜单 */}
            <Menu
                anchorEl={copyMenuState.anchor}
                open={Boolean(copyMenuState.anchor)}
                onClose={() => setCopyMenuState({ anchor: null, sourceDayOfWeek: null })}
                PaperProps={{
                    sx: {
                        minWidth: 120,
                        borderRadius: 1.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.06)',
                    },
                }}
            >
                <Typography variant="caption" sx={{ px: 2, py: 1, color: '#999', display: 'block' }}>
                    {t('staff.availabilityEditor.actions.copyTo')}
                </Typography>
                {dayNames
                    .filter((d) => d.key !== copyMenuState.sourceDayOfWeek)
                    .map((day) => (
                        <MenuItem
                            key={day.key}
                            onClick={() => handleCopyToDay(day.key)}
                            sx={{
                                fontSize: '0.875rem',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                            }}
                        >
                            {day.label}
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
};

export default StaffAvailabilityEditor;
