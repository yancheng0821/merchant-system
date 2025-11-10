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
import { resourceApi } from '../../../services/api';

// 主题色
const THEME_COLOR = '#3B82F6';
const THEME_COLOR_DARK = '#2563EB';
const THEME_COLOR_DARKER = '#1D4ED8';

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
                gap: 1,
                mb: 1,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: alpha(THEME_COLOR, 0.05),
                border: `1px solid ${alpha(THEME_COLOR, 0.2)}`,
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
                    width: 120,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: THEME_COLOR,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: THEME_COLOR,
                        },
                    },
                }}
                InputProps={{
                    sx: { fontSize: '0.875rem' },
                }}
            />
            <Typography variant="body2" color="text.secondary">
                -
            </Typography>
            <TextField
                type="time"
                size="small"
                value={segment.endTime}
                onChange={(e) =>
                    handleUpdateSegment(dayOfWeek, segmentIndex, 'endTime', e.target.value)
                }
                sx={{
                    width: 120,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: THEME_COLOR,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: THEME_COLOR,
                        },
                    },
                }}
                InputProps={{
                    sx: { fontSize: '0.875rem' },
                }}
            />
            <IconButton
                size="small"
                onClick={() => handleDeleteSegment(dayOfWeek, segmentIndex)}
                sx={{
                    color: 'error.main',
                    '&:hover': { backgroundColor: alpha('#f44336', 0.1) },
                }}
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Box>
    );

    // 渲染每一天
    const renderDay = (day: DayAvailability) => {
        const dayInfo = dayNames.find((d) => d.key === day.dayOfWeek);

        return (
            <Paper
                key={day.dayOfWeek}
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                }}
            >
                {/* 标题栏 */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {dayInfo?.label}
                        </Typography>
                        {day.segments.length > 0 && (
                            <Chip
                                label={`${day.segments.length} ${t('staff.availabilityEditor.labels.segments')}`}
                                size="small"
                                sx={{
                                    backgroundColor: alpha(THEME_COLOR, 0.1),
                                    color: THEME_COLOR,
                                    fontWeight: 500,
                                }}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={t('staff.availabilityEditor.tooltips.copyToOtherDays')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleOpenCopyMenu(e, day.dayOfWeek)}
                                    disabled={day.segments.length === 0}
                                    sx={{ color: THEME_COLOR }}
                                >
                                    <CopyIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={t('staff.availabilityEditor.tooltips.clear')}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => handleClearDay(day.dayOfWeek)}
                                    disabled={day.segments.length === 0}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>

                {/* 时间段列表 */}
                {day.segments.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 2,
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                        }}
                    >
                        {t('staff.availabilityEditor.labels.restDay')}
                    </Box>
                ) : (
                    day.segments.map((segment, index) =>
                        renderTimeSegment(segment, day.dayOfWeek, index)
                    )
                )}

                {/* 添加时间段按钮 */}
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddSegment(day.dayOfWeek)}
                    sx={{
                        mt: day.segments.length > 0 ? 1 : 0,
                        color: THEME_COLOR,
                        '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.05) },
                    }}
                >
                    {t('staff.availabilityEditor.actions.addSegment')}
                </Button>
            </Paper>
        );
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        bgcolor: 'background.paper',
                    },
                }}
            >
                {/* 标题 */}
                <DialogTitle
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(THEME_COLOR, 0.05)}, ${alpha(THEME_COLOR, 0.08)})`,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 3,
                        pt: 3,
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <ScheduleIcon sx={{ fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        mb: 0.5,
                                    }}
                                >
                                    {t('staff.availabilityEditor.title')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {staffName}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            sx={{
                                '&:hover': {
                                    backgroundColor: alpha(THEME_COLOR, 0.1),
                                },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                {/* 内容 */}
                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3 }}>
                        {/* 快捷操作栏 */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                mb: 3,
                                p: 2,
                                backgroundColor: alpha(THEME_COLOR, 0.05),
                                borderRadius: 2,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
                                startIcon={<ScheduleIcon />}
                                sx={{
                                    borderRadius: 2,
                                    borderColor: THEME_COLOR,
                                    color: THEME_COLOR,
                                    '&:hover': {
                                        borderColor: THEME_COLOR,
                                        backgroundColor: alpha(THEME_COLOR, 0.1),
                                    },
                                }}
                            >
                                {t('staff.availabilityEditor.actions.applyTemplate')}
                            </Button>
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                                <InfoIcon
                                    fontSize="small"
                                    sx={{ color: 'text.secondary', mr: 0.5 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {t('staff.availabilityEditor.labels.timeSlotHint')}
                                </Typography>
                            </Box>
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
                        p: 3,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        background: alpha(THEME_COLOR, 0.02),
                    }}
                >
                    <Button
                        onClick={onClose}
                        disabled={saving}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            color: 'text.secondary',
                        }}
                    >
                        {t('staff.availabilityEditor.actions.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !weekAvailability}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                            boxShadow: `0 4px 15px ${alpha(THEME_COLOR, 0.3)}`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${THEME_COLOR_DARK}, ${THEME_COLOR_DARKER})`,
                                boxShadow: `0 6px 20px ${alpha(THEME_COLOR, 0.4)}`,
                            },
                        }}
                    >
                        {saving ? (
                            <CircularProgress size={20} color="inherit" />
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
            >
                <Alert
                    onClose={() => setError(null)}
                    severity="error"
                    sx={{ width: '100%' }}
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
            >
                <Alert
                    onClose={() => setSuccessMessage(null)}
                    severity="success"
                    sx={{ width: '100%' }}
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
                    sx: { minWidth: 280, borderRadius: 2 },
                }}
            >
                {Object.entries(availabilityTemplates).map(([key, template]) => (
                    <MenuItem
                        key={key}
                        onClick={() => handleApplyTemplate(key)}
                        sx={{ py: 1.5 }}
                    >
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2">{template.icon}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {template.name}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
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
                    sx: { minWidth: 150, borderRadius: 2 },
                }}
            >
                <MenuItem disabled sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {t('staff.availabilityEditor.actions.copyTo')}
                </MenuItem>
                {dayNames
                    .filter((d) => d.key !== copyMenuState.sourceDayOfWeek)
                    .map((day) => (
                        <MenuItem key={day.key} onClick={() => handleCopyToDay(day.key)}>
                            {day.label}
                        </MenuItem>
                    ))}
            </Menu>
        </>
    );
};

export default StaffAvailabilityEditor;
