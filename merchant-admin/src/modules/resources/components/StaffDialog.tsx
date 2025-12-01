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
    Checkbox,
    Snackbar,
    useMediaQuery,
    useTheme as useMuiTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    Build as BuildIcon,
} from '@mui/icons-material';
import ImageUploader from '../../../components/common/ImageUploader';
import CountryCodeSelector from '../../../components/common/CountryCodeSelector';
import { useTranslation } from 'react-i18next';
import { StaffResource } from '../types';
import { getFullImageUrl } from '../../../services/api';
import { getMerchantToday } from '../../../utils/timezoneUtils';
import { useTheme } from '../../../contexts/ThemeContext';

interface StaffDialogProps {
    open: boolean;
    onClose: () => void;
    onExited?: () => void;
    staff: StaffResource | null;
    onSave: (staff: Partial<StaffResource>) => Promise<void>;
}

const StaffDialog: React.FC<StaffDialogProps> = ({
    open,
    onClose,
    onExited,
    staff,
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

    // 获取技能等级颜色
    const getSkillLevelColor = (level: string) => {
        if (isMonochrome) {
            switch (level) {
                case 'BEGINNER': return '#9a9a9a';
                case 'INTERMEDIATE': return '#6a6a6a';
                case 'EXPERT': return '#4a4a4a';
                case 'MASTER': return '#1a1a1a';
                default: return '#9a9a9a';
            }
        }
        // 彩色模式
        switch (level) {
            case 'BEGINNER': return '#94a3b8';
            case 'INTERMEDIATE': return '#3b82f6';
            case 'EXPERT': return '#f59e0b';
            case 'MASTER': return '#ef4444';
            default: return '#94a3b8';
        }
    };
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
    const [countryCode, setCountryCode] = useState<string>('+1-CA');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 服务相关状态
    const [allServices, setAllServices] = useState<any[]>([]);
    const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
    const [serviceExpertise, setServiceExpertise] = useState<Record<number, { skillLevel: string }>>({});

    // 获取租户ID
    const tenantId = React.useMemo(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return Number(user.tenantId || 1);
    }, []);


    // 加载所有服务列表
    useEffect(() => {
        const loadServices = async () => {
            try {
                const { serviceApi } = await import('../../../services/api');
                const services = await serviceApi.getServices(tenantId.toString());
                setAllServices(services || []);
            } catch (err) {
                console.error('Failed to load services:', err);
            }
        };

        if (open && tenantId) {
            loadServices();
        }
    }, [open, tenantId]);

    // 初始化表单数据
    useEffect(() => {
        if (staff) {
            // startDate 是纯日期字段，不需要时区转换
            // 直接使用数据库中的日期值
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
            // 直接使用数据库中的countryCode
            setCountryCode(staff.countryCode || '+1-CA');

            // 编辑员工时，获取服务关联
            const fetchServiceExpertise = async () => {
                try {
                    const { resourceApi } = await import('../../../services/api');
                    const expertiseList = await resourceApi.getResourceServices(staff.id);

                    // 构建选中的服务集合和专长信息
                    const serviceIds = new Set<number>();
                    const expertiseMap: Record<number, { skillLevel: string }> = {};

                    expertiseList.forEach(expertise => {
                        serviceIds.add(expertise.serviceId);
                        expertiseMap[expertise.serviceId] = {
                            skillLevel: expertise.skillLevel || 'INTERMEDIATE'
                        };
                    });

                    setSelectedServices(serviceIds);
                    setServiceExpertise(expertiseMap);
                } catch (err) {
                    console.error('获取员工服务专长失败:', err);
                }
            };

            if (open && staff.id) {
                fetchServiceExpertise();
            }
        } else {
            setFormData({
                name: '',
                description: '',
                phone: '',
                email: '',
                position: '',
                skills: '',
                status: 'ACTIVE',
                startDate: getMerchantToday(), // 使用商户本地时区的今天日期
                avatar: '',
            });
            setCountryCode('+1-CA');

            // 重置服务选择
            setSelectedServices(new Set());
            setServiceExpertise({});
        }
        setError(null);
    }, [staff, open]);

    const handleInputChange = (field: keyof StaffResource, value: any) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value,
            };
            return newData;
        });
    };

    const handleSubmit = async () => {
        // 验证必填字段
        if (!formData.name?.trim()) {
            setError(t('staff.validation.nameRequired'));
            return;
        }

        // 验证电话号码必填
        if (!formData.phone || !formData.phone.trim()) {
            setError(t('staff.validation.phoneRequired'));
            return;
        }

        // 验证电话号码格式（只验证号码部分，不包含国家码）
        if (!/^[0-9\s\-()]+$/.test(formData.phone.trim())) {
            setError(t('staff.validation.phoneInvalid'));
            return;
        }

        // 验证国家码必填
        if (!countryCode) {
            setError(t('staff.validation.countryCodeRequired'));
            return;
        }

        // 验证邮箱必填
        if (!formData.email || !formData.email.trim()) {
            setError(t('staff.validation.emailRequired'));
            return;
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setError(t('staff.validation.emailInvalid'));
            return;
        }

        try {
            setLoading(true);
            setError(null);

            if (!staff) {
                // 新建员工（不包含可用性，使用高级排班管理设置）
                const resourceCreateData = {
                    tenantId,
                    name: formData.name,
                    type: 'STAFF' as const,
                    description: formData.description,
                    phone: formData.phone,
                    countryCode: countryCode, // 单独存储国家码
                    email: formData.email,
                    position: formData.position,
                    startDate: formData.startDate,
                    avatar: formData.avatar,
                    status: formData.status || 'ACTIVE',
                    specialties: formData.skills, // 将skills映射到specialties
                };

                // 调用创建资源API（不包含可用性）
                const { resourceApi } = await import('../../../services/api');
                const createdResource = await resourceApi.createResource(resourceCreateData);

                // 保存服务专长关联
                if (selectedServices.size > 0) {
                    const expertiseList = Array.from(selectedServices).map(serviceId => ({
                        serviceId,
                        skillLevel: serviceExpertise[serviceId]?.skillLevel || 'INTERMEDIATE'
                    }));
                    await resourceApi.setResourceServices(createdResource.id, expertiseList);
                }

                // 触发父组件的刷新和成功提示
                if (onSave) {
                    // 传递一个标识，让父组件知道这是新建的员工
                    await onSave({ ...createdResource, isNewStaff: true } as any);
                }
            } else {
                // 更新现有员工（不更新可用性，使用高级排班管理）
                const { resourceApi } = await import('../../../services/api');

                // 更新服务专长关联
                const expertiseList = Array.from(selectedServices).map(serviceId => ({
                    serviceId,
                    skillLevel: serviceExpertise[serviceId]?.skillLevel || 'INTERMEDIATE'
                }));
                await resourceApi.setResourceServices(staff.id, expertiseList);

                // 更新员工基本信息
                const staffData: Partial<StaffResource> = {
                    ...formData,
                    countryCode: countryCode, // 单独存储国家码
                    tenantId,
                    type: 'STAFF' as const,
                };
                await onSave(staffData);
            }

            // 只有所有操作都成功时才关闭对话框
            onClose();
        } catch (err: any) {
            console.error('保存员工失败:', err);
            setError(err.message || '保存员工失败');
            // Dialog stays open on error so user can fix the issue
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
            fullScreen={isMobile}
            TransitionProps={{
                onExited: onExited,
            }}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 2.5,
                    boxShadow: isMobile ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
                },
            }}
        >
            {/* 简化对话框标题 */}
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <PersonIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                            {staff ? t('staff.editStaff') : t('staff.addStaff')}
                        </Typography>
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

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    {/* 基本信息 */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            mb: 2,
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 2,
                            background: '#fafafa',
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                color: '#1a1a1a',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontSize: '0.875rem',
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                            {t('staff.basicInfo')}
                        </Typography>

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
                                            borderRadius: 1.5,
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
                                            handleInputChange('avatar', imageUrl || '');
                                        }}
                                        variant="avatar"
                                        size={80}
                                        placeholder={t('staff.avatarPlaceholder')}
                                        uploadType="staff-avatar"
                                        themeColor={THEME_COLOR}
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
                                            borderRadius: 1.5,
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
                                <Grid container spacing={1}>
                                    <Grid item xs={4}>
                                        <CountryCodeSelector
                                            value={countryCode}
                                            onChange={(value) => setCountryCode(value)}
                                            label={t('staff.countryCode', 'Code')}
                                            size="medium"
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={8}>
                                        <TextField
                                            fullWidth
                                            label={t('staff.phone')}
                                            value={formData.phone || ''}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="1234567890"
                                            required
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
                                </Grid>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('staff.email')}
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: THEME_COLOR }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
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
                                            borderRadius: 1.5,
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
                            p: 2.5,
                            mb: 2,
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 2,
                            background: '#fafafa',
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                color: '#1a1a1a',
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontSize: '0.875rem',
                            }}
                        >
                            <WorkIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                            {t('staff.workInfo')}
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('staff.position')}
                                    value={formData.position || ''}
                                    onChange={(e) => handleInputChange('position', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
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
                                            borderRadius: 1.5,
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
                                        <MenuItem value="VACATION">{t('staff.statusOptions.vacation')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* 服务专长设置 */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            mb: 2,
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 2,
                            background: '#fafafa',
                        }}
                    >
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} justifyContent="space-between" mb={2} gap={isMobile ? 1.5 : 0}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <BuildIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                                <Box>
                                    <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem' }}>
                                        {t('staff.serviceExpertise', 'Service Expertise')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedServices.size > 0
                                            ? t('staff.servicesSelected', '{{count}} services selected', { count: selectedServices.size })
                                            : t('staff.serviceExpertiseDescription', 'Select services and set skill levels')}
                                    </Typography>
                                </Box>
                            </Box>
                            {allServices.length > 0 && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        if (selectedServices.size === allServices.length) {
                                            // 取消全选
                                            setSelectedServices(new Set());
                                            setServiceExpertise({});
                                        } else {
                                            // 全选
                                            const allServiceIds = new Set(allServices.map(s => s.id));
                                            setSelectedServices(allServiceIds);
                                            // 为所有服务设置默认技能等级
                                            const newExpertise: Record<number, { skillLevel: string }> = {};
                                            allServices.forEach(service => {
                                                newExpertise[service.id] = {
                                                    skillLevel: serviceExpertise[service.id]?.skillLevel || 'INTERMEDIATE'
                                                };
                                            });
                                            setServiceExpertise(newExpertise);
                                        }
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        color: THEME_COLOR,
                                        alignSelf: isMobile ? 'flex-end' : 'auto',
                                        '&:hover': {
                                            backgroundColor: alpha(THEME_COLOR, 0.1),
                                        },
                                    }}
                                >
                                    {selectedServices.size === allServices.length
                                        ? t('staff.unselectAll', 'Unselect All')
                                        : t('staff.selectAll', 'Select All')}
                                </Button>
                            )}
                        </Box>

                        {allServices.length === 0 ? (
                            <Alert severity="info">
                                {t('staff.noServicesAvailable', 'No services available. Please create services first.')}
                            </Alert>
                        ) : (
                            <Box
                                sx={{
                                    border: '1px solid',
                                    borderColor: alpha(THEME_COLOR, 0.2),
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    maxHeight: 400,
                                    overflowY: 'auto',
                                }}
                            >
                                {allServices.map((service, index) => {
                                    const handleToggleService = () => {
                                        const newSelectedServices = new Set(selectedServices);
                                        if (selectedServices.has(service.id)) {
                                            // 取消选择
                                            newSelectedServices.delete(service.id);
                                            setServiceExpertise(prev => {
                                                const newExpertise = { ...prev };
                                                delete newExpertise[service.id];
                                                return newExpertise;
                                            });
                                        } else {
                                            // 选择
                                            newSelectedServices.add(service.id);
                                            if (!serviceExpertise[service.id]) {
                                                setServiceExpertise(prev => ({
                                                    ...prev,
                                                    [service.id]: {
                                                        skillLevel: 'INTERMEDIATE'
                                                    }
                                                }));
                                            }
                                        }
                                        setSelectedServices(newSelectedServices);
                                    };

                                    return (
                                        <Box
                                            key={service.id}
                                            onClick={handleToggleService}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: isMobile ? 'column' : 'row',
                                                alignItems: isMobile ? 'stretch' : 'center',
                                                p: isMobile ? 1.5 : 2,
                                                borderBottom: index < allServices.length - 1 ? `1px solid ${alpha(THEME_COLOR, 0.1)}` : 'none',
                                                background: selectedServices.has(service.id) ? alpha(THEME_COLOR, 0.05) : 'white',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer',
                                                WebkitTapHighlightColor: 'transparent',
                                                '&:hover': {
                                                    background: alpha(THEME_COLOR, 0.08),
                                                },
                                            }}
                                        >
                                            {/* 移动端：服务名称行（包含checkbox） */}
                                            <Box display="flex" alignItems="center" flex={1}>
                                                <Checkbox
                                                    checked={selectedServices.has(service.id)}
                                                    onChange={() => {}}
                                                    onClick={(e) => e.stopPropagation()}
                                                    size={isMobile ? 'small' : 'medium'}
                                                    sx={{
                                                        color: THEME_COLOR,
                                                        pointerEvents: 'none',
                                                        p: isMobile ? 0.5 : 1,
                                                        '&.Mui-checked': {
                                                            color: THEME_COLOR,
                                                        },
                                                    }}
                                                />
                                                <Box flex={1} ml={isMobile ? 0.5 : 1}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                                                        {service.name}
                                                    </Typography>
                                                    {service.categoryName && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                                                            {service.categoryName}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                            {/* 技能等级选择器 */}
                                            <Box
                                                sx={{
                                                    minWidth: isMobile ? 'auto' : 160,
                                                    mt: isMobile ? 1 : 0,
                                                    ml: isMobile ? 3.5 : 0,
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {selectedServices.has(service.id) ? (
                                                    <Select
                                                        size="small"
                                                        value={serviceExpertise[service.id]?.skillLevel || 'INTERMEDIATE'}
                                                        onChange={(e) => {
                                                            setServiceExpertise(prev => ({
                                                                ...prev,
                                                                [service.id]: {
                                                                    skillLevel: e.target.value
                                                                }
                                                            }));
                                                        }}
                                                        sx={{
                                                            width: isMobile ? '100%' : '100%',
                                                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                                                            '& .MuiSelect-select': {
                                                                py: isMobile ? 0.75 : 1,
                                                            },
                                                        }}
                                                    >
                                                        <MenuItem value="BEGINNER">
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getSkillLevelColor('BEGINNER') }} />
                                                                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{t('staff.skillLevels.beginner', 'Beginner')}</Typography>
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="INTERMEDIATE">
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getSkillLevelColor('INTERMEDIATE') }} />
                                                                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{t('staff.skillLevels.intermediate', 'Intermediate')}</Typography>
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="EXPERT">
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getSkillLevelColor('EXPERT') }} />
                                                                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{t('staff.skillLevels.expert', 'Expert')}</Typography>
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="MASTER">
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getSkillLevelColor('MASTER') }} />
                                                                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{t('staff.skillLevels.master', 'Master')}</Typography>
                                                            </Box>
                                                        </MenuItem>
                                                    </Select>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                                                        {t('staff.notSelected', 'Not selected')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                <Button
                    onClick={onClose}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 2,
                        color: '#666',
                        textTransform: 'none',
                        fontSize: '0.8125rem',
                    }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="small"
                    disabled={loading}
                    sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        bgcolor: THEME_COLOR,
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: THEME_COLOR_DARK,
                            boxShadow: 'none',
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={16} color="inherit" />
                    ) : (
                        staff ? t('common.update') : t('common.create')
                    )}
                </Button>
            </DialogActions>

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
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: isMobile ? '0.8rem' : undefined,
                        py: isMobile ? 0.5 : undefined,
                        '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default StaffDialog;