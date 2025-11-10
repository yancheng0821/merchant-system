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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StaffDialog from './StaffDialog';
import StaffAvailabilityEditor from './StaffAvailabilityEditor';
import { StaffResource, convertToStaffResource, convertStaffToResource } from '../types';
import { getFullImageUrl } from '../../../services/api';
import { usePermission } from '../../../hooks/usePermission';
import { format, parseISO } from 'date-fns';

const StaffResourceManagement: React.FC = () => {
    const { t } = useTranslation();
    const { hasPermission } = usePermission();
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
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [expertisePopoverAnchor, setExpertisePopoverAnchor] = useState<null | HTMLElement>(null);
    const [selectedStaffIdForExpertise, setSelectedStaffIdForExpertise] = useState<number | null>(null);
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedStaffForStatus, setSelectedStaffForStatus] = useState<StaffResource | null>(null);

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

    // 主题色
    const themeColor = '#3B82F6';

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

    const getAvatarColor = (name: string) => {
        const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // 根据技能等级获取颜色
    const getSkillLevelColor = (level: string) => {
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
                return 'Beginner';
            case 'INTERMEDIATE':
                return 'Intermediate';
            case 'EXPERT':
                return 'Expert';
            case 'MASTER':
                return 'Master';
            default:
                return level;
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
        <Box>
            {/* 统计卡片 */}
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
                                        {staff.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('staff.totalStaff')}
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
                                    <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
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
                                        {staff.filter(s => s.status === 'ACTIVE').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('staff.activeStaff')}
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
                                    <WorkIcon sx={{ color: 'white', fontSize: 24 }} />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 搜索和筛选区域 */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        placeholder={t('staff.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0,0,0,0.23)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: themeColor,
                                    borderWidth: '2px',
                                },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>{t('staff.status')}</InputLabel>
                        <Select
                            value={statusFilter}
                            label={t('staff.status')}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{
                                borderRadius: 2,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(0,0,0,0.23)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: themeColor,
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            <MenuItem value="all">{t('staff.allStatuses')}</MenuItem>
                            <MenuItem value="ACTIVE">{t('staff.statusOptions.active')}</MenuItem>
                            <MenuItem value="INACTIVE">{t('staff.statusOptions.inactive')}</MenuItem>
                            <MenuItem value="VACATION">{t('staff.statusOptions.vacation')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {hasPermission('staff:create') && (
                    <Grid item xs={12} md={3}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setSelectedStaff(null);
                                setStaffDialogOpen(true);
                            }}
                            sx={{
                                borderRadius: 3,
                                background: `linear-gradient(45deg, ${themeColor}, #3B82F6)`,
                                boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                                height: '56px',
                                width: '100%',
                                '&:hover': {
                                    background: `linear-gradient(45deg, #1D4ED8, ${themeColor})`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {t('staff.addStaff')}
                        </Button>
                    </Grid>
                )}
            </Grid>

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

            {/* 员工列表表格 */}
            <Card
                sx={{
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('staff.staff')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('staff.contact')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('staff.position')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {t('staff.serviceExpertise', 'Service Expertise')}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('staff.status')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('staff.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress sx={{ color: themeColor }} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredStaff.length === 0 ? (
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
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: alpha(themeColor, 0.04),
                                                },
                                                transition: 'background-color 0.2s ease',
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
                                                                        {staffExpertise[staffMember.id].length - 3} more services
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                                                            No services
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(staffMember)}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        setMenuAnchorEl(e.currentTarget);
                                                        setSelectedStaff(staffMember);
                                                    }}
                                                >
                                                    <MoreVertIcon />
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
                />
            </Card>

            {/* 操作菜单 */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => setMenuAnchorEl(null)}
            >
                {hasPermission('staff:update') && (
                    <MenuItem
                        onClick={() => {
                            setStaffDialogOpen(true);
                            setMenuAnchorEl(null);
                        }}
                    >
                        <EditIcon sx={{ mr: 1, fontSize: 18 }} />
                        {t('staff.editStaff')}
                    </MenuItem>
                )}
                {hasPermission('staff:manage_availability') && (
                    <MenuItem
                        onClick={() => {
                            setAvailabilityEditorOpen(true);
                            setMenuAnchorEl(null);
                        }}
                        sx={{ color: themeColor }}
                    >
                        <ScheduleIcon sx={{ mr: 1, fontSize: 18 }} />
                        {t('staff.advancedScheduleManagement')}
                    </MenuItem>
                )}
                {hasPermission('staff:delete') && (
                    <MenuItem
                        onClick={() => {
                            setDeleteDialogOpen(true);
                            setMenuAnchorEl(null);
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
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
                        borderRadius: 3,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {t('staff.confirmDelete')}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('staff.deleteConfirmMessage', { name: selectedStaff?.name })}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={handleDeleteStaff}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 2 }}
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
            >
                <Alert
                    onClose={() => setSuccessMessage(null)}
                    severity="success"
                    sx={{ borderRadius: 2 }}
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
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        maxWidth: 380,
                        minWidth: 300,
                    },
                }}
            >
                <Box sx={{ p: 2.5 }}>
                    {/* 标题 */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.95rem' }}>
                            Service Expertise
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            {selectedStaffIdForExpertise && staffExpertise[selectedStaffIdForExpertise]?.length > 0
                                ? `${staffExpertise[selectedStaffIdForExpertise].length} services`
                                : 'No services'}
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
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        minWidth: 180,
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
        </Box>
    );
};

export default StaffResourceManagement;