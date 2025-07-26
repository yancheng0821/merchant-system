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
    PersonOff as PersonOffIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StaffDialog from './StaffDialog';
import { StaffResource, convertToStaffResource, convertStaffToResource } from '../types';
import { getFullImageUrl } from '../../../services/api';

const StaffResourceManagement: React.FC = () => {
    const { t } = useTranslation();
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
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    // 加载状态
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 主题色
    const themeColor = '#DC2626';

    // 获取租户ID
    const tenantId = useMemo(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return Number(user.tenantId || 1);
    }, []);

    // 获取员工数据
    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                setLoading(true);
                const { resourceApi } = await import('../../../services/api');
                const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
                const staffData = (response || []).map(convertToStaffResource);
                setStaff(staffData);
            } catch (err) {
                console.error('获取员工数据失败:', err);
                setError(err instanceof Error ? err.message : '获取员工数据失败');
                setStaff([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStaffData();
    }, [tenantId]);

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

    const getStatusChip = (status: string) => {
        const statusConfig = {
            ACTIVE: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('staff.statusOptions.active') },
            INACTIVE: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('staff.statusOptions.inactive') },
            MAINTENANCE: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('staff.statusOptions.maintenance') },
            VACATION: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('staff.statusOptions.vacation') },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;

        return (
            <Chip
                label={config.label}
                sx={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                    '& .MuiChip-label': {
                        px: 2,
                    },
                }}
            />
        );
    };

    const getAvatarColor = (name: string) => {
        const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // 保存员工
    const handleSaveStaff = async (staffData: Partial<StaffResource>) => {
        try {
            const { resourceApi } = await import('../../../services/api');
            
            // 转换为API期望的Resource类型
            const resourceData = convertStaffToResource(staffData);
            
            if (selectedStaff) {
                // 更新员工
                await resourceApi.updateResource(selectedStaff.id, resourceData);
            } else {
                // 创建员工
                await resourceApi.createResource(resourceData as any);
            }
            
            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
            setStaff((response || []).map(convertToStaffResource));
            
            setStaffDialogOpen(false);
            setSelectedStaff(null);
            
            // 显示成功消息
            setSuccessMessage(selectedStaff ? t('staff.updateSuccess') : t('staff.createSuccess'));
        } catch (err) {
            console.error('保存员工失败:', err);
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
            setStaff((response || []).map(convertToStaffResource));
            
            setDeleteDialogOpen(false);
            setSelectedStaff(null);
            
            // 显示成功消息
            setSuccessMessage(t('staff.deleteSuccess'));
        } catch (err) {
            console.error('删除员工失败:', err);
            setError('删除员工失败');
        }
    };

    // 将员工设置为Inactive
    const handleSetInactive = async () => {
        if (!selectedStaff) return;
        
        try {
            const { resourceApi } = await import('../../../services/api');
            const updatedStaff = convertStaffToResource({
                ...selectedStaff,
                status: 'INACTIVE'
            });
            
            await resourceApi.updateResource(selectedStaff.id, updatedStaff);
            
            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
            setStaff((response || []).map(convertToStaffResource));
            
            setSelectedStaff(null);
            
            // 显示成功消息
            setSuccessMessage(t('staff.statusUpdateSuccess'));
        } catch (err) {
            console.error('设置员工为Inactive失败:', err);
            setError(t('staff.statusUpdateError'));
        }
    };

    // 将员工设置为Active
    const handleSetActive = async () => {
        if (!selectedStaff) return;
        
        try {
            const { resourceApi } = await import('../../../services/api');
            const updatedStaff = convertStaffToResource({
                ...selectedStaff,
                status: 'ACTIVE'
            });
            
            await resourceApi.updateResource(selectedStaff.id, updatedStaff);
            
            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'STAFF');
            setStaff((response || []).map(convertToStaffResource));
            
            setSelectedStaff(null);
            
            // 显示成功消息
            setSuccessMessage(t('staff.statusUpdateSuccess'));
        } catch (err) {
            console.error('设置员工为Active失败:', err);
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
                                    <SearchIcon sx={{ color: themeColor }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: '#f8fafc',
                                border: '2px solid transparent',
                                '&:hover': {
                                    backgroundColor: '#f1f5f9',
                                    borderColor: alpha(themeColor, 0.3),
                                },
                                '&.Mui-focused': {
                                    backgroundColor: 'white',
                                    borderColor: themeColor,
                                    boxShadow: `0 0 0 3px ${alpha(themeColor, 0.1)}`,
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
                                borderRadius: 3,
                                '& .MuiOutlinedInput-root': {
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha(themeColor, 0.5),
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: themeColor,
                                    },
                                },
                            }}
                        >
                            <MenuItem value="all">{t('staff.allStatuses')}</MenuItem>
                            <MenuItem value="ACTIVE">{t('staff.statusOptions.active')}</MenuItem>
                            <MenuItem value="INACTIVE">{t('staff.statusOptions.inactive')}</MenuItem>
                            <MenuItem value="MAINTENANCE">{t('staff.statusOptions.maintenance')}</MenuItem>
                            <MenuItem value="VACATION">{t('staff.statusOptions.vacation')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
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
                            background: `linear-gradient(45deg, ${themeColor}, #EF4444)`,
                            boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                            height: '56px',
                            width: '100%',
                            '&:hover': {
                                background: `linear-gradient(45deg, #B91C1C, ${themeColor})`,
                                transform: 'translateY(-1px)',
                                boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {t('staff.addStaff')}
                    </Button>
                </Grid>
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
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('staff.skills')}</TableCell>
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
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('staff.hiredOn')} {staffMember.startDate ? new Date(staffMember.startDate).toLocaleDateString() : '-'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    {staffMember.phone && (
                                                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                            <Typography variant="body2">{staffMember.phone}</Typography>
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
                                                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                                    {staffMember.skills || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(staffMember.status)}
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
                <MenuItem
                    onClick={() => {
                        setStaffDialogOpen(true);
                        setMenuAnchorEl(null);
                    }}
                >
                    <EditIcon sx={{ mr: 1, fontSize: 18 }} />
                    {t('staff.editStaff')}
                </MenuItem>
                {selectedStaff?.status === 'ACTIVE' && (
                    <MenuItem
                        onClick={() => {
                            handleSetInactive();
                            setMenuAnchorEl(null);
                        }}
                        sx={{ color: 'warning.main' }}
                    >
                        <PersonOffIcon sx={{ mr: 1, fontSize: 18 }} />
                        {t('staff.setInactive')}
                    </MenuItem>
                )}
                {(selectedStaff?.status === 'INACTIVE' || selectedStaff?.status === 'MAINTENANCE' || selectedStaff?.status === 'VACATION') && (
                    <MenuItem
                        onClick={() => {
                            handleSetActive();
                            setMenuAnchorEl(null);
                        }}
                        sx={{ color: 'success.main' }}
                    >
                        <PersonAddIcon sx={{ mr: 1, fontSize: 18 }} />
                        {t('staff.setActive')}
                    </MenuItem>
                )}
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
            </Menu>

            {/* 员工对话框 */}
            <StaffDialog
                open={staffDialogOpen}
                onClose={() => {
                    setStaffDialogOpen(false);
                    setSelectedStaff(null);
                }}
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
        </Box>
    );
};

export default StaffResourceManagement;