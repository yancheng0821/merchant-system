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
import { getFullImageUrl } from '../../services/api';

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

            // 根据上传类型选择对应的API
            if (uploadType === 'avatar') {
                // 头像上传使用 userApi
                const { userApi } = await import('../../services/api');
                const response = await userApi.uploadAvatar(file);
                if (response.success && response.data) {
                    return response.data.avatarUrl;
                }
                throw new Error(response.message || 'Upload failed');
            } else {
                // 房间图标上传使用 fileUploadApi
                const { fileUploadApi } = await import('../../services/api');
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
            // 注意：文件删除功能已移除，仅清除本地状态
            // 如需实现文件删除，请在后端添加相应接口
            console.info('File deletion skipped - clearing local state only');
        }
        
        onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderAvatar = () => (
        <Box position="relative" display="inline-block">
            <Avatar
                src={getFullImageUrl(value)}
                sx={{
                    width: size,
                    height: size,
                    bgcolor: alpha('#2563EB', 0.1),
                    color: '#2563EB',
                    border: `2px dashed ${alpha('#2563EB', 0.3)}`,
                    cursor: disabled ? 'default' : 'pointer',
                    '&:hover': disabled ? {} : {
                        borderColor: '#2563EB',
                        bgcolor: alpha('#2563EB', 0.05),
                    },
                }}
                onClick={disabled ? undefined : handleUploadClick}
            >
                {uploading ? (
                    <CircularProgress size={size * 0.4} sx={{ color: '#2563EB' }} />
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
                            bgcolor: '#2563EB',
                        },
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
            )}
        </Box>
    );

    const renderRectangle = () => (
        <Box position="relative">
            <Box
                sx={{
                    width: size,
                    height: size,
                    border: `2px dashed ${alpha('#2563EB', 0.3)}`,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: disabled ? 'default' : 'pointer',
                    bgcolor: value ? 'white' : alpha('#2563EB', 0.02),
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': disabled ? {} : {
                        borderColor: '#2563EB',
                        bgcolor: value ? 'white' : alpha('#2563EB', 0.05),
                    },
                }}
                onClick={disabled ? undefined : handleUploadClick}
            >
                {uploading ? (
                    <CircularProgress size={32} sx={{ color: '#2563EB' }} />
                ) : value ? (
                    <img 
                        src={getFullImageUrl(value)} 
                        alt="Uploaded" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                        }} 
                    />
                ) : (
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                        <UploadIcon sx={{ fontSize: 28, color: '#2563EB', mb: 0.5 }} />
                        <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                                display: 'block',
                                fontSize: '0.7rem',
                                lineHeight: 1.2,
                            }}
                        >
                            {placeholder || t('imageUploader.clickToUpload')}
                        </Typography>
                    </Box>
                )}
            </Box>
            
            {value && !disabled && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                    }}
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
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
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
                            color: '#2563EB',
                            '&:hover': {
                                bgcolor: alpha('#2563EB', 0.08),
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