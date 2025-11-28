import React from 'react';
import { Box, Typography, Chip, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
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
    status?: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;
    resourceName?: string;
    avatar?: string;
    notes?: string;
    bookingSource?: 'ADMIN' | 'ONLINE' | 'GOOGLE' | string;
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
  // 彩色模式：通过不同颜色背景区分状态
  // 极简模式：通过不同边框样式区分状态（从深到浅，从完成到未开始）：
  // - COMPLETED: 最深色 #1a1a1a + 实线粗边框
  // - CHECKED_IN: 深灰 #444 + 虚线边框
  // - PENDING_CONFIRMATION: 中灰 #888 + 点线边框
  // - CONFIRMED: 浅灰 #aaa + 细实线边框
  const getStatusConfig = () => {
    if (appointment.status === 'COMPLETED' || appointment.paid) {
      // 完成状态 - 最深色，表示已完成
      const statusColor = isMonochrome ? '#1a1a1a' : '#4CAF50';
      return {
        label: t('customers.appointmentStatus.completed'),
        color: statusColor,
        lightColor: isMonochrome ? '#333' : '#66BB6A',
        bgColor: isMonochrome ? 'rgba(26,26,26,0.1)' : alpha(statusColor, 0.09),
        borderColor: isMonochrome ? 'rgba(26,26,26,0.4)' : alpha(statusColor, 0.3),
        borderStyle: 'solid',
        borderWidth: isMonochrome ? '2px' : '1px',
        icon: <CheckIcon sx={{ fontSize: 14 }} />,
      };
    }
    if (appointment.status === 'CHECKED_IN') {
      // 已签到状态 - 深灰色，极简模式用虚线边框表示进行中
      const statusColor = isMonochrome ? '#444' : '#FF9800';
      return {
        label: t('customers.appointmentStatus.checked_in'),
        color: statusColor,
        lightColor: isMonochrome ? '#555' : '#FFB74D',
        bgColor: isMonochrome ? 'rgba(68,68,68,0.08)' : alpha(statusColor, 0.09),
        borderColor: isMonochrome ? 'rgba(68,68,68,0.6)' : alpha(statusColor, 0.35),
        borderStyle: isMonochrome ? 'dashed' : 'solid',
        borderWidth: isMonochrome ? '2px' : '1px',
        icon: <PendingIcon sx={{ fontSize: 14 }} />,
      };
    }
    if (appointment.status === 'PENDING_CONFIRMATION') {
      // 待确认状态 - 中灰色，极简模式用点线边框表示等待确认
      const statusColor = isMonochrome ? '#888' : '#8B5CF6';
      return {
        label: t('customers.appointmentStatus.pending_confirmation'),
        color: statusColor,
        lightColor: isMonochrome ? '#999' : '#A78BFA',
        bgColor: isMonochrome ? 'rgba(136,136,136,0.06)' : alpha(statusColor, 0.12),
        borderColor: isMonochrome ? 'rgba(136,136,136,0.5)' : alpha(statusColor, 0.3),
        borderStyle: isMonochrome ? 'dotted' : 'solid',
        borderWidth: isMonochrome ? '2px' : '1px',
        icon: <PendingIcon sx={{ fontSize: 14 }} />,
      };
    }
    // 已确认状态 - 浅灰色 + 细实线边框，表示已确认等待服务
    const statusColor = isMonochrome ? '#aaa' : THEME_COLOR;
    return {
      label: t('customers.appointmentStatus.confirmed'),
      color: statusColor,
      lightColor: isMonochrome ? '#bbb' : '#42A5F5',
      bgColor: isMonochrome ? 'rgba(170,170,170,0.04)' : alpha(statusColor, 0.08),
      borderColor: isMonochrome ? 'rgba(170,170,170,0.3)' : alpha(statusColor, 0.2),
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
                width: 20,
                height: 20,
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
              <EditCalendarIcon sx={{ fontSize: 14 }} />
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* 编辑按钮 - 仅在CONFIRMED状态下显示 */}
            {onEdit && appointment.status === 'CONFIRMED' && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e);
                }}
                sx={{
                  width: 22,
                  height: 22,
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
                <EditCalendarIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}

            {/* 状态标签 - 缩放模式下不显示 */}
            {!compact && (
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  bgcolor: alpha(statusConfig.color, 0.1),
                  color: statusConfig.color,
                  border: 'none',
                  borderRadius: 1.5,
                  '& .MuiChip-label': {
                    px: '6px',
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
            )}
          </Box>
        </Box>

        {/* 客户名称 - 只在非缩放模式下显示 */}
        {!compact && (
          <Typography
            sx={{
              fontSize: '0.9375rem',
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