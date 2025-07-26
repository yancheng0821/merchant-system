import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Paper,
    IconButton,
    InputAdornment,
    alpha,
} from '@mui/material';
import {
    Close as CloseIcon,
    Room as RoomIcon,
    People as PeopleIcon,
    LocationOn as LocationIcon,
    Build as BuildIcon,
    Image as ImageIcon,
} from '@mui/icons-material';
import RoomIconSelector from '../../../components/common/RoomIconSelector';
import { useTranslation } from 'react-i18next';
import { RoomResource } from '../types';

// Resources模块主题色 - 红色
const THEME_COLOR = '#DC2626';
const THEME_COLOR_DARK = '#B91C1C';
const THEME_COLOR_DARKER = '#991B1B';

interface RoomDialogProps {
    open: boolean;
    onClose: () => void;
    room: RoomResource | null;
    onSave: (room: Partial<RoomResource>) => Promise<void>;
}

const RoomDialog: React.FC<RoomDialogProps> = ({
    open,
    onClose,
    room,
    onSave,
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<RoomResource>>({
        name: '',
        description: '',
        capacity: 1,
        location: '',
        equipment: '',
        status: 'ACTIVE',
        icon: '', // 添加图标字段
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 获取租户ID
    const tenantId = React.useMemo(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return Number(user.tenantId || 1);
    }, []);

    // 初始化表单数据
    useEffect(() => {
        if (room) {
            setFormData({
                name: room.name || '',
                description: room.description || '',
                capacity: room.capacity || 1,
                location: room.location || '',
                equipment: room.equipment || '',
                status: room.status || 'ACTIVE',
                icon: room.icon || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                capacity: 1,
                location: '',
                equipment: '',
                status: 'ACTIVE',
                icon: '',
            });
        }
        setError(null);
    }, [room, open]);

    const handleInputChange = (field: keyof RoomResource, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // 验证必填字段
            if (!formData.name?.trim()) {
                setError(t('resources.validation.nameRequired'));
                return;
            }

            if (!formData.capacity || formData.capacity < 1) {
                setError(t('resources.validation.capacityRequired'));
                return;
            }

            const roomData: Partial<RoomResource> = {
                ...formData,
                tenantId,
                type: 'ROOM',
            };

            await onSave(roomData);
            onClose();
        } catch (err: any) {
            console.error('保存房间失败:', err);
            setError(err.message || t('resources.saveError'));
        } finally {
            setLoading(false);
        }
    };

    return (
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
            {/* 现代化对话框标题 */}
            <DialogTitle
                sx={{
                    background: `linear-gradient(135deg, ${alpha(THEME_COLOR, 0.08)}, ${alpha(THEME_COLOR_DARK, 0.08)})`,
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
                            <RoomIcon sx={{ fontSize: 24 }} />
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
                                {room ? t('resources.editRoom') : t('resources.addRoom')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {room ? t('dialogs.editRoomInfo') : t('dialogs.createNewRoom')}
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

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 3, 
                                borderRadius: 2,
                                backgroundColor: alpha('#EF4444', 0.1),
                                borderColor: alpha('#EF4444', 0.2),
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* 基本信息 */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            border: '1px solid',
                            borderColor: alpha(THEME_COLOR, 0.2),
                            borderRadius: 2,
                            background: alpha(THEME_COLOR, 0.02),
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <RoomIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                {t('resources.basicInfo')}
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('resources.name')}
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <RoomIcon sx={{ color: THEME_COLOR }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
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
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('resources.capacity')}
                                    type="number"
                                    value={formData.capacity || 1}
                                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                                    inputProps={{ min: 1 }}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PeopleIcon sx={{ color: THEME_COLOR }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
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
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('resources.location')}
                                    value={formData.location || ''}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationIcon sx={{ color: THEME_COLOR }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
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
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('resources.status')}</InputLabel>
                                    <Select
                                        value={formData.status || 'ACTIVE'}
                                        label={t('resources.status')}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        sx={{
                                            borderRadius: 2,
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: THEME_COLOR,
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: THEME_COLOR,
                                            },
                                        }}
                                    >
                                        <MenuItem value="ACTIVE">{t('resources.statusOptions.active')}</MenuItem>
                                        <MenuItem value="INACTIVE">{t('resources.statusOptions.inactive')}</MenuItem>
                                        <MenuItem value="MAINTENANCE">{t('resources.statusOptions.maintenance')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('resources.description')}
                                    multiline
                                    rows={3}
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder={t('resources.descriptionPlaceholder')}
                                    sx={{
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
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 设备信息 */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: alpha(THEME_COLOR, 0.2),
                            borderRadius: 2,
                            background: alpha(THEME_COLOR, 0.02),
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <BuildIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                {t('resources.equipmentInfo')}
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('resources.equipment')}
                                    multiline
                                    rows={3}
                                    value={formData.equipment || ''}
                                    onChange={(e) => handleInputChange('equipment', e.target.value)}
                                    placeholder={t('resources.equipmentPlaceholder')}
                                    sx={{
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
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 图标选择 */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: alpha(THEME_COLOR, 0.2),
                            borderRadius: 2,
                            background: alpha(THEME_COLOR, 0.02),
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                }}
                            >
                                <ImageIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                {t('resources.roomIcon')}
                            </Typography>
                        </Box>

                        <RoomIconSelector
                            value={formData.icon}
                            onChange={(iconName) => handleInputChange('icon', iconName || '')}
                        />
                    </Paper>
                </Box>
            </DialogContent>

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
                    sx={{ 
                        borderRadius: 2,
                        px: 3,
                        color: 'text.secondary',
                    }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
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
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        room ? t('common.update') : t('common.create')
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RoomDialog;