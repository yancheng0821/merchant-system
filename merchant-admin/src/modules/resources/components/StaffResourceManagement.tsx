import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Avatar,
    Chip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    alpha,
    InputAdornment,
    Alert,
    CircularProgress,
    Snackbar,
    Popover,
    Tooltip,
    Collapse,
    useMediaQuery,
    useTheme as useMuiTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Work as WorkIcon,
    Build as SkillIcon,
    MoreHoriz as MoreHorizIcon,
    Schedule as ScheduleIcon,
    FilterList as FilterListIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StaffDialog from './StaffDialog';
import StaffAvailabilityEditor from './StaffAvailabilityEditor';
import UpgradePrompt from '../../../components/common/UpgradePrompt';
import { StaffResource, convertToStaffResource, convertStaffToResource } from '../types';
import { getFullImageUrl, resourceApi, staffAttendanceApi } from '../../../services/api';
import { usePermission } from '../../../hooks/usePermission';
import { useTheme } from '../../../contexts/ThemeContext';
import { useFeature } from '../../../contexts/FeatureContext';
import { format, parseISO } from 'date-fns';
import { getMerchantNow } from '../../../utils/timezoneUtils';

const StaffResourceManagement: React.FC = () => {
    const { t } = useTranslation();
    const { hasPermission } = usePermission();
    const { themeMode } = useTheme();
    const { getLimit, isUnlimited } = useFeature();
    const muiTheme = useMuiTheme();

    // 移动端检测
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    const [staff, setStaff] = useState<StaffResource[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<StaffResource[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedStaff, setSelectedStaff] = useState<StaffResource | null>(null);

    // 对话框状态
    const [staffDialogOpen, setStaffDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [availabilityEditorOpen, setAvailabilityEditorOpen] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [expertisePopoverAnchor, setExpertisePopoverAnchor] = useState<null | HTMLElement>(null);
    const [selectedStaffIdForExpertise, setSelectedStaffIdForExpertise] = useState<number | null>(null);
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedStaffForStatus, setSelectedStaffForStatus] = useState<StaffResource | null>(null);

    // 移动端筛选面板展开状态
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    // 加载状态
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 服务专长数据
    const [staffExpertise, setStaffExpertise] = useState<Record<number, Array<{
        serviceId: number;
        serviceName: string;
        skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT' | 'MASTER';
    }>>>({});
    const [services, setServices] = useState<any[]>([]);

    // 员工考勤数据（check-in/out时间）
    const [staffAttendance, setStaffAttendance] = useState<Map<number, any>>(new Map());

    // 根据主题模式动态设置主题色
    const isMonochrome = themeMode === 'monochrome';
    const themeColor = isMonochrome ? '#1a1a1a' : '#3B82F6';
    const themeColorDark = isMonochrome ? '#333' : '#1D4ED8';

    // 获取租户ID
    const tenantId = useMemo(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return Number(user.tenantId || 1);
    }, []);

    // 格式化日期（纯日期字段，不涉及时区转换）
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return '-';
        try {
            // parseISO 会将 "2025-11-09" 解析为本地时区的日期，不做时区转换
            const date = parseISO(dateString);
            return format(date, 'MMM d, yyyy'); // 例如: Nov 9, 2025
        } catch (e) {
            return dateString;
        }
    };

    // 获取员工数据
    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                setLoading(true);
                const { resourceApi, serviceApi } = await import('../../../services/api');

                // 并行加载员工和服务数据
                const [response, servicesData] = await Promise.all([
                    resourceApi.getResourcesByType(tenantId, 'STAFF'),
                    serviceApi.getServices(tenantId.toString())
                ]);

                const staffData = (response || []).map(convertToStaffResource);
                // 按创建时间倒序排序，新创建的在最上面
                staffData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setStaff(staffData);
                setServices(servicesData || []);

                // 加载今日考勤数据
                const now = getMerchantNow();
                const today = format(now, 'yyyy-MM-dd');
                const attendanceMap = new Map<number, any>();

                // 并行加载所有员工的今日考勤数据
                const attendancePromises = staffData.map((staffMember) =>
                    staffAttendanceApi.getByResourceAndDate(staffMember.id, today)
                        .then((attendance) => ({ resourceId: staffMember.id, attendance: attendance || null }))
                        .catch(() => ({ resourceId: staffMember.id, attendance: null }))
                );

                const attendanceResults = await Promise.all(attendancePromises);
                attendanceResults.forEach(({ resourceId, attendance }) => {
                    if (attendance) {
                        attendanceMap.set(resourceId, attendance);
                    }
                });

                setStaffAttendance(attendanceMap);
            } catch (err) {
                console.error('Failed to fetch staff data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch staff data');
                setStaff([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStaffData();
    }, [tenantId]);

    // 加载所有员工的服务专长
    useEffect(() => {
        const loadStaffExpertise = async () => {
            if (staff.length === 0 || services.length === 0) {
                return;
            }

            try {
                const { resourceApi } = await import('../../../services/api');
                const expertiseMap: Record<number, Array<{
                    serviceId: number;
                    serviceName: string;
                    skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT' | 'MASTER';
                }>> = {};

                await Promise.all(
                    staff.map(async (staffMember) => {
                        try {
                            const expertise = await resourceApi.getResourceServices(staffMember.id);
                            expertiseMap[staffMember.id] = expertise.map((e: any) => {
                                const service = services.find(s => s.id === e.serviceId);
                                return {
                                    serviceId: e.serviceId,
                                    serviceName: service?.name || 'Unknown Service',
                                    skillLevel: e.skillLevel || 'INTERMEDIATE',
                                };
                            });
                        } catch (error) {
                            console.error(`Failed to load expertise for staff ${staffMember.id}:`, error);
                            expertiseMap[staffMember.id] = [];
                        }
                    })
                );

                setStaffExpertise(expertiseMap);
            } catch (error) {
                console.error('Failed to load staff expertise:', error);
            }
        };

        loadStaffExpertise();
    }, [staff, services]);

    // 筛选员工
    useEffect(() => {
        let filtered = staff;

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.position || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.status === statusFilter);
        }

        setFilteredStaff(filtered);
        setPage(0);
    }, [staff, searchTerm, statusFilter]);

    // 检查员工当前是否在工作（基于check-in/out时间）
    const isStaffCurrentlyWorking = (staffMember: StaffResource): boolean => {
        // 只检查ACTIVE状态的员工
        if (staffMember.status !== 'ACTIVE') {
            return false;
        }

        const attendance = staffAttendance.get(staffMember.id);
        if (!attendance) {
            return false;
        }

        // 如果有check-in和check-out时间，检查当前时间是否在范围内
        if (attendance.checkInTime && attendance.checkOutTime) {
            const now = getMerchantNow();
            const currentTime = format(now, 'HH:mm');
            const checkInTime = attendance.checkInTime.slice(0, 5);
            const checkOutTime = attendance.checkOutTime.slice(0, 5);

            return currentTime >= checkInTime && currentTime < checkOutTime;
        }

        return false;
    };

    // 获取状态Chip（可点击）
    const getStatusChip = (staffMember: StaffResource) => {
        const statusConfig = {
            ACTIVE: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('staff.statusOptions.active') },
            INACTIVE: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('staff.statusOptions.inactive') },
            VACATION: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('staff.statusOptions.vacation') },
        };

        const config = statusConfig[staffMember.status as keyof typeof statusConfig] || statusConfig.ACTIVE;

        return (
            <Chip
                label={config.label}
                onClick={hasPermission('staff:update') ? (e) => {
                    e.stopPropagation();
                    setStatusMenuAnchor(e.currentTarget);
                    setSelectedStaffForStatus(staffMember);
                } : undefined}
                sx={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                    cursor: hasPermission('staff:update') ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '& .MuiChip-label': {
                        px: 2,
                    },
                    ...(hasPermission('staff:update') && {
                        '&:hover': {
                            backgroundColor: config.color,
                            color: 'white',
                            transform: 'translateY(-1px)',
                            boxShadow: `0 2px 8px ${alpha(config.color, 0.3)}`,
                        },
                    }),
                }}
            />
        );
    };

    // 头像背景色 - 直接使用主题色（参考客户管理）
    const getAvatarColor = (_name: string) => {
        return themeColor;
    };

    // 根据技能等级获取颜色
    const getSkillLevelColor = (level: string) => {
        if (isMonochrome) {
            // 极简模式：使用不同深浅的灰色表示等级
            switch (level) {
                case 'BEGINNER':
                    return '#9a9a9a'; // 最浅灰
                case 'INTERMEDIATE':
                    return '#6a6a6a'; // 中灰
                case 'EXPERT':
                    return '#4a4a4a'; // 深灰
                case 'MASTER':
                    return '#1a1a1a'; // 最深黑
                default:
                    return '#9a9a9a';
            }
        }
        // 彩色模式
        switch (level) {
            case 'BEGINNER':
                return '#94a3b8'; // 灰色
            case 'INTERMEDIATE':
                return '#3b82f6'; // 蓝色
            case 'EXPERT':
                return '#f59e0b'; // 橙色
            case 'MASTER':
                return '#ef4444'; // 红色
            default:
                return '#94a3b8';
        }
    };

    // 获取技能等级显示文本
    const getSkillLevelText = (level: string) => {
        switch (level) {
            case 'BEGINNER':
                return t('staff.skillLevels.beginner');
            case 'INTERMEDIATE':
                return t('staff.skillLevels.intermediate');
            case 'EXPERT':
                return t('staff.skillLevels.expert');
            case 'MASTER':
                return t('staff.skillLevels.master');
            default:
                return level;
        }
    };

    // 检查是否可以新增员工
    const canAddStaff = (): boolean => {
        const maxStaff = getLimit('maxStaff');
        if (isUnlimited('maxStaff')) return true;
        // 计算所有员工数量（不含已删除的，staff列表本身已排除DELETED状态）
        const totalStaffCount = staff.length;
        return totalStaffCount < maxStaff;
    };

    // 获取剩余可添加员工数量
    const getRemainingStaffSlots = (): number => {
        const maxStaff = getLimit('maxStaff');
        if (isUnlimited('maxStaff')) return -1;
        const totalStaffCount = staff.length;
        return Math.max(0, maxStaff - totalStaffCount);
    };

    // 处理新增员工按钮点击
    const handleAddStaffClick = () => {
        if (canAddStaff()) {
            setSelectedStaff(null);
            setStaffDialogOpen(true);
        } else {
            setUpgradeDialogOpen(true);
        }
    };

    // 保存员工
    const handleSaveStaff = async (staffData: Partial<StaffResource>) => {
        try {
            const { resourceApi } = await import('../../../services/api');

            // 检查是否是新建员工（通过isNewStaff标识）
            const isNewStaff = (staffData as any).isNewStaff || !selectedStaff;

            if (selectedStaff && !isNewStaff) {
                // 更新员工
                const resourceData = convertStaffToResource(staffData);
                await resourceApi.updateResource(selectedStaff.id, resourceData);
            }
            // 新建员工的情况已经在StaffDialog中处理了，这里只需要刷新数据

            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
            const staffDataList = (response || []).map(convertToStaffResource);
            // 按创建时间倒序排序，新创建的在最上面
            staffDataList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setStaff(staffDataList);

            // 只有成功时才关闭对话框
            setStaffDialogOpen(false);
            setSelectedStaff(null);

            // 显示成功消息
            setSuccessMessage(isNewStaff ? t('staff.createSuccess') : t('staff.updateSuccess'));
        } catch (err) {
            console.error('Failed to save staff:', err);
            // 不关闭对话框，让用户看到错误信息并可以修改后重试
            throw err;
        }
    };

    // 删除员工
    const handleDeleteStaff = async () => {
        if (!selectedStaff) return;
        
        try {
            const { resourceApi } = await import('../../../services/api');
            await resourceApi.deleteResource(selectedStaff.id);
            
            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
            const staffData = (response || []).map(convertToStaffResource);
            // 按创建时间倒序排序，新创建的在最上面
            staffData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setStaff(staffData);
            
            setDeleteDialogOpen(false);
            setSelectedStaff(null);
            
            // 显示成功消息
            setSuccessMessage(t('staff.deleteSuccess'));
        } catch (err) {
            console.error('Failed to delete staff:', err);
            setError(t('staff.deleteError'));
        }
    };

    // 更改员工状态
    const handleStatusChange = async (staffMember: StaffResource, newStatus: string) => {
        try {
            const { resourceApi } = await import('../../../services/api');
            const updatedStaff = convertStaffToResource({
                ...staffMember,
                status: newStatus as 'ACTIVE' | 'INACTIVE' | 'VACATION'
            });

            await resourceApi.updateResource(staffMember.id, updatedStaff);

            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
            const staffData = (response || []).map(convertToStaffResource);
            // 按创建时间倒序排序，新创建的在最上面
            staffData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setStaff(staffData);

            // 显示成功消息
            setSuccessMessage(t('staff.statusUpdateSuccess'));
        } catch (err) {
            console.error('Failed to update staff status:', err);
            setError(t('staff.statusUpdateError'));
        }
    };

    return (
        <Box sx={{ overflowX: 'hidden', width: '100%' }}>
            {/* 统计卡片 - 移动端2x2网格 */}
            <Grid container spacing={isMobile ? 1 : 2.5} mb={isMobile ? 2 : 4} sx={{ mx: 0, width: '100%' }}>
                <Grid item xs={6} sm={6} md={3}>
                    <Card
                        sx={{
                            borderRadius: isMobile ? 2 : 2.5,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            bgcolor: '#fff',
                        }}
                    >
                        <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                            <Box
                                display="flex"
                                alignItems={isMobile ? 'flex-start' : 'center'}
                                flexDirection={isMobile ? 'column' : 'row'}
                                gap={isMobile ? 1 : 2.5}
                            >
                                <Box
                                    sx={{
                                        width: isMobile ? 36 : 44,
                                        height: isMobile ? 36 : 44,
                                        borderRadius: 1.5,
                                        bgcolor: alpha(themeColor, 0.08),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: themeColor,
                                        flexShrink: 0,
                                    }}
                                >
                                    <PersonIcon sx={{ fontSize: isMobile ? 18 : 22 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                                        {t('staff.totalStaff')}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1.1rem' : '1.25rem', lineHeight: 1.2 }}>
                                        {staff.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <Card
                        sx={{
                            borderRadius: isMobile ? 2 : 2.5,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            bgcolor: '#fff',
                        }}
                    >
                        <CardContent sx={{ p: isMobile ? 1.5 : 2.5 }}>
                            <Box
                                display="flex"
                                alignItems={isMobile ? 'flex-start' : 'center'}
                                flexDirection={isMobile ? 'column' : 'row'}
                                gap={isMobile ? 1 : 2.5}
                            >
                                <Box
                                    sx={{
                                        width: isMobile ? 36 : 44,
                                        height: isMobile ? 36 : 44,
                                        borderRadius: 1.5,
                                        bgcolor: alpha(isMonochrome ? '#1a1a1a' : '#10B981', 0.08),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isMonochrome ? '#1a1a1a' : '#10B981',
                                        flexShrink: 0,
                                    }}
                                >
                                    <WorkIcon sx={{ fontSize: isMobile ? 18 : 22 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                                        {t('staff.activeStaff')}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: isMobile ? '1.1rem' : '1.25rem', lineHeight: 1.2 }}>
                                        {staff.filter(s => s.status === 'ACTIVE').length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 搜索和过滤区域 - 响应式设计 */}
            {isMobile ? (
                /* 移动端筛选布局 */
                <Box sx={{ mb: 1.5 }}>
                    {/* 搜索栏 + 筛选按钮 + 添加按钮 */}
                    <Box display="flex" gap={1} mb={1.5} alignItems="stretch">
                        <TextField
                            placeholder={t('staff.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    bgcolor: '#fafafa',
                                    fontSize: '0.8rem',
                                    height: 40,
                                    '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                    '&.Mui-focused fieldset': { borderColor: themeColor, borderWidth: 1 },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <IconButton
                            onClick={() => setFiltersExpanded(!filtersExpanded)}
                            sx={{
                                border: '1px solid rgba(0,0,0,0.12)',
                                borderRadius: 1.5,
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                color: filtersExpanded ? themeColor : '#666',
                                bgcolor: filtersExpanded ? alpha(themeColor, 0.08) : 'transparent',
                            }}
                        >
                            <FilterListIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        {hasPermission('staff:create') && (
                            <IconButton
                                onClick={handleAddStaffClick}
                                sx={{
                                    bgcolor: themeColor,
                                    borderRadius: 1.5,
                                    width: 40,
                                    height: 40,
                                    flexShrink: 0,
                                    color: '#fff',
                                    '&:hover': { bgcolor: themeColorDark },
                                }}
                            >
                                <AddIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        )}
                    </Box>

                    {/* 可折叠筛选面板 */}
                    <Collapse in={filtersExpanded}>
                        <Box sx={{ mb: 1.5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: themeColor } }}>
                                    {t('staff.status')}
                                </InputLabel>
                                <Select
                                    value={statusFilter}
                                    label={t('staff.status')}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{
                                        borderRadius: 1.5,
                                        bgcolor: '#fafafa',
                                        fontSize: '0.75rem',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor },
                                    }}
                                >
                                    <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>{t('staff.allStatuses')}</MenuItem>
                                    <MenuItem value="ACTIVE" sx={{ fontSize: '0.75rem' }}>{t('staff.statusOptions.active')}</MenuItem>
                                    <MenuItem value="INACTIVE" sx={{ fontSize: '0.75rem' }}>{t('staff.statusOptions.inactive')}</MenuItem>
                                    <MenuItem value="VACATION" sx={{ fontSize: '0.75rem' }}>{t('staff.statusOptions.vacation')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Collapse>
                </Box>
            ) : (
                /* 桌面端筛选布局 */
                <Box
                    sx={{
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                        bgcolor: '#fff',
                        mb: 2.5,
                        p: 2.5,
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t('staff.searchPlaceholder')}
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
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ color: '#666', fontSize: '0.875rem' }}>{t('staff.status')}</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label={t('staff.status')}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{
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
                                    }}
                                >
                                    <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>{t('staff.allStatuses')}</MenuItem>
                                    <MenuItem value="ACTIVE" sx={{ fontSize: '0.875rem' }}>{t('staff.statusOptions.active')}</MenuItem>
                                    <MenuItem value="INACTIVE" sx={{ fontSize: '0.875rem' }}>{t('staff.statusOptions.inactive')}</MenuItem>
                                    <MenuItem value="VACATION" sx={{ fontSize: '0.875rem' }}>{t('staff.statusOptions.vacation')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {hasPermission('staff:create') && (
                            <Grid item xs={12} sm={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                                    onClick={handleAddStaffClick}
                                    sx={{
                                        borderRadius: 1.5,
                                        py: 0.75,
                                        px: 2,
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        bgcolor: themeColor,
                                        boxShadow: 'none',
                                        textTransform: 'none',
                                        '&:hover': {
                                            bgcolor: themeColorDark,
                                            boxShadow: 'none',
                                        },
                                    }}
                                >
                                    {t('staff.addStaff')}
                                </Button>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}

            {/* 错误提示 */}
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                    }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* 员工列表 - 响应式设计 */}
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress sx={{ color: themeColor }} />
                </Box>
            ) : isMobile ? (
                /* 移动端卡片列表 */
                <Box>
                    {filteredStaff.length === 0 ? (
                        <Box
                            sx={{
                                py: 4,
                                textAlign: 'center',
                                bgcolor: '#fff',
                                borderRadius: 1.5,
                                border: '1px solid rgba(0,0,0,0.08)',
                            }}
                        >
                            <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                {t('staff.noStaff')}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {filteredStaff
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((staffMember) => (
                                    <Card
                                        key={staffMember.id}
                                        onClick={(e) => {
                                            setMenuAnchorEl(e.currentTarget);
                                            setSelectedStaff(staffMember);
                                        }}
                                        sx={{
                                            mb: 1.5,
                                            borderRadius: 1.5,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            cursor: 'pointer',
                                            WebkitTapHighlightColor: 'transparent',
                                            '&:active': {
                                                bgcolor: 'rgba(0,0,0,0.02)',
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            {/* 第一行：头像 + 姓名 + 状态 */}
                                            <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
                                                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                                                    <Avatar
                                                        src={getFullImageUrl(staffMember.avatar)}
                                                        sx={{
                                                            bgcolor: staffMember.avatar ? 'transparent' : getAvatarColor(staffMember.name),
                                                            width: 36,
                                                            height: 36,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {!staffMember.avatar && staffMember.name.charAt(0)}
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }} noWrap>
                                                            {staffMember.name}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                                                            {staffMember.position || t('staff.noPosition')}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {getStatusChip(staffMember)}
                                            </Box>

                                            {/* 第二行：联系方式 */}
                                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                {staffMember.phone && (
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <PhoneIcon sx={{ fontSize: 14, color: '#888' }} />
                                                        <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                                                            {staffMember.phone}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* 第三行：服务专长 */}
                                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                {staffExpertise[staffMember.id] && staffExpertise[staffMember.id].length > 0 ? (
                                                    <>
                                                        <Chip
                                                            label={`${staffExpertise[staffMember.id].length} ${t('staff.servicesLabel')}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(themeColor, 0.1),
                                                                color: themeColor,
                                                                fontWeight: 500,
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        />
                                                    </>
                                                ) : (
                                                    <Typography sx={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>
                                                        {t('staff.noServices')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}

                            {/* 移动端简化分页 */}
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    bgcolor: '#fff',
                                    borderRadius: 1.5,
                                    border: '1px solid rgba(0,0,0,0.08)',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                    {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredStaff.length)} / {filteredStaff.length}
                                </Typography>
                                <Box display="flex" gap={1}>
                                    <Button
                                        size="small"
                                        disabled={page === 0}
                                        onClick={() => setPage(page - 1)}
                                        sx={{
                                            minWidth: 'auto',
                                            px: 1.5,
                                            py: 0.5,
                                            fontSize: '0.75rem',
                                            color: '#666',
                                            borderRadius: 1,
                                        }}
                                    >
                                        {t('common.previousPage')}
                                    </Button>
                                    <Button
                                        size="small"
                                        disabled={(page + 1) * rowsPerPage >= filteredStaff.length}
                                        onClick={() => setPage(page + 1)}
                                        sx={{
                                            minWidth: 'auto',
                                            px: 1.5,
                                            py: 0.5,
                                            fontSize: '0.75rem',
                                            color: themeColor,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {t('common.nextPage')}
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            ) : (
                /* 桌面端表格 */
                <Box
                    sx={{
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        bgcolor: '#fff',
                    }}
                >
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                    <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('staff.staff')}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('staff.contact')}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('staff.position')}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>
                                        {t('staff.serviceExpertise', 'Service Expertise')}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('staff.status')}</TableCell>
                                    <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('staff.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredStaff.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                {t('staff.noStaff')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStaff
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((staffMember) => (
                                            <TableRow
                                                key={staffMember.id}
                                                hover
                                                sx={{
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                                                    '& td': { py: 1.5, fontSize: '0.875rem' },
                                                }}
                                            >
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Avatar
                                                            src={getFullImageUrl(staffMember.avatar)}
                                                            sx={{
                                                                bgcolor: staffMember.avatar ? 'transparent' : getAvatarColor(staffMember.name),
                                                                width: 40,
                                                                height: 40,
                                                            }}
                                                        >
                                                            {!staffMember.avatar && staffMember.name.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {staffMember.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                                                ID: {staffMember.id}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {t('staff.hiredOn')} {formatDate(staffMember.startDate)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        {staffMember.phone && (
                                                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                <Typography variant="body2">
                                                                    {staffMember.countryCode && `${staffMember.countryCode.replace(/-[A-Z]{2}$/, '')} `}{staffMember.phone}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {staffMember.email && (
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                <Typography variant="body2">{staffMember.email}</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{staffMember.position || '-'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 0.5,
                                                            maxWidth: 280,
                                                        }}
                                                    >
                                                        {staffExpertise[staffMember.id] && staffExpertise[staffMember.id].length > 0 ? (
                                                            <>
                                                                {/* 显示前3个服务 */}
                                                                {staffExpertise[staffMember.id].slice(0, 3).map((expertise) => (
                                                                    <Box
                                                                        key={expertise.serviceId}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        {/* 技能等级圆点 */}
                                                                        <Box
                                                                            sx={{
                                                                                width: 8,
                                                                                height: 8,
                                                                                borderRadius: '50%',
                                                                                bgcolor: getSkillLevelColor(expertise.skillLevel),
                                                                                flexShrink: 0,
                                                                            }}
                                                                        />
                                                                        {/* 服务名称 */}
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontSize: '0.8rem',
                                                                                color: 'text.primary',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                                flex: 1,
                                                                            }}
                                                                        >
                                                                            {expertise.serviceName}
                                                                        </Typography>
                                                                        {/* 技能等级标签 */}
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontSize: '0.65rem',
                                                                                color: getSkillLevelColor(expertise.skillLevel),
                                                                                fontWeight: 600,
                                                                                px: 0.75,
                                                                                py: 0.25,
                                                                                borderRadius: 0.5,
                                                                                bgcolor: alpha(getSkillLevelColor(expertise.skillLevel), 0.1),
                                                                                flexShrink: 0,
                                                                            }}
                                                                        >
                                                                            {getSkillLevelText(expertise.skillLevel).substring(0, 3)}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                                {/* 如果超过3个，显示"查看更多"按钮 */}
                                                                {staffExpertise[staffMember.id].length > 3 && (
                                                                    <Box
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setExpertisePopoverAnchor(e.currentTarget);
                                                                            setSelectedStaffIdForExpertise(staffMember.id);
                                                                        }}
                                                                        sx={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.5,
                                                                            cursor: 'pointer',
                                                                            mt: 0.5,
                                                                            py: 0.5,
                                                                            '&:hover': {
                                                                                '& .more-text': {
                                                                                    color: themeColor,
                                                                                    textDecoration: 'underline',
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <MoreHorizIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                        <Typography
                                                                            className="more-text"
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontSize: '0.75rem',
                                                                                color: 'text.secondary',
                                                                                fontWeight: 500,
                                                                                transition: 'all 0.2s',
                                                                            }}
                                                                        >
                                                                            {staffExpertise[staffMember.id].length - 3} {t('staff.moreServices')}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                                                                {t('staff.noServices')}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusChip(staffMember)}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            setMenuAnchorEl(e.currentTarget);
                                                            setSelectedStaff(staffMember);
                                                        }}
                                                        sx={{
                                                            color: '#999',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(0,0,0,0.04)',
                                                                color: '#666',
                                                            },
                                                        }}
                                                    >
                                                        <MoreVertIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredStaff.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        labelRowsPerPage={t('common.rowsPerPage')}
                        sx={{
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                fontSize: '0.875rem',
                                color: '#666',
                            },
                        }}
                    />
                </Box>
            )}

            {/* 操作菜单 */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => setMenuAnchorEl(null)}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 1.5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            minWidth: 160,
                            mt: 0.5,
                        }
                    }
                }}
            >
                {hasPermission('staff:update') && (
                    <MenuItem
                        onClick={() => {
                            setStaffDialogOpen(true);
                            setMenuAnchorEl(null);
                        }}
                        sx={{
                            fontSize: '0.875rem',
                            py: 1,
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        }}
                    >
                        <EditIcon sx={{ mr: 1.5, fontSize: 16, color: themeColor }} />
                        {t('staff.editStaff')}
                    </MenuItem>
                )}
                {hasPermission('staff:manage_availability') && (
                    <MenuItem
                        onClick={() => {
                            setAvailabilityEditorOpen(true);
                            setMenuAnchorEl(null);
                        }}
                        sx={{
                            fontSize: '0.875rem',
                            py: 1,
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        }}
                    >
                        <ScheduleIcon sx={{ mr: 1.5, fontSize: 16, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
                        {t('staff.advancedScheduleManagement')}
                    </MenuItem>
                )}
                {hasPermission('staff:delete') && (
                    <MenuItem
                        onClick={() => {
                            setDeleteDialogOpen(true);
                            setMenuAnchorEl(null);
                        }}
                        sx={{
                            fontSize: '0.875rem',
                            py: 1,
                            '&:hover': { backgroundColor: alpha('#EF4444', 0.08) },
                        }}
                    >
                        <DeleteIcon sx={{ mr: 1.5, fontSize: 16, color: '#EF4444' }} />
                        {t('staff.deleteStaff')}
                    </MenuItem>
                )}
            </Menu>

            {/* 员工对话框 */}
            <StaffDialog
                open={staffDialogOpen}
                onClose={() => setStaffDialogOpen(false)}
                onExited={() => setSelectedStaff(null)}
                staff={selectedStaff}
                onSave={handleSaveStaff}
            />

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 2.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    },
                }}
            >
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                        {t('staff.confirmDelete')}
                    </Typography>
                </Box>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {t('staff.deleteConfirmMessage', { name: selectedStaff?.name })}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        size="small"
                        sx={{ color: '#666', borderRadius: 1.5, textTransform: 'none', fontSize: '0.875rem' }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteStaff}
                        variant="contained"
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            bgcolor: '#EF4444',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: '#DC2626',
                                boxShadow: 'none',
                            },
                        }}
                    >
                        {t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 成功提示 */}
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
                        borderRadius: isMobile ? 1.5 : 2,
                        fontSize: isMobile ? '0.8rem' : undefined,
                        py: isMobile ? 0.5 : undefined,
                        '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
                    }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* 服务专长详情 Popover */}
            <Popover
                open={Boolean(expertisePopoverAnchor)}
                anchorEl={expertisePopoverAnchor}
                onClose={() => {
                    setExpertisePopoverAnchor(null);
                    setSelectedStaffIdForExpertise(null);
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: 2,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        maxWidth: 380,
                        minWidth: 300,
                    },
                }}
            >
                <Box sx={{ p: 2.5 }}>
                    {/* 标题 */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.95rem' }}>
                            {t('staff.serviceExpertise')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            {selectedStaffIdForExpertise && staffExpertise[selectedStaffIdForExpertise]?.length > 0
                                ? t('staff.servicesCount', { count: staffExpertise[selectedStaffIdForExpertise].length })
                                : t('staff.noServices')}
                        </Typography>
                    </Box>

                    {/* 服务列表 */}
                    {selectedStaffIdForExpertise && staffExpertise[selectedStaffIdForExpertise] && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 360, overflowY: 'auto' }}>
                            {staffExpertise[selectedStaffIdForExpertise].map((expertise) => (
                                <Box
                                    key={expertise.serviceId}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.25,
                                        borderRadius: 2,
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e5e7eb',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#f1f5f9',
                                            borderColor: alpha(themeColor, 0.3),
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            color: 'text.primary',
                                            fontSize: '0.85rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            mr: 1.5,
                                        }}
                                    >
                                        {expertise.serviceName}
                                    </Typography>
                                    <Chip
                                        label={getSkillLevelText(expertise.skillLevel)}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            backgroundColor: alpha(getSkillLevelColor(expertise.skillLevel), 0.1),
                                            color: getSkillLevelColor(expertise.skillLevel),
                                            border: `1px solid ${alpha(getSkillLevelColor(expertise.skillLevel), 0.3)}`,
                                            '& .MuiChip-label': {
                                                px: 1.25,
                                            },
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Popover>

            {/* Advanced Schedule Management Editor */}
            {selectedStaff && (
                <StaffAvailabilityEditor
                    open={availabilityEditorOpen}
                    onClose={() => {
                        setAvailabilityEditorOpen(false);
                        setSelectedStaff(null);
                    }}
                    staffId={selectedStaff.id}
                    staffName={selectedStaff.name}
                    onSave={() => {
                        // Optionally refresh staff list
                        setSuccessMessage(t('staff.availabilityEditor.messages.saveSuccess'));
                        setTimeout(() => setSuccessMessage(null), 2000);
                    }}
                />
            )}

            {/* 状态切换菜单 */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={() => {
                    setStatusMenuAnchor(null);
                    setSelectedStaffForStatus(null);
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 1.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        minWidth: 160,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        if (selectedStaffForStatus) {
                            handleStatusChange(selectedStaffForStatus, 'ACTIVE');
                        }
                        setStatusMenuAnchor(null);
                        setSelectedStaffForStatus(null);
                    }}
                    disabled={selectedStaffForStatus?.status === 'ACTIVE'}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: '#10B981',
                                flexShrink: 0,
                            }}
                        />
                        <Typography variant="body2">{t('staff.statusOptions.active')}</Typography>
                    </Box>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedStaffForStatus) {
                            handleStatusChange(selectedStaffForStatus, 'INACTIVE');
                        }
                        setStatusMenuAnchor(null);
                        setSelectedStaffForStatus(null);
                    }}
                    disabled={selectedStaffForStatus?.status === 'INACTIVE'}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: '#EF4444',
                                flexShrink: 0,
                            }}
                        />
                        <Typography variant="body2">{t('staff.statusOptions.inactive')}</Typography>
                    </Box>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedStaffForStatus) {
                            handleStatusChange(selectedStaffForStatus, 'VACATION');
                        }
                        setStatusMenuAnchor(null);
                        setSelectedStaffForStatus(null);
                    }}
                    disabled={selectedStaffForStatus?.status === 'VACATION'}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: '#8B5CF6',
                                flexShrink: 0,
                            }}
                        />
                        <Typography variant="body2">{t('staff.statusOptions.vacation')}</Typography>
                    </Box>
                </MenuItem>
            </Menu>

            {/* 升级提示对话框 */}
            <Dialog
                open={upgradeDialogOpen}
                onClose={() => setUpgradeDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 2.5,
                        maxWidth: 360,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }
                }}
            >
                <DialogContent sx={{ p: 0 }}>
                    <UpgradePrompt
                        feature="maxStaff"
                        featureNameKey="upgrade.features.maxStaff"
                        requiredPlan="PRO"
                        variant="dialog"
                        currentUsage={staff.length}
                        limit={getLimit('maxStaff')}
                        onClose={() => setUpgradeDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default StaffResourceManagement;