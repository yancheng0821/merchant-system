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
import { useTheme } from '../../../../contexts/ThemeContext';

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
  cardHeight?: number; // 卡片实际高度（px）
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  color = '#4F46E5',
  onClick,
  onEdit,
  variant = 'day',
  compact = false,
  cardHeight = 100,
}) => {
  const { t } = useTranslation();
  const { themeMode } = useTheme();
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#3B82F6';

  // 根据卡片高度决定显示级别
  const isTiny = cardHeight < 50;      // 极短：只显示时间和客户名
  const isShort = cardHeight < 75;     // 短：显示时间、客户名、服务名（1行）
  const isMedium = cardHeight < 110;   // 中：显示时间、客户名、服务名（2行）
  const isTall = cardHeight >= 150;    // 高：可以显示3行以上
  // 长（>110px）：显示全部信息

  // 根据卡片高度动态计算服务名称的最大行数
  const getServiceLineClamp = () => {
    if (compact || isShort) return 1;
    if (isMedium) return 2;
    if (isTall) return 4; // 高卡片显示4行
    return 3; // 普通长卡片显示3行
  };

  // 状态配置 - 使用系统统一的配色方案（支持主题切换）
  // 极简模式下使用不同的视觉样式区分状态：
  // - COMPLETED: 深色 + 实线边框
  // - CHECKED_IN: 中灰 + 虚线边框（更明显区分）
  // - CONFIRMED: 浅灰 + 正常边框
  const getStatusConfig = () => {
    if (appointment.status === 'COMPLETED' || appointment.paid) {
      // 完成状态 - 绿色系（柔和背景）
      const statusColor = isMonochrome ? '#1a1a1a' : '#4CAF50';
      return {
        label: t('customers.appointmentStatus.completed'),
        color: statusColor,
        lightColor: isMonochrome ? '#333' : '#66BB6A',
        bgColor: isMonochrome ? 'rgba(26,26,26,0.08)' : alpha(statusColor, 0.09),
        borderColor: alpha(statusColor, 0.3),
        borderStyle: 'solid',
        borderWidth: '1px',
        icon: <CheckIcon sx={{ fontSize: 14 }} />,
      };
    }
    if (appointment.status === 'CHECKED_IN') {
      // 进行中状态 - 橙色系（柔和背景）
      const statusColor = isMonochrome ? '#555' : '#FF9800';
      return {
        label: t('customers.appointmentStatus.checked_in'),
        color: statusColor,
        lightColor: isMonochrome ? '#666' : '#FFB74D',
        bgColor: isMonochrome ? 'rgba(85,85,85,0.12)' : alpha(statusColor, 0.09),
        borderColor: isMonochrome ? 'rgba(85,85,85,0.5)' : alpha(statusColor, 0.35),
        borderStyle: isMonochrome ? 'dashed' : 'solid', // 极简模式用虚线边框区分
        borderWidth: isMonochrome ? '2px' : '1px', // 极简模式下加粗虚线
        icon: <PendingIcon sx={{ fontSize: 14 }} />,
      };
    }
    // 已预约状态 - 蓝色系（柔和背景）
    const statusColor = isMonochrome ? '#999' : THEME_COLOR;
    return {
      label: t('customers.appointmentStatus.confirmed'),
      color: statusColor,
      lightColor: isMonochrome ? '#aaa' : '#42A5F5',
      bgColor: isMonochrome ? 'rgba(153,153,153,0.06)' : alpha(statusColor, 0.08),
      borderColor: alpha(statusColor, 0.2),
      borderStyle: 'solid',
      borderWidth: '1px',
      icon: <TimeIcon sx={{ fontSize: 14 }} />,
    };
  };

  const statusConfig = getStatusConfig();

  // 紧凑模式（用于周视图）
  if (compact) {
    // 根据卡片高度调整padding和间距
    const compactPadding = cardHeight < 45 ? '2px' : '8px';
    const compactGap = cardHeight < 45 ? '0px' : '4px';

    // 动态计算服务名称可显示的行数
    // 计算逻辑：
    // - 第一行（时间+客户名）：约16-20px
    // - padding：上下各2-8px
    // - gap：0-4px
    // - 每行服务名称：fontSize(11) * lineHeight(1.2) ≈ 13.2px
    const calculateCompactServiceLines = () => {
      const paddingTotal = cardHeight < 45 ? 4 : 16; // 上下padding总和
      const firstLineHeight = cardHeight < 45 ? 12 : 14; // 第一行高度
      const gapHeight = cardHeight < 45 ? 0 : 4; // gap高度
      const serviceLineHeight = 13.2; // 11 * 1.2

      const availableHeight = cardHeight - paddingTotal - firstLineHeight - gapHeight;
      const maxLines = Math.floor(availableHeight / serviceLineHeight);

      // 至少显示1行，最多不超过10行
      return Math.max(1, Math.min(maxLines, 10));
    };

    const serviceLineClamp = calculateCompactServiceLines();

    return (
      <Box
        onClick={onClick}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          bgcolor: statusConfig.bgColor,
          borderRadius: '6px',
          p: compactPadding,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderWidth: statusConfig.borderWidth,
          borderStyle: statusConfig.borderStyle,
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
        {/* 第一行：时间 + 客户名 + 状态/编辑 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: compactGap,
            gap: 1,
          }}
        >
          {/* 左侧：时间 + 客户名 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: cardHeight < 45 ? '4px' : '6px', flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: statusConfig.color,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {appointment.startTime.substring(0, 5)}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {appointment.customerName}
            </Typography>
          </Box>

          {/* 右侧：仅编辑按钮 */}
          {onEdit && appointment.status === 'CONFIRMED' && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }}
              sx={{
                width: cardHeight < 45 ? 16 : 20,
                height: cardHeight < 45 ? 16 : 20,
                p: 0,
                color: '#94a3b8',
                bgcolor: 'transparent',
                borderRadius: 0.75,
                transition: 'all 0.2s ease',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: alpha(statusConfig.color, 0.12),
                  color: statusConfig.color,
                },
              }}
            >
              <EditCalendarIcon sx={{ fontSize: cardHeight < 45 ? 12 : 14 }} />
            </IconButton>
          )}
        </Box>

        <Typography
          sx={{
            fontSize: 11,
            color: '#6B7280',
            lineHeight: cardHeight < 45 ? 1.1 : 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: serviceLineClamp,
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
  // 动态调整padding和gap
  const cardPadding = compact ? '8px' : (isTiny ? '6px' : isShort ? '8px' : isMedium ? '8px' : '12px');
  const cardGap = compact ? '4px' : (isTiny ? '2px' : isShort ? '4px' : isMedium ? '4px' : '8px');

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: statusConfig.bgColor,
        borderRadius: compact || isTiny ? '6px' : '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderWidth: statusConfig.borderWidth,
        borderStyle: statusConfig.borderStyle,
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
      {/* 主体内容 - 根据高度调整布局 */}
      <Box sx={{ p: cardPadding, height: '100%', display: 'flex', flexDirection: 'column', gap: cardGap }}>
        {/* 顶部行：时间/客户名和状态 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          {/* 左侧：时间和客户名 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.75 : 0, flex: 1, minWidth: 0 }}>
            {/* 缩放模式：时间+客户名在同一行 */}
            {compact ? (
              <>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: statusConfig.color,
                    letterSpacing: '0.01em',
                    flexShrink: 0,
                  }}
                >
                  {appointment.startTime.substring(0, 5)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {appointment.customerName}
                </Typography>
              </>
            ) : (
              /* 正常模式：只显示时间 */
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: statusConfig.color,
                  letterSpacing: '0.01em',
                  lineHeight: 1.2,
                }}
              >
                {appointment.startTime.substring(0, 5)} - {appointment.endTime.substring(0, 5)}
              </Typography>
            )}
          </Box>

          {/* 右侧：编辑按钮和状态标签 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? '4px' : (isTiny ? '2px' : '6px'), flexShrink: 0 }}>
            {/* 编辑按钮 - 仅在CONFIRMED状态下显示 */}
            {onEdit && appointment.status === 'CONFIRMED' && !isTiny && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e);
                }}
                sx={{
                  width: compact || isShort || isMedium ? 20 : 24,
                  height: compact || isShort || isMedium ? 20 : 24,
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
                <EditCalendarIcon sx={{ fontSize: compact || isShort || isMedium ? 14 : 16 }} />
              </IconButton>
            )}

            {/* 状态标签 - 缩放模式下不显示 */}
            {!compact && (
              isTiny ? (
                // 极短卡片只显示状态点
                <DotIcon
                  sx={{
                    fontSize: 8,
                    color: statusConfig.color,
                  }}
                />
              ) : (
                <Chip
                  icon={!isShort && !isMedium ? statusConfig.icon : undefined}
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    height: isShort || isMedium ? 18 : 22,
                    fontSize: isShort || isMedium ? '0.625rem' : '0.6875rem',
                    fontWeight: 600,
                    bgcolor: alpha(statusConfig.color, 0.1),
                    color: statusConfig.color,
                    border: 'none',
                    borderRadius: 1.5,
                    '& .MuiChip-label': {
                      px: isShort || isMedium ? '6px' : '8px',
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
              )
            )}
          </Box>
        </Box>

        {/* 客户名称 - 只在非缩放模式下显示 */}
        {!compact && (
          <Typography
            sx={{
              fontSize: isShort || isMedium ? '0.875rem' : '0.9375rem',
              fontWeight: 600,
              color: '#0f172a',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {appointment.customerName}
          </Typography>
        )}

        {/* 服务名称 - 缩放模式下始终显示，否则根据高度决定 */}
        {(compact || !isTiny) && (
          <Typography
            sx={{
              fontSize: compact || isShort ? '0.6875rem' : '0.8125rem',
              color: '#64748b',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: getServiceLineClamp(),
              WebkitBoxOrient: 'vertical',
              whiteSpace: 'pre-line',
            }}
          >
            {appointment.serviceName.replace(/, /g, '\n')}
          </Typography>
        )}

        {/* 备注 - 只在非缩放模式且高度充足时显示 */}
        {!compact && !isTiny && !isShort && !isMedium && appointment.notes && (
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