import React, { useState, useEffect, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Room as RoomIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getFullImageUrl } from '../../services/api';
import { Resource, resourceApi } from '../../services/api';

interface ResourceSelectorProps {
  tenantId: number;
  serviceId?: number;
  resourceType?: 'STAFF' | 'ROOM' | 'BOTH';
  selectedResourceId?: number;
  onResourceSelect: (resource: Resource | null) => void;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  disabled?: boolean;
  showAvailability?: boolean;
  variant?: 'dropdown' | 'cards';
}

const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  tenantId,
  serviceId,
  resourceType = 'STAFF',
  selectedResourceId,
  onResourceSelect,
  appointmentDate,
  appointmentTime,
  duration = 60,
  disabled = false,
  showAvailability = false,
  variant = 'dropdown',
}) => {
  const { t } = useTranslation();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<{ [key: number]: boolean }>({});

  // 获取资源列表
  useEffect(() => {
    const loadResources = async () => {
      if (!tenantId) return;

      setLoading(true);
      setError(null);

      try {
        let resourceList: Resource[] = [];

        if (serviceId) {
          // 根据服务获取可用资源
          resourceList = await resourceApi.getAvailableResourcesByService(serviceId, tenantId);
        } else if (resourceType && resourceType !== 'BOTH') {
          // 根据类型获取资源
          resourceList = await resourceApi.getResourcesByType(tenantId, resourceType);
        } else {
          // 获取所有资源
          resourceList = await resourceApi.getAllResources(tenantId);
          if (resourceType === 'BOTH') {
            // 如果是BOTH，显示所有类型
          } else {
            resourceList = resourceList.filter(r => r.type === resourceType);
          }
        }

        setResources(resourceList);
      } catch (err: any) {
        console.error('Failed to load resources:', err);
        setError(t('resources.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [tenantId, serviceId, resourceType, t]);

  // 检查资源可用性
  useEffect(() => {
    const checkAvailability = async () => {
      if (!showAvailability || !appointmentDate || !appointmentTime || resources.length === 0) {
        return;
      }

      const endTime = calculateEndTime(appointmentTime, duration);
      const availabilityPromises = resources.map(async (resource) => {
        try {
          const available = await resourceApi.checkResourceAvailability(
            resource.id,
            appointmentDate,
            appointmentTime,
            endTime
          );
          return { resourceId: resource.id, available };
        } catch (error) {
          console.error(`Failed to check availability for resource ${resource.id}:`, error);
          return { resourceId: resource.id, available: false };
        }
      });

      const results = await Promise.all(availabilityPromises);
      const statusMap: { [key: number]: boolean } = {};
      results.forEach(({ resourceId, available }) => {
        statusMap[resourceId] = available;
      });

      setAvailabilityStatus(statusMap);
    };

    checkAvailability();
  }, [resources, appointmentDate, appointmentTime, duration, showAvailability]);

  // 计算结束时间
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // 获取资源图标
  const getResourceIcon = (resource: any) => {
    if (resource.type === 'STAFF') {
      if (resource.avatar) {
        return (
          <img 
            src={resource.avatar} 
            alt={resource.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '50%'
            }} 
          />
        );
      }
      return resource.name ? resource.name.charAt(0).toUpperCase() : <PersonIcon />;
    } else {
      if (resource.icon) {
        const isImageUrl = resource.icon.startsWith('http') || resource.icon.startsWith('/api/') || resource.icon.startsWith('data:') || resource.icon.startsWith('blob:');
        if (isImageUrl) {
          return (
            <img 
              src={getFullImageUrl(resource.icon)}
              alt={resource.name}
              style={{ 
                width: '16px', 
                height: '16px', 
                objectFit: 'cover',
                borderRadius: '2px'
              }} 
            />
          );
        }
        
        // 如果是emoji图标，直接显示
        if (!resource.icon.includes('/') && resource.icon.length <= 10) {
          return (
            <Typography sx={{ fontSize: 16, lineHeight: 1 }}>
              {resource.icon}
            </Typography>
          );
        }
      }
      return <RoomIcon />;
    }
  };

  // 获取资源状态颜色
  const getStatusColor = (resource: Resource) => {
    if (showAvailability && availabilityStatus.hasOwnProperty(resource.id)) {
      return availabilityStatus[resource.id] ? '#10B981' : '#EF4444';
    }
    return resource.status === 'ACTIVE' ? '#10B981' : '#6B7280';
  };

  // 获取资源状态文本
  const getStatusText = (resource: Resource) => {
    if (showAvailability && availabilityStatus.hasOwnProperty(resource.id)) {
      return availabilityStatus[resource.id] ? t('resources.available') : t('resources.unavailable');
    }
    return t(`resources.status.${resource.status.toLowerCase()}`);
  };

  // 过滤可用资源
  const availableResources = useMemo(() => {
    if (!showAvailability) return resources;
    return resources.filter(resource =>
      resource.status === 'ACTIVE' &&
      (!availabilityStatus.hasOwnProperty(resource.id) || availabilityStatus[resource.id])
    );
  }, [resources, availabilityStatus, showAvailability]);

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          {t('resources.loading')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  if (variant === 'cards') {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          {resourceType === 'STAFF' ? t('resources.selectStaff') :
            resourceType === 'ROOM' ? t('resources.selectRoom') :
              t('resources.selectResource')}
        </Typography>

        <Grid container spacing={2}>
          {availableResources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedResourceId === resource.id ? '2px solid #8B5CF6' : '1px solid #E5E7EB',
                  backgroundColor: selectedResourceId === resource.id ? 'rgba(139, 92, 246, 0.05)' : 'white',
                  '&:hover': {
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.02)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                onClick={() => onResourceSelect(resource)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: getStatusColor(resource), mr: 1, width: 32, height: 32 }}>
                      {getResourceIcon(resource)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {resource.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`resources.type.${resource.type.toLowerCase()}`)}
                      </Typography>
                    </Box>
                    {showAvailability && (
                      <Chip
                        size="small"
                        label={getStatusText(resource)}
                        sx={{
                          backgroundColor: `${getStatusColor(resource)}20`,
                          color: getStatusColor(resource),
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  {resource.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {resource.description}
                    </Typography>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    {resource.capacity && resource.capacity > 1 && (
                      <Typography variant="caption" color="text.secondary">
                        {t('resources.capacity')}: {resource.capacity}
                      </Typography>
                    )}
                    {resource.location && (
                      <Typography variant="caption" color="text.secondary">
                        {resource.location}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {availableResources.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {t('resources.noResourcesAvailable')}
          </Alert>
        )}
      </Box>
    );
  }

  // 下拉框模式
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>
        {resourceType === 'STAFF' ? t('resources.selectStaff') :
          resourceType === 'ROOM' ? t('resources.selectRoom') :
            t('resources.selectResource')}
      </InputLabel>
      <Select
        value={selectedResourceId || ''}
        label={resourceType === 'STAFF' ? t('resources.selectStaff') :
          resourceType === 'ROOM' ? t('resources.selectRoom') :
            t('resources.selectResource')}
        onChange={(e) => {
          const resourceId = e.target.value as number;
          const resource = resources.find(r => r.id === resourceId) || null;
          onResourceSelect(resource);
        }}
        sx={{
          borderRadius: 2,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8B5CF6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8B5CF6',
          },
        }}
      >
        {availableResources.map((resource) => (
          <MenuItem key={resource.id} value={resource.id}>
            <Box display="flex" alignItems="center" width="100%">
              <Avatar sx={{
                bgcolor: getStatusColor(resource),
                mr: 1,
                width: 24,
                height: 24,
                fontSize: '0.75rem'
              }}>
                {getResourceIcon(resource)}
              </Avatar>
              <Box flex={1}>
                <Typography variant="body2">{resource.name}</Typography>
                {resource.description && (
                  <Typography variant="caption" color="text.secondary">
                    {resource.description}
                  </Typography>
                )}
              </Box>
              {showAvailability && (
                <Chip
                  size="small"
                  label={getStatusText(resource)}
                  sx={{
                    backgroundColor: `${getStatusColor(resource)}20`,
                    color: getStatusColor(resource),
                    fontWeight: 600,
                    ml: 1,
                  }}
                />
              )}
              {resource.location && (
                <Tooltip title={resource.location}>
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>

      {availableResources.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {t('resources.noResourcesAvailable')}
        </Typography>
      )}
    </FormControl>
  );
};

export default ResourceSelector;