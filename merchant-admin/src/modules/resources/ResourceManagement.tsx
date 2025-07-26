import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Tabs,
    Tab,
    Alert,
    Skeleton,
    Fade,
} from '@mui/material';
import {
    Person as PersonIcon,
    Room as RoomIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StaffResourceManagement from './components/StaffResourceManagement';
import RoomResourceManagement from './components/RoomResourceManagement';
import { configPreloader, MerchantConfig } from '../../utils/configPreloader';

// 资源类型枚举
export type ResourceType = 'STAFF' | 'ROOM';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`resource-tabpanel-${index}`}
            aria-labelledby={`resource-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

const ResourceManagement: React.FC = () => {
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
    
    // 立即检查缓存，避免初始loading状态
    const [initialConfig] = useState<MerchantConfig | null>(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const tenantId = user.tenantId || 1;
            return configPreloader.getCachedConfig(tenantId);
        } catch {
            return null;
        }
    });

    // 主题色
    const themeColor = '#DC2626';

    // 使用配置预加载器 - 零闪烁加载
    useEffect(() => {
        const fetchMerchantConfig = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const tenantId = user.tenantId || 1;

                // 如果已经有初始配置，直接使用
                if (initialConfig) {
                    setMerchantConfig(initialConfig);
                    setLoading(false);
                    
                    // 后台异步刷新配置
                    configPreloader.preloadConfig(tenantId).then(freshConfig => {
                        if (JSON.stringify(initialConfig) !== JSON.stringify(freshConfig)) {
                            setMerchantConfig(freshConfig);
                        }
                    }).catch(console.warn);
                    return;
                }

                // 如果没有初始配置，使用预加载器获取
                const config = await configPreloader.preloadConfig(tenantId);
                setMerchantConfig(config);
            } catch (err) {
                console.error('获取商户配置失败:', err);
                setError('获取商户配置失败');
                // 使用默认配置作为后备
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const defaultConfig: MerchantConfig = {
                    merchantId: user.tenantId || 1,
                    resourceTypes: ['STAFF'] // 默认只有员工
                };
                setMerchantConfig(defaultConfig);
            } finally {
                setLoading(false);
            }
        };

        fetchMerchantConfig();

        // 监听配置更新事件
        const handleConfigUpdate = (event: CustomEvent) => {
            const { tenantId: updatedTenantId, config } = event.detail;
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const currentTenantId = user.tenantId || 1;
            
            if (updatedTenantId === currentTenantId) {
                setMerchantConfig(config);
            }
        };

        window.addEventListener('merchantConfigUpdated', handleConfigUpdate as EventListener);

        return () => {
            window.removeEventListener('merchantConfigUpdated', handleConfigUpdate as EventListener);
        };
    }, []);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 根据资源类型决定显示内容
    const renderContent = () => {
        // 如果有初始配置或当前配置，立即渲染内容
        const currentConfig = merchantConfig || initialConfig;
        
        if (loading && !currentConfig) {
            // 智能骨架屏 - 根据缓存预测内容结构
            const renderSmartSkeleton = () => {
                try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const tenantId = user.tenantId || 1;
                    const cacheKey = `merchant_config_${tenantId}`;
                    const cachedConfig = localStorage.getItem(cacheKey);
                    
                    if (cachedConfig) {
                        const config = JSON.parse(cachedConfig);
                        const { resourceTypes } = config;
                        
                        // 如果缓存显示只有员工资源，直接渲染员工管理的骨架屏
                        if (resourceTypes?.length === 1 && resourceTypes[0] === 'STAFF') {
                            return (
                                <Box>
                                    {/* 员工管理专用骨架屏 */}
                                    <Card sx={{ mb: 3, borderRadius: 3, p: 3 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Skeleton variant="circular" width={48} height={48} />
                                                <Box>
                                                    <Skeleton variant="text" width={120} height={28} />
                                                    <Skeleton variant="text" width={80} height={20} />
                                                </Box>
                                            </Box>
                                            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
                                        </Box>
                                        <Box mb={3}>
                                            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 2 }} />
                                        </Box>
                                        <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
                                    </Card>
                                </Box>
                            );
                        }
                        
                        // 如果缓存显示只有房间资源，渲染房间管理的骨架屏
                        if (resourceTypes?.length === 1 && resourceTypes[0] === 'ROOM') {
                            return (
                                <Box>
                                    {/* 房间管理专用骨架屏 */}
                                    <Card sx={{ mb: 3, borderRadius: 3, p: 3 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Skeleton variant="circular" width={48} height={48} />
                                                <Box>
                                                    <Skeleton variant="text" width={120} height={28} />
                                                    <Skeleton variant="text" width={80} height={20} />
                                                </Box>
                                            </Box>
                                            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
                                        </Box>
                                        <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
                                    </Card>
                                </Box>
                            );
                        }
                        
                        // 如果有多种资源类型，渲染Tab骨架屏
                        if (resourceTypes?.length > 1) {
                            return (
                                <Box>
                                    <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ backgroundColor: '#f8fafc', p: 2 }}>
                                            <Box display="flex" gap={2}>
                                                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
                                                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
                                            </Box>
                                        </Box>
                                    </Card>
                                    <Card sx={{ borderRadius: 3, p: 3 }}>
                                        <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
                                    </Card>
                                </Box>
                            );
                        }
                    }
                } catch (e) {
                    // 缓存解析失败，使用默认骨架屏
                }
                
                // 默认通用骨架屏
                return (
                    <Box>
                        <Card sx={{ mb: 3, borderRadius: 3, p: 3 }}>
                            <Box display="flex" alignItems="center" gap={2} mb={3}>
                                <Skeleton variant="circular" width={48} height={48} />
                                <Box flex={1}>
                                    <Skeleton variant="text" width="60%" height={24} />
                                    <Skeleton variant="text" width="40%" height={16} />
                                </Box>
                            </Box>
                            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
                        </Card>
                    </Box>
                );
            };

            return renderSmartSkeleton();
        }

        if (error) {
            return (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            );
        }

        if (!currentConfig) {
            return (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    {t('resources.noConfig')}
                </Alert>
            );
        }

        const { resourceTypes } = currentConfig;

        // 统一DOM结构 - 完美解决闪烁问题
        const hasMultipleTypes = resourceTypes.length > 1;
        const hasStaff = resourceTypes.includes('STAFF');
        const hasRoom = resourceTypes.includes('ROOM');

        return (
            <Fade in={true} timeout={300}>
                <Box>
                    {/* 条件显示Tab栏 - 只有多种资源类型时才显示 */}
                    {hasMultipleTypes && (
                        <Card
                            sx={{
                                mb: 3,
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                            }}
                        >
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                sx={{
                                    backgroundColor: '#f8fafc',
                                    '& .MuiTab-root': {
                                        color: 'text.secondary',
                                        fontWeight: 500,
                                        py: 2,
                                        '&.Mui-selected': {
                                            color: themeColor,
                                            fontWeight: 600,
                                        }
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: themeColor,
                                        height: 3,
                                    }
                                }}
                            >
                                {hasStaff && (
                                    <Tab
                                        icon={<PersonIcon />}
                                        label={t('resources.staffManagement')}
                                        iconPosition="start"
                                    />
                                )}
                                {hasRoom && (
                                    <Tab
                                        icon={<RoomIcon />}
                                        label={t('resources.roomManagement')}
                                        iconPosition="start"
                                    />
                                )}
                            </Tabs>
                        </Card>
                    )}

                    {/* 内容区域 - 统一使用TabPanel结构 */}
                    {hasStaff && (
                        <TabPanel value={hasMultipleTypes ? tabValue : 0} index={0}>
                            <StaffResourceManagement />
                        </TabPanel>
                    )}
                    {hasRoom && (
                        <TabPanel value={hasMultipleTypes ? tabValue : 0} index={hasStaff ? 1 : 0}>
                            <RoomResourceManagement />
                        </TabPanel>
                    )}
                </Box>
            </Fade>
        );


    };

    // 智能预测页面标题 - 零闪烁
    const getPageTitle = () => {
        const currentConfig = merchantConfig || initialConfig;
        
        if (currentConfig) {
            const { resourceTypes } = currentConfig;

            if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
                return t('resources.staffManagement');
            }

            if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
                return t('resources.roomManagement');
            }

            return t('resources.title');
        }

        return t('resources.title');
    };

    // 智能预测页面副标题 - 零闪烁
    const getPageSubtitle = () => {
        const currentConfig = merchantConfig || initialConfig;
        
        if (currentConfig) {
            const { resourceTypes } = currentConfig;

            if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
                return t('staff.subtitle');
            }

            if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
                return t('resources.roomSubtitle');
            }

            return t('resources.subtitle');
        }

        return t('resources.subtitle');
    };

    return (
        <Box>
            {/* 页面标题 */}
            <Box mb={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(45deg, #DC2626, #EF4444)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1,
                            }}
                        >
                            {getPageTitle()}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {getPageSubtitle()}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 内容区域 */}
            {renderContent()}
        </Box>
    );
};

export default ResourceManagement;