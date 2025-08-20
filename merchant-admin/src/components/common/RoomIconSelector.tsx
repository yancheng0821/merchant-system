import React, { useState } from 'react';
import {
    Box,
    Grid,
    Button,
    Typography,
    Tabs,
    Tab,
    alpha,
    Tooltip,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ImageUploader from './ImageUploader';
import { getFullImageUrl } from '../../services/api';

interface RoomIconSelectorProps {
    value?: string; // 当前选中的图标名称或图片URL
    onChange: (iconName: string | null) => void;
    size?: number;
}

// Emoji图标分类 - 与房间列表保持一致的风格
const iconCategories = {
    business: {
        label: 'roomIcons.categories.business',
        icons: [
            { emoji: '🏢', name: 'office', label: 'roomIcons.office' },
            { emoji: '🎤', name: 'vip', label: 'roomIcons.vip' },
            { emoji: '📋', name: 'meeting', label: 'roomIcons.meeting' },
            { emoji: '💼', name: 'conference', label: 'roomIcons.conference' },
            { emoji: '👥', name: 'group', label: 'roomIcons.group' },
        ]
    },
    beauty: {
        label: 'roomIcons.categories.beauty',
        icons: [
            { emoji: '💆', name: 'beauty', label: 'roomIcons.beauty' },
            { emoji: '🧘', name: 'spa', label: 'roomIcons.spa' },
            { emoji: '💅', name: 'nail', label: 'roomIcons.nail' },
            { emoji: '💄', name: 'makeup', label: 'roomIcons.makeup' },
            { emoji: '✂️', name: 'haircut', label: 'roomIcons.haircut' },
        ]
    },
    medical: {
        label: 'roomIcons.categories.medical',
        icons: [
            { emoji: '🩺', name: 'medical', label: 'roomIcons.medical' },
            { emoji: '🏥', name: 'hospital', label: 'roomIcons.hospital' },
            { emoji: '💊', name: 'pharmacy', label: 'roomIcons.pharmacy' },
            { emoji: '🦷', name: 'dental', label: 'roomIcons.dental' },
            { emoji: '👁️', name: 'eye', label: 'roomIcons.eye' },
        ]
    },
    fitness: {
        label: 'roomIcons.categories.fitness',
        icons: [
            { emoji: '🏋️', name: 'gym', label: 'roomIcons.gym' },
            { emoji: '🧘‍♀️', name: 'yoga', label: 'roomIcons.yoga' },
            { emoji: '🏃', name: 'running', label: 'roomIcons.running' },
            { emoji: '🚴', name: 'cycling', label: 'roomIcons.cycling' },
            { emoji: '🏊', name: 'swimming', label: 'roomIcons.swimming' },
        ]
    },
    dining: {
        label: 'roomIcons.categories.dining',
        icons: [
            { emoji: '🍽️', name: 'restaurant', label: 'roomIcons.restaurant' },
            { emoji: '☕', name: 'cafe', label: 'roomIcons.cafe' },
            { emoji: '🍷', name: 'bar', label: 'roomIcons.bar' },
            { emoji: '🍰', name: 'bakery', label: 'roomIcons.bakery' },
            { emoji: '🍕', name: 'pizza', label: 'roomIcons.pizza' },
        ]
    },
    entertainment: {
        label: 'roomIcons.categories.entertainment',
        icons: [
            { emoji: '🎮', name: 'gaming', label: 'roomIcons.gaming' },
            { emoji: '🎵', name: 'music', label: 'roomIcons.music' },
            { emoji: '📺', name: 'tv', label: 'roomIcons.tv' },
            { emoji: '🎬', name: 'cinema', label: 'roomIcons.cinema' },
            { emoji: '🎯', name: 'games', label: 'roomIcons.games' },
        ]
    },
    general: {
        label: 'roomIcons.categories.general',
        icons: [
            { emoji: '🏠', name: 'home', label: 'roomIcons.home' },
            { emoji: '🏪', name: 'store', label: 'roomIcons.store' },
            { emoji: '🏛️', name: 'building', label: 'roomIcons.building' },
            { emoji: '🚪', name: 'room', label: 'roomIcons.room' },
            { emoji: '📍', name: 'location', label: 'roomIcons.location' },
        ]
    }
};

const RoomIconSelector: React.FC<RoomIconSelectorProps> = ({
    value,
    onChange,
    size = 40,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(0);
    const [showUploader, setShowUploader] = useState(false);

    const categories = Object.entries(iconCategories);
    
    // 修复错误的路径和域名
    let fixedValue = value;
    if (value) {
        // 1. 如果是avatars路径，改为room-icons
        if (value.includes('/api/files/avatars/')) {
            fixedValue = value.replace('/api/files/avatars/', '/api/files/room-icons/');
        }
        
        // 2. 如果是完整URL但域名错误，修正它
        if (fixedValue && (fixedValue.startsWith('https://swiftmerchantplatform.com/api/') || 
                          fixedValue.startsWith('http://swiftmerchantplatform.com/api/'))) {
            // 提取路径部分
            const pathMatch = fixedValue.match(/https?:\/\/[^\/]+(\/.+)/);
            if (pathMatch) {
                fixedValue = pathMatch[1]; // 只保留路径部分，让getFullImageUrl处理域名
            }
        }
    }
    
    const isImageUrl = fixedValue && (fixedValue.startsWith('http') || fixedValue.startsWith('/api/') || fixedValue.startsWith('data:') || fixedValue.startsWith('blob:'));

    const handleIconSelect = (iconName: string) => {
        onChange(iconName);
        setShowUploader(false);
    };

    const handleImageUpload = (imageUrl: string | null) => {
        onChange(imageUrl);
        if (imageUrl) {
            setShowUploader(false);
        }
    };

    const renderEmojiButton = (iconData: any, isSelected: boolean) => {
        return (
            <Tooltip key={iconData.name} title={t(iconData.label)} arrow>
                <Button
                    onClick={() => handleIconSelect(iconData.emoji)}
                    variant="outlined"
                    sx={{
                        width: size + 16,
                        height: size + 16,
                        minWidth: 'auto',
                        border: `2px solid ${isSelected ? '#2563EB' : alpha('#2563EB', 0.2)}`,
                        borderRadius: 2,
                        bgcolor: isSelected ? alpha('#2563EB', 0.1) : 'transparent',
                        fontSize: size * 0.6,
                        '&:hover': {
                            bgcolor: alpha('#2563EB', 0.08),
                            borderColor: '#2563EB',
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                        p: 0,
                    }}
                >
                    {iconData.emoji}
                </Button>
            </Tooltip>
        );
    };

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {t('roomIcons.selectIcon')}
            </Typography>

            {/* Tab切换 */}
            <Tabs
                value={showUploader ? categories.length : activeTab}
                onChange={(_, newValue) => {
                    if (newValue === categories.length) {
                        setShowUploader(true);
                    } else {
                        setActiveTab(newValue);
                        setShowUploader(false);
                    }
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    mb: 2,
                    '& .MuiTab-root': {
                        minWidth: 'auto',
                        px: 2,
                        fontSize: '0.75rem',
                        '&.Mui-selected': {
                            color: '#2563EB',
                        }
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#2563EB',
                    }
                }}
            >
                {categories.map(([key, category], index) => (
                    <Tab key={key} label={t(category.label)} />
                ))}
                <Tab 
                    icon={<UploadIcon sx={{ fontSize: 16 }} />} 
                    label={t('roomIcons.uploadCustom')}
                    iconPosition="start"
                />
            </Tabs>

            {/* 内容区域 */}
            <Box
                sx={{
                    minHeight: 120,
                    p: 2,
                    border: `1px solid ${alpha('#2563EB', 0.2)}`,
                    borderRadius: 2,
                    bgcolor: alpha('#2563EB', 0.02),
                }}
            >
                {showUploader ? (
                    <Box>
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                            <ImageUploader
                                value={isImageUrl ? fixedValue : undefined}
                                onChange={handleImageUpload}
                                variant="rectangle"
                                size={120}
                                placeholder={t('roomIcons.uploadPlaceholder')}
                                uploadType="room-icon"
                            />
                        </Box>
                        {isImageUrl && value && (
                            <Box mt={2} display="flex" justifyContent="center">
                                <Typography variant="caption" color="text.secondary">
                                    {t('roomIcons.uploadSuccess')}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Grid container spacing={1}>
                        {categories[activeTab] && categories[activeTab][1] && categories[activeTab][1].icons ? (
                            categories[activeTab][1].icons.map((iconData) => {
                                const isSelected = fixedValue === iconData.emoji;
                                return (
                                    <Grid item key={iconData.name}>
                                        {renderEmojiButton(iconData, isSelected)}
                                    </Grid>
                                );
                            })
                        ) : null}
                    </Grid>
                )}
            </Box>

            {/* 当前选择显示 */}
            {fixedValue && (
                <Box mt={2} p={2} sx={{ 
                    bgcolor: alpha('#2563EB', 0.03), 
                    borderRadius: 2,
                    border: `1px solid ${alpha('#2563EB', 0.1)}`
                }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {t('roomIcons.currentSelection')}:
                        </Typography>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                border: `2px solid ${alpha('#2563EB', 0.3)}`,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            {isImageUrl ? (
                                <img 
                                    src={getFullImageUrl(fixedValue)} 
                                    alt="Selected Icon" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                    }} 
                                />
                            ) : (
                                <Typography sx={{ fontSize: 24 }}>
                                    {fixedValue || '🏠'}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default RoomIconSelector;