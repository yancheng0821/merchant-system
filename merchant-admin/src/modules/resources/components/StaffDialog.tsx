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
    Person as PersonIcon,
    Work as WorkIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import ImageUploader from '../../../components/common/ImageUploader';
import { useTranslation } from 'react-i18next';
import { StaffResource } from '../types';
import { getFullImageUrl } from '../../../services/api';

// Resources模块主题色 - 红色
const THEME_COLOR = '#DC2626';
const THEME_COLOR_DARK = '#B91C1C';
const THEME_COLOR_DARKER = '#991B1B';

interface StaffDialogProps {
    open: boolean;
    onClose: () => void;
    staff: StaffResource | null;
    onSave: (staff: Partial<StaffResource>) => Promise<void>;
}

const StaffDialog: React.FC<StaffDialogProps> = ({
    open,
    onClose,
    staff,
    onSave,
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<StaffResource>>({
        name: '',
        description: '',
        phone: '',
        email: '',
        position: '',
        skills: '',
        status: 'ACTIVE',
        startDate: '',
        avatar: '', // 添加头像字段
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
        if (staff) {
            setFormData({
                name: staff.name || '',
                description: staff.description || '',
                phone: staff.phone || '',
                email: staff.email || '',
                position: staff.position || '',
                skills: staff.skills || '',
                status: staff.status || 'ACTIVE',
                startDate: staff.startDate || '',
                avatar: staff.avatar || '',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                phone: '',
                email: '',
                position: '',
                skills: '',
                status: 'ACTIVE',
                startDate: new Date().toISOString().split('T')[0],
                avatar: '',
            });
        }
        setError(null);
    }, [staff, open]);

    const handleInputChange = (field: keyof StaffResource, value: any) => {
        console.log(`Updating ${field}:`, value); // 调试日志
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value,
            };
            console.log('New formData:', newData); // 调试日志
            return newData;
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // 验证必填字段
            if (!formData.name?.trim()) {
                setError(t('staff.validation.nameRequired'));
                return;
            }

            // 验证邮箱格式
            if (formData.email && formData.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email.trim())) {
                    setError(t('staff.validation.emailInvalid'));
                    return;
                }
            }

            // 验证电话号码格式（支持国际手机号和座机）
            if (formData.phone && formData.phone.trim()) {
                const phone = formData.phone.trim().replace(/[\s\-\(\)]/g, ''); // 去除空格、横线、括号
                
                // 支持多种电话格式：
                // 1. 中国手机号：13812345678
                // 2. 国际手机号：+8613812345678, +1234567890
                // 3. 中国座机：010-12345678, 021-87654321, 0755-12345678
                // 4. 国际座机：+86-21-87654321
                const phonePatterns = [
                    /^1[3-9]\d{9}$/, // 中国手机号
                    /^\+\d{1,4}\d{7,15}$/, // 国际号码（+国家码+号码）
                    /^0\d{2,3}\d{7,8}$/, // 中国座机（区号+号码）
                    /^\d{7,15}$/, // 普通号码（7-15位数字）
                ];
                
                const isValidPhone = phonePatterns.some(pattern => pattern.test(phone));
                
                if (!isValidPhone) {
                    setError(t('staff.validation.phoneInvalid'));
                    return;
                }
            }

            const staffData: Partial<StaffResource> = {
                ...formData,
                tenantId,
                type: 'STAFF',
            };

            await onSave(staffData);
            onClose();
        } catch (err: any) {
            console.error('保存员工失败:', err);
            setError(err.message || '保存员工失败');
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
                            <PersonIcon sx={{ fontSize: 24 }} />
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
                                {staff ? t('staff.editStaff') : t('staff.addStaff')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {staff ? t('dialogs.editStaffInfo') : t('dialogs.createNewStaff')}
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
                                <PersonIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                {t('staff.basicInfo')}
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>
                            {/* 姓名字段 */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('staff.name')}
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BadgeIcon sx={{ color: THEME_COLOR }} />
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

                            {/* 头像上传 */}
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        {t('staff.avatar')}
                                    </Typography>
                                    <ImageUploader
                                        value={getFullImageUrl(formData.avatar)}
                                        onChange={(imageUrl) => {
                                            console.log('Avatar uploaded:', imageUrl); // 调试日志
                                            handleInputChange('avatar', imageUrl || '');
                                        }}
                                        variant="avatar"
                                        size={80}
                                        placeholder={t('staff.avatarPlaceholder')}
                                        uploadType="avatar"
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('staff.description')}
                                    multiline
                                    rows={2}
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder={t('staff.descriptionPlaceholder')}
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
                                    label={t('staff.phone')}
                                    value={formData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon sx={{ color: THEME_COLOR }} />
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
                                    label={t('staff.email')}
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: THEME_COLOR }} />
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
                                    label={t('staff.hireDate')}
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
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
                        </Grid>
                    </Paper>

                    {/* 工作信息 */}
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
                                <WorkIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                {t('staff.workInfo')}
                            </Typography>
                        </Box>

                        <Grid container spacing={2}>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('staff.position')}
                                    value={formData.position || ''}
                                    onChange={(e) => handleInputChange('position', e.target.value)}
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
                                    <InputLabel>{t('staff.status')}</InputLabel>
                                    <Select
                                        value={formData.status || 'ACTIVE'}
                                        label={t('staff.status')}
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
                                        <MenuItem value="ACTIVE">{t('staff.statusOptions.active')}</MenuItem>
                                        <MenuItem value="INACTIVE">{t('staff.statusOptions.inactive')}</MenuItem>
                                        <MenuItem value="MAINTENANCE">{t('staff.statusOptions.maintenance')}</MenuItem>
                                        <MenuItem value="VACATION">{t('staff.statusOptions.vacation')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('staff.skills')}
                                    multiline
                                    rows={3}
                                    value={formData.skills || ''}
                                    onChange={(e) => handleInputChange('skills', e.target.value)}
                                    placeholder={t('staff.skillsPlaceholder')}
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
                        staff ? t('common.update') : t('common.create')
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StaffDialog;