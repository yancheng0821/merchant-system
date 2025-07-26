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
    Room as RoomIcon,
    LocationOn as LocationIcon,
    People as CapacityIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import RoomDialog from './RoomDialog';
import { RoomResource, convertToRoomResource, convertRoomToResource } from '../types';

const RoomResourceManagement: React.FC = () => {
    const { t } = useTranslation();
    const [rooms, setRooms] = useState<RoomResource[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<RoomResource[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedRoom, setSelectedRoom] = useState<RoomResource | null>(null);

    // 对话框状态
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
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

    // 获取场地数据
    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                setLoading(true);
                const { resourceApi } = await import('../../../services/api');
                const response = await resourceApi.getResourcesByType(tenantId, 'ROOM');
                console.log('Room data received:', response);
                setRooms((response || []).map(convertToRoomResource));
            } catch (err) {
                console.error('获取场地数据失败:', err);
                setError(err instanceof Error ? err.message : '获取场地数据失败');
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRoomData();
    }, [tenantId]);

    // 筛选场地
    useEffect(() => {
        let filtered = rooms;

        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.location || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        setFilteredRooms(filtered);
        setPage(0);
    }, [rooms, searchTerm, statusFilter]);

    const getStatusChip = (status: string) => {
        const statusConfig = {
            ACTIVE: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('resources.statusOptions.active') },
            INACTIVE: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('resources.statusOptions.inactive') },
            MAINTENANCE: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('resources.statusOptions.maintenance') },
            VACATION: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('resources.statusOptions.vacation') },
            DELETED: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: t('resources.statusOptions.deleted') },
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

    const getRoomIcon = (name: string) => {
        if (name.includes('VIP') || name.includes('包间')) return '🎤';
        if (name.includes('美容') || name.includes('护理')) return '💆';
        if (name.includes('SPA') || name.includes('按摩')) return '🧘';
        if (name.includes('美甲')) return '💅';
        return '🏠';
    };

    // 保存房间
    const handleSaveRoom = async (roomData: Partial<RoomResource>) => {
        try {
            const { resourceApi } = await import('../../../services/api');

            // 转换为API期望的Resource类型
            const resourceData = convertRoomToResource(roomData);

            if (selectedRoom) {
                // 更新房间
                await resourceApi.updateResource(selectedRoom.id, resourceData);
            } else {
                // 创建房间
                await resourceApi.createResource(resourceData as any);
            }

            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'ROOM');
            setRooms((response || []).map(convertToRoomResource));

            setRoomDialogOpen(false);
            setSelectedRoom(null);
            
            // 显示成功消息
            setSuccessMessage(selectedRoom ? t('resources.updateSuccess') : t('resources.createSuccess'));
        } catch (err) {
            console.error('保存房间失败:', err);
            throw err;
        }
    };

    // 删除房间
    const handleDeleteRoom = async () => {
        if (!selectedRoom) return;

        try {
            const { resourceApi } = await import('../../../services/api');
            await resourceApi.deleteResource(selectedRoom.id);

            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'ROOM');
            setRooms((response || []).map(convertToRoomResource));

            setDeleteDialogOpen(false);
            setSelectedRoom(null);
            
            // 显示成功消息
            setSuccessMessage(t('resources.deleteSuccess'));
        } catch (err) {
            console.error('删除房间失败:', err);
            setError(t('resources.deleteError'));
        }
    };

    // 将房间设置为Inactive
    const handleSetRoomInactive = async () => {
        if (!selectedRoom) return;

        try {
            const { resourceApi } = await import('../../../services/api');
            const updatedRoom = convertRoomToResource({
                ...selectedRoom,
                status: 'INACTIVE'
            });

            await resourceApi.updateResource(selectedRoom.id, updatedRoom);

            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'ROOM');
            setRooms((response || []).map(convertToRoomResource));

            setSelectedRoom(null);
            
            // 显示成功消息
            setSuccessMessage(t('resources.statusUpdateSuccess'));
        } catch (err) {
            console.error('设置房间为Inactive失败:', err);
            setError(t('resources.statusUpdateError'));
        }
    };

    // 将房间设置为Active
    const handleSetRoomActive = async () => {
        if (!selectedRoom) return;

        try {
            const { resourceApi } = await import('../../../services/api');
            const updatedRoom = convertRoomToResource({
                ...selectedRoom,
                status: 'ACTIVE'
            });

            await resourceApi.updateResource(selectedRoom.id, updatedRoom);

            // 重新获取数据
            const response = await resourceApi.getResourcesByType(tenantId, 'ROOM');
            setRooms((response || []).map(convertToRoomResource));

            setSelectedRoom(null);
            
            // 显示成功消息
            setSuccessMessage(t('resources.statusUpdateSuccess'));
        } catch (err) {
            console.error('设置房间为Active失败:', err);
            setError(t('resources.statusUpdateError'));
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
                                        {rooms.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('resources.totalRooms')}
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
                                    <RoomIcon sx={{ color: 'white', fontSize: 24 }} />
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
                                        {rooms.filter(r => r.status === 'ACTIVE').length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('resources.activeRooms')}
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
                                    <RoomIcon sx={{ color: 'white', fontSize: 24 }} />
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
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#06B6D4' }}>
                                        {rooms.reduce((sum, room) => sum + room.capacity, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('resources.totalCapacity')}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #06B6D4, #06B6D480)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CapacityIcon sx={{ color: 'white', fontSize: 24 }} />
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
                        placeholder={t('resources.searchRoomPlaceholder')}
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
                        <InputLabel>{t('resources.status')}</InputLabel>
                        <Select
                            value={statusFilter}
                            label={t('resources.status')}
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
                            <MenuItem value="all">{t('resources.allStatuses')}</MenuItem>
                            <MenuItem value="ACTIVE">{t('resources.statusOptions.active')}</MenuItem>
                            <MenuItem value="INACTIVE">{t('resources.statusOptions.inactive')}</MenuItem>
                            <MenuItem value="MAINTENANCE">{t('resources.statusOptions.maintenance')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedRoom(null);
                            setRoomDialogOpen(true);
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
                        {t('resources.addRoom')}
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

            {/* 场地列表表格 */}
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
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('resources.room')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('resources.capacity')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('resources.location')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('resources.equipment')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('resources.status')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('resources.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <CircularProgress sx={{ color: themeColor }} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredRooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {t('resources.noRooms')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRooms
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((room) => (
                                        <TableRow
                                            key={room.id}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: alpha(themeColor, 0.04),
                                                },
                                                transition: 'background-color 0.2s ease',
                                            }}
                                        >
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 2,
                                                            background: alpha(themeColor, 0.1),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '20px',
                                                        }}
                                                    >
                                                        {getRoomIcon(room.name)}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {room.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {room.description || '-'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <CapacityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">{room.capacity} 人</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2">{room.location || '-'}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                                    {room.equipment || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(room.status)}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        setMenuAnchorEl(e.currentTarget);
                                                        setSelectedRoom(room);
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
                    count={filteredRooms.length}
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
                        setRoomDialogOpen(true);
                        setMenuAnchorEl(null);
                    }}
                >
                    <EditIcon sx={{ mr: 1, fontSize: 18 }} />
                    {t('resources.editRoom')}
                </MenuItem>
                {selectedRoom?.status === 'ACTIVE' && (
                    <MenuItem
                        onClick={() => {
                            handleSetRoomInactive();
                            setMenuAnchorEl(null);
                        }}
                        sx={{ color: 'warning.main' }}
                    >
                        <BlockIcon sx={{ mr: 1, fontSize: 18 }} />
                        {t('resources.setInactive')}
                    </MenuItem>
                )}
                {(selectedRoom?.status === 'INACTIVE' || selectedRoom?.status === 'MAINTENANCE') && (
                    <MenuItem
                        onClick={() => {
                            handleSetRoomActive();
                            setMenuAnchorEl(null);
                        }}
                        sx={{ color: 'success.main' }}
                    >
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                        {t('resources.setActive')}
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
                    {t('resources.deleteRoom')}
                </MenuItem>
            </Menu>

            {/* 房间对话框 */}
            <RoomDialog
                open={roomDialogOpen}
                onClose={() => {
                    setRoomDialogOpen(false);
                    setSelectedRoom(null);
                }}
                room={selectedRoom}
                onSave={handleSaveRoom}
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
                    {t('resources.confirmDelete')}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('resources.deleteConfirmMessage', { name: selectedRoom?.name })}
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
                        onClick={handleDeleteRoom}
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

export default RoomResourceManagement;