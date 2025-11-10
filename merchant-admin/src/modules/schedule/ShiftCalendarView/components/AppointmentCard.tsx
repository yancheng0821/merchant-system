import React from 'react';
import { Box, Typography, Chip, Avatar, Stack, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocalOffer as PriceIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  AttachMoney as MoneyIcon,
  Circle as DotIcon,
  Edit as EditIcon,
  MoreHoriz as MoreIcon,
  EventAvailable as EventAvailableIcon,
  EditCalendar as EditCalendarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface AppointmentCardProps {
  appointment: {
    id: number;
    startTime: string;
    endTime: string;
    customerName: string;
    serviceName: string;
    price: number;
    paid?: boolean;
    status?: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;
    resourceName?: string;
    avatar?: string;
    notes?: string;
  };
  color?: string;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  variant?: 'day' | 'week';
  compact?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  color = '#4F46E5',
  onClick,
  onEdit,
  variant = 'day',
  compact = false,
}) => {
  const { t } = useTranslation();

  // 状态配置 - 使用系统统一的配色方案
  const getStatusConfig = () => {
    if (appointment.status === 'COMPLETED' || appointment.paid) {
      // 完成状态 - 绿色系（柔和背景）
      return {
        label: t('customers.appointmentStatus.completed'),
        color: '#4CAF50',
        lightColor: '#66BB6A',
        bgColor: alpha('#4CAF50', 0.09), // 加深的绿色背景
        borderColor: alpha('#4CAF50', 0.2),
        icon: <CheckIcon sx={{ fontSize: 14 }} />,
      };
    }
    if (appointment.status === 'CHECKED_IN') {
      // 进行中状态 - 橙色系（柔和背景）
      return {
        label: t('customers.appointmentStatus.checked_in'),
        color: '#FF9800',
        lightColor: '#FFB74D',
        bgColor: alpha('#FF9800', 0.09), // 加深的橙色背景
        borderColor: alpha('#FF9800', 0.2),
        icon: <PendingIcon sx={{ fontSize: 14 }} />,
      };
    }
    // 已预约状态 - 蓝色系（柔和背景）
    return {
      label: t('customers.appointmentStatus.confirmed'),
      color: '#1976D2',
      lightColor: '#42A5F5',
      bgColor: alpha('#1976D2', 0.08), // 加深的蓝色背景
      borderColor: alpha('#1976D2', 0.15),
      icon: <TimeIcon sx={{ fontSize: 14 }} />,
    };
  };

  const statusConfig = getStatusConfig();

  // 紧凑模式（用于周视图）
  if (compact) {
    return (
      <Box
        onClick={onClick}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          bgcolor: statusConfig.bgColor,
          borderRadius: '6px',
          p: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: '1px solid',
          borderColor: statusConfig.borderColor,
          overflow: 'hidden',
          boxShadow: 'none',
          '&:hover': {
            borderColor: statusConfig.color,
            boxShadow: `0 2px 8px ${alpha(statusConfig.color, 0.15)}`,
            transform: 'translateY(-1px)',
            zIndex: 1,
          },
        }}
      >
        {/* 状态指示点 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: '2px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DotIcon
              sx={{
                fontSize: 6,
                color: statusConfig.color,
                animation: appointment.status === 'CHECKED_IN' && !appointment.paid ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                }
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: statusConfig.color,
                lineHeight: 1,
              }}
            >
              {appointment.startTime.substring(0, 5)}
            </Typography>
          </Box>

          {/* 编辑按钮 - 紧凑模式，仅在CONFIRMED状态下显示 */}
          {onEdit && appointment.status === 'CONFIRMED' && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              sx={{
                width: 20,
                height: 20,
                p: 0,
                color: '#94a3b8',
                bgcolor: 'transparent',
                borderRadius: 0.75,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(statusConfig.color, 0.12),
                  color: statusConfig.color,
                },
              }}
            >
              <EditCalendarIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>

        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: '#111827',
            lineHeight: 1.2,
            mb: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {appointment.customerName}
        </Typography>

        <Typography
          sx={{
            fontSize: 11,
            color: '#6B7280',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'pre-line',
          }}
        >
          {appointment.serviceName.replace(/, /g, '\n')}
        </Typography>
      </Box>
    );
  }

  // 完整模式（用于日视图）
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: statusConfig.bgColor,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: statusConfig.borderColor,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: `0 4px 12px ${alpha(statusConfig.color, 0.12)}`,
          borderColor: statusConfig.color,
          transform: 'translateY(-2px)',
          zIndex: 2,
        },
      }}
    >
      {/* 主体内容 - 精简布局 */}
      <Box sx={{ p: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* 顶部行：时间和状态 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: statusConfig.color,
              letterSpacing: '0.01em',
            }}
          >
            {appointment.startTime.substring(0, 5)} - {appointment.endTime.substring(0, 5)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 编辑按钮 - 仅在CONFIRMED状态下显示 */}
            {onEdit && appointment.status === 'CONFIRMED' && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e);
                }}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0,
                  color: '#94a3b8',
                  bgcolor: 'transparent',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(statusConfig.color, 0.12),
                    color: statusConfig.color,
                  },
                }}
              >
                <EditCalendarIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}

            {/* 状态标签 - 移到右上角，所有状态都显示 */}
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.6875rem',
                fontWeight: 600,
                bgcolor: alpha(statusConfig.color, 0.1),
                color: statusConfig.color,
                border: 'none',
                borderRadius: 1.5,
                '& .MuiChip-label': {
                  px: '8px',
                  py: 0,
                },
                '& .MuiChip-icon': {
                  fontSize: 14,
                  color: statusConfig.color,
                  marginLeft: '6px',
                  marginRight: '-4px',
                },
              }}
            />
          </Box>
        </Box>

        {/* 客户名称 */}
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {appointment.customerName}
        </Typography>

        {/* 服务名称 */}
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: '#64748b',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'pre-line',
          }}
        >
          {appointment.serviceName.replace(/, /g, '\n')}
        </Typography>

        {/* 备注 */}
        {appointment.notes && (
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              Notes:
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontStyle: 'italic',
              }}
            >
              {appointment.notes}
            </Typography>
          </Box>
        )}

        {/* 价格标签 - 暂时隐藏 */}
        {/* <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            mt: '2px',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#10B981',
              letterSpacing: '0.01em',
            }}
          >
            ${appointment.price}
          </Typography>
        </Box> */}
      </Box>
    </Box>
  );
};

export default AppointmentCard;