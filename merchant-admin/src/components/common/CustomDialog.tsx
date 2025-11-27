import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  alpha,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  moduleColor?: string; // 模块主题色（colorful模式下使用）
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  message,
  type = 'info',
  showCancel = false,
  confirmText,
  cancelText,
  onConfirm,
  moduleColor,
}) => {
  const { t } = useTranslation();
  const { themeMode } = useTheme();
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);

  // 根据主题模式设置颜色
  const isMonochrome = themeMode === 'monochrome';
  const MONOCHROME_COLOR = '#1a1a1a';

  // Auto-detect fullscreen element and use it as container
  useEffect(() => {
    const checkFullscreen = () => {
      const fullscreenElement = document.fullscreenElement as HTMLElement | null;
      setFullscreenContainer(fullscreenElement);
    };

    // Check immediately when dialog opens or fullscreen changes
    checkFullscreen();

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', checkFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, [open]); // Re-check when dialog opens

  const getTypeColor = () => {
    // monochrome 模式下，success 和 info 使用深灰色
    if (isMonochrome && (type === 'success' || type === 'info')) {
      return MONOCHROME_COLOR;
    }

    // colorful 模式下，如果提供了模块色，优先使用模块色
    if (moduleColor && (type === 'success' || type === 'info')) {
      return moduleColor;
    }

    switch (type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const getTypeIcon = () => {
    const iconSx = { fontSize: 20 };
    switch (type) {
      case 'success':
        return <SuccessIcon sx={iconSx} />;
      case 'error':
        return <ErrorIcon sx={iconSx} />;
      case 'warning':
        return <WarningIcon sx={iconSx} />;
      default:
        return <InfoIcon sx={iconSx} />;
    }
  };

  const typeColor = getTypeColor();
  const hoverColor = isMonochrome ? '#333' : typeColor;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const isFullscreen = Boolean(fullscreenContainer);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      container={fullscreenContainer || document.body}
      sx={{
        // Ensure this dialog is always on top of all other components
        // Higher than PaymentDialog (10000) and AppointmentDialog (9999)
        zIndex: 10100,
        position: isFullscreen ? 'absolute' : 'fixed',
      }}
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minWidth: 320,
          maxWidth: 400,
        }
      }}
      BackdropProps={{
        sx: {
          position: isFullscreen ? 'absolute' : 'fixed',
        }
      }}
    >
      {/* 简约标题 */}
      <DialogTitle sx={{ p: 2.5, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: alpha(typeColor, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: typeColor,
          }}>
            {getTypeIcon()}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 2 }}>
        <Typography sx={{ color: '#666', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {showCancel && (
          <Button
            size="small"
            onClick={onClose}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#666',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            {cancelText || t('common.cancel')}
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          onClick={handleConfirm}
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            py: 0.75,
            fontSize: '0.8125rem',
            fontWeight: 500,
            bgcolor: typeColor,
            boxShadow: 'none',
            textTransform: 'none',
            '&:hover': {
              bgcolor: hoverColor,
              filter: isMonochrome ? 'none' : 'brightness(0.9)',
              boxShadow: 'none',
            },
          }}
        >
          {confirmText || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
