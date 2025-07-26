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
    const isImageUrl = value && (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:'));

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
                        border: `2px solid ${isSelected ? '#DC2626' : alpha('#DC2626', 0.2)}`,
                        borderRadius: 2,
                        bgcolor: isSelected ? alpha('#DC2626', 0.1) : 'transparent',
                        fontSize: size * 0.6,
                        '&:hover': {
                            bgcolor: alpha('#DC2626', 0.08),
                            borderColor: '#DC2626',
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
                value={showUploader ? -1 : activeTab}
                onChange={(_, newValue) => {
                    if (newValue === -1) {
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
                            color: '#DC2626',
                        }
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#DC2626',
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
                    border: `1px solid ${alpha('#DC2626', 0.2)}`,
                    borderRadius: 2,
                    bgcolor: alpha('#DC2626', 0.02),
                }}
            >
                {showUploader ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={80}>
                        <ImageUploader
                            value={isImageUrl ? value : undefined}
                            onChange={handleImageUpload}
                            variant="rectangle"
                            size={80}
                            placeholder={t('roomIcons.uploadPlaceholder')}
                            uploadType="room-icon"
                        />
                    </Box>
                ) : (
                    <Grid container spacing={1}>
                        {categories[activeTab][1].icons.map((iconData) => {
                            const isSelected = value === iconData.emoji;
                            return (
                                <Grid item key={iconData.name}>
                                    {renderEmojiButton(iconData, isSelected)}
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Box>

            {/* 当前选择显示 */}
            {value && (
                <Box mt={2} display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                        {t('roomIcons.currentSelection')}:
                    </Typography>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            border: `1px solid ${alpha('#DC2626', 0.3)}`,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha('#DC2626', 0.05),
                        }}
                    >
                        {isImageUrl ? (
                            <img 
                                src={value} 
                                alt="Selected" 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                }} 
                            />
                        ) : (
                            <Typography sx={{ fontSize: 20 }}>
                                {value || '🏠'}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default RoomIconSelector;