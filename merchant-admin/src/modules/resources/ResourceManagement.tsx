import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Person as PersonIcon,
    Room as RoomIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import StaffResourceManagement from './components/StaffResourceManagement';
import RoomResourceManagement from './components/RoomResourceManagement';

// 资源类型枚举
export type ResourceType = 'STAFF' | 'ROOM';

// 商户配置接口
interface MerchantConfig {
    merchantId: number;
    resourceTypes: ResourceType[];
}

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

    // 主题色
    const themeColor = '#DC2626';

    // 获取商户配置
    useEffect(() => {
        const fetchMerchantConfig = async () => {
            try {
                setLoading(true);
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const tenantId = user.tenantId || 1;

                // 从后端获取商户配置
                const { merchantConfigApi } = await import('../../services/api');
                const config = await merchantConfigApi.getMerchantConfig(tenantId);
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
    }, []);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 根据资源类型决定显示内容
    const renderContent = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress sx={{ color: themeColor }} />
                </Box>
            );
        }

        if (error) {
            return (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            );
        }

        if (!merchantConfig) {
            return (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    {t('resources.noConfig')}
                </Alert>
            );
        }

        const { resourceTypes } = merchantConfig;

        // 仅有员工资源
        if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
            return <StaffResourceManagement />;
        }

        // 仅有场地资源
        if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
            return <RoomResourceManagement />;
        }

        // 同时有员工和场地资源 - 显示Tab切换
        if (resourceTypes.includes('STAFF') && resourceTypes.includes('ROOM')) {
            return (
                <>
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
                            <Tab
                                icon={<PersonIcon />}
                                label={t('resources.staffManagement')}
                                iconPosition="start"
                            />
                            <Tab
                                icon={<RoomIcon />}
                                label={t('resources.roomManagement')}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Card>

                    <TabPanel value={tabValue} index={0}>
                        <StaffResourceManagement />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <RoomResourceManagement />
                    </TabPanel>
                </>
            );
        }

        return (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                {t('resources.noResourceTypes')}
            </Alert>
        );
    };

    // 获取页面标题
    const getPageTitle = () => {
        if (!merchantConfig) return t('resources.title');

        const { resourceTypes } = merchantConfig;

        if (resourceTypes.length === 1 && resourceTypes[0] === 'STAFF') {
            return t('resources.staffManagement');
        }

        if (resourceTypes.length === 1 && resourceTypes[0] === 'ROOM') {
            return t('resources.roomManagement');
        }

        return t('resources.title');
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
                            {t('resources.subtitle')}
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