import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Room as RoomIcon,
  Group as BothIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export type ResourceType = 'STAFF' | 'ROOM' | 'BOTH';

interface ServiceResourceTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (resourceType: ResourceType) => void;
  currentResourceType?: ResourceType;
  serviceName: string;
  merchantResourceTypes: ResourceType[];
}

const ServiceResourceTypeDialog: React.FC<ServiceResourceTypeDialogProps> = ({
  open,
  onClose,
  onSave,
  currentResourceType,
  serviceName,
  merchantResourceTypes,
}) => {
  const { t } = useTranslation();
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>('STAFF');
  const [hasResources, setHasResources] = useState(true);

  // 主题色
  const themeColor = '#DC2626';

  useEffect(() => {
    if (open) {
      setSelectedResourceType(currentResourceType || 'STAFF');
      // 模拟检查是否有相关资源
      setHasResources(true);
    }
  }, [open, currentResourceType]);

  const handleSave = () => {
    if (!hasResources) {
      // 如果没有资源，可以引导用户去资源管理页面
      return;
    }
    onSave(selectedResourceType);
    onClose();
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'STAFF':
        return <PersonIcon sx={{ color: '#10B981' }} />;
      case 'ROOM':
        return <RoomIcon sx={{ color: '#F59E0B' }} />;
      case 'BOTH':
        return <BothIcon sx={{ color: '#8B5CF6' }} />;
      default:
        return <PersonIcon />;
    }
  };

  const getResourceTypeDescription = (type: ResourceType) => {
    switch (type) {
      case 'STAFF':
        return t('services.resourceTypes.staffDescription');
      case 'ROOM':
        return t('services.resourceTypes.roomDescription');
      case 'BOTH':
        return t('services.resourceTypes.bothDescription');
      default:
        return '';
    }
  };

  const getAvailableOptions = () => {
    const options: { value: ResourceType; label: string; description: string }[] = [];
    
    if (merchantResourceTypes.includes('STAFF')) {
      options.push({
        value: 'STAFF',
        label: t('services.resourceTypes.staff'),
        description: '此服务需要员工提供'
      });
    }
    
    if (merchantResourceTypes.includes('ROOM')) {
      options.push({
        value: 'ROOM',
        label: t('services.resourceTypes.room'),
        description: '此服务需要场地提供'
      });
    }
    
    if (merchantResourceTypes.includes('STAFF') && merchantResourceTypes.includes('ROOM')) {
      options.push({
        value: 'BOTH',
        label: t('services.resourceTypes.both'),
        description: '此服务需要员工和场地'
      });
    }
    
    return options;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${themeColor}, #EF4444)`,
          color: 'white',
          fontWeight: 600,
        }}
      >
        {t('services.setResourceType')}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          为服务 "{serviceName}" 设置资源类型
        </Typography>

        {!hasResources && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => {
                  // 跳转到资源管理页面
                  window.location.href = '/resources';
                }}
              >
                {t('services.goToResourceManagement')}
              </Button>
            }
          >
            {t('services.noResourcesWarning')}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('services.resourceType')}</InputLabel>
          <Select
            value={selectedResourceType}
            label={t('services.resourceType')}
            onChange={(e) => setSelectedResourceType(e.target.value as ResourceType)}
            disabled={!hasResources}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: themeColor,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: themeColor,
                },
              },
            }}
          >
            {getAvailableOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getResourceTypeIcon(option.value)}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 资源类型说明 */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            {getResourceTypeIcon(selectedResourceType)}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t(`services.resourceTypes.${selectedResourceType.toLowerCase()}`)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {getResourceTypeDescription(selectedResourceType)}
          </Typography>
        </Box>

        {/* 当前商户支持的资源类型 */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            当前商户支持的资源类型：
          </Typography>
          <Box display="flex" gap={1}>
            {merchantResourceTypes.map((type) => (
              <Chip
                key={type}
                icon={getResourceTypeIcon(type)}
                label={t(`services.resourceTypes.${type.toLowerCase()}`)}
                size="small"
                sx={{
                  backgroundColor: '#f1f5f9',
                  color: 'text.primary',
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 3,
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasResources}
          sx={{
            borderRadius: 2,
            px: 3,
            background: `linear-gradient(45deg, ${themeColor}, #EF4444)`,
            '&:hover': {
              background: `linear-gradient(45deg, #B91C1C, ${themeColor})`,
            },
          }}
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceResourceTypeDialog;