import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

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
  moduleColor?: string; // 模块主题色
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
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);

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
    // 如果提供了模块色，优先使用模块色
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

  const typeColor = getTypeColor();

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
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }
      }}
      BackdropProps={{
        sx: {
          position: isFullscreen ? 'absolute' : 'fixed',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 600, color: typeColor }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        {showCancel && (
          <Button
            onClick={onClose}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
          >
            {cancelText || t('common.cancel')}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 3,
            backgroundColor: typeColor,
            '&:hover': {
              backgroundColor: typeColor,
              filter: 'brightness(0.9)',
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