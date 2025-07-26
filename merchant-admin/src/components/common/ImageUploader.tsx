import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Avatar,
    IconButton,
    Typography,
    Alert,
    CircularProgress,
    alpha,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ImageUploaderProps {
    value?: string; // 当前图片URL
    onChange: (imageUrl: string | null) => void;
    variant?: 'avatar' | 'rectangle'; // 显示样式
    size?: number; // 尺寸
    maxSize?: number; // 最大文件大小(MB)
    acceptedTypes?: string[]; // 接受的文件类型
    placeholder?: string; // 占位符文本
    disabled?: boolean;
    uploadType?: 'avatar' | 'room-icon'; // 上传类型
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    value,
    onChange,
    variant = 'avatar',
    size = 80,
    maxSize = 5,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    placeholder,
    disabled = false,
    uploadType = 'avatar',
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        // 验证文件类型
        if (!acceptedTypes.includes(file.type)) {
            setError(t('imageUploader.invalidFileType'));
            return;
        }

        // 验证文件大小
        if (file.size > maxSize * 1024 * 1024) {
            setError(t('imageUploader.fileTooLarge', { maxSize }));
            return;
        }

        try {
            setUploading(true);
            
            // 调用真实的上传API
            const imageUrl = await uploadFile(file);
            console.log('Upload successful, imageUrl:', imageUrl); // 调试日志
            onChange(imageUrl);
        } catch (err) {
            setError(t('imageUploader.uploadFailed'));
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    // 真实的文件上传
    const uploadFile = async (file: File): Promise<string> => {
        try {
            // 获取租户ID
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const tenantId = user.tenantId || 1;
            
            // 动态导入API
            const { fileUploadApi } = await import('../../services/api');
            
            // 根据上传类型选择对应的API
            if (uploadType === 'avatar') {
                return await fileUploadApi.uploadAvatar(file, tenantId);
            } else {
                return await fileUploadApi.uploadRoomIcon(file, tenantId);
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(t('imageUploader.uploadFailed'));
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDelete = async () => {
        if (value) {
            try {
                // 如果是服务器上的文件，调用删除API
                if (value.startsWith('http') || value.startsWith('/api/')) {
                    const { fileUploadApi } = await import('../../services/api');
                    await fileUploadApi.deleteFile(value);
                }
            } catch (error) {
                console.warn('Failed to delete file from server:', error);
                // 即使删除失败，也继续清除本地状态
            }
        }
        
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderAvatar = () => (
        <Box position="relative" display="inline-block">
            <Avatar
                src={value}
                sx={{
                    width: size,
                    height: size,
                    bgcolor: alpha('#DC2626', 0.1),
                    color: '#DC2626',
                    border: `2px dashed ${alpha('#DC2626', 0.3)}`,
                    cursor: disabled ? 'default' : 'pointer',
                    '&:hover': disabled ? {} : {
                        borderColor: '#DC2626',
                        bgcolor: alpha('#DC2626', 0.05),
                    },
                }}
                onClick={disabled ? undefined : handleUploadClick}
            >
                {uploading ? (
                    <CircularProgress size={size * 0.4} sx={{ color: '#DC2626' }} />
                ) : value ? null : (
                    <CameraIcon sx={{ fontSize: size * 0.4 }} />
                )}
            </Avatar>
            
            {value && !disabled && (
                <IconButton
                    size="small"
                    onClick={handleDelete}
                    sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: '#EF4444',
                        color: 'white',
                        width: 24,
                        height: 24,
                        '&:hover': {
                            bgcolor: '#DC2626',
                        },
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
            )}
        </Box>
    );

    const renderRectangle = () => (
        <Box
            sx={{
                width: size,
                height: size * 0.75,
                border: `2px dashed ${alpha('#DC2626', 0.3)}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                bgcolor: alpha('#DC2626', 0.02),
                backgroundImage: value ? `url(${value})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                '&:hover': disabled ? {} : {
                    borderColor: '#DC2626',
                    bgcolor: alpha('#DC2626', 0.05),
                },
            }}
            onClick={disabled ? undefined : handleUploadClick}
        >
            {uploading ? (
                <CircularProgress size={32} sx={{ color: '#DC2626' }} />
            ) : !value ? (
                <>
                    <UploadIcon sx={{ fontSize: 32, color: '#DC2626', mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        {placeholder || t('imageUploader.clickToUpload')}
                    </Typography>
                </>
            ) : (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        borderRadius: 1,
                        p: 0.5,
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        sx={{
                            color: 'white',
                            width: 20,
                            height: 20,
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                </Box>
            )}
        </Box>
    );

    return (
        <Box>
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={disabled}
            />
            
            {variant === 'avatar' ? renderAvatar() : renderRectangle()}
            
            {error && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>
                    {error}
                </Alert>
            )}
            
            {!disabled && (
                <Box mt={1}>
                    <Button
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={handleUploadClick}
                        disabled={uploading}
                        sx={{
                            color: '#DC2626',
                            '&:hover': {
                                bgcolor: alpha('#DC2626', 0.08),
                            },
                        }}
                    >
                        {uploading ? t('imageUploader.uploading') : t('imageUploader.selectImage')}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ImageUploader;