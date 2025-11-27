import React from 'react';
import { Box, Typography, Avatar, Chip, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Star as StarIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Circle as DotIcon,
} from '@mui/icons-material';
import { useTheme } from '../../../../contexts/ThemeContext';

interface StaffInfoCardProps {
  staff: {
    id: number;
    name: string;
    role: string;
    avatar?: string;
    color?: string;
  };
  appointmentCount: number;
  isSelected?: boolean;
  onClick?: () => void;
  utilization?: number; // 利用率百分比 (0-100)
  rating?: number; // 评分 (0-5)
  compact?: boolean; // 紧凑模式
  isUnavailable?: boolean; // 不可用状态（置灰）
  availabilityTime?: string; // 今日可用时间范围，如 "11:00-19:00"
  onAdjustAvailability?: () => void; // 点击调整可用性的回调
  hasTemporaryAdjustment?: boolean; // 是否有临时调整
  isWithinWorkingHours?: boolean; // 是否在工作时间内
}

const StaffInfoCard: React.FC<StaffInfoCardProps> = ({
  staff,
  appointmentCount,
  isSelected = false,
  onClick,
  utilization = 0,
  rating = 0,
  compact = false,
  isUnavailable = false,
  availabilityTime,
  onAdjustAvailability,
  hasTemporaryAdjustment = false,
  isWithinWorkingHours = true,
}) => {
  const { themeMode } = useTheme();
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#1976D2';

  // 根据利用率计算颜色
  const getUtilizationColor = (value: number) => {
    if (isMonochrome) {
      if (value < 30) return '#1a1a1a'; // 深黑 - 空闲
      if (value < 70) return '#4a4a4a'; // 中灰 - 适中
      return '#6a6a6a'; // 浅灰 - 繁忙
    }
    if (value < 30) return '#10B981'; // 绿色 - 空闲
    if (value < 70) return '#1976D2'; // 蓝色 - 适中
    return '#FF9800'; // 橙色 - 繁忙
  };

  const utilizationColor = getUtilizationColor(utilization);

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10, // 提高 z-index 确保在预约卡片之上
        height: compact ? 50 : 80,
        bgcolor: isUnavailable ? '#F9FAFB' : '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        cursor: onClick ? 'pointer' : 'not-allowed',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        filter: isUnavailable ? 'grayscale(0.3)' : 'none',
        '&:hover': onClick ? {
          bgcolor: isUnavailable ? '#F3F4F6' : '#F9FAFB',
          borderBottom: isUnavailable ? '1px solid #E5E7EB' : `2px solid ${THEME_COLOR}`,
        } : {},
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.75 : 2,
          px: compact ? 1 : 2,
          position: 'relative',
        }}
      >
        {/* 左侧状态指示条 */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: '60%',
            bgcolor: isSelected ? THEME_COLOR : 'transparent',
            borderRadius: '0 4px 4px 0',
            transition: 'all 0.2s ease',
          }}
        />

        {/* 头像区域 - 带状态环 */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={staff.avatar || undefined}
            sx={{
              width: compact ? 30 : 48,
              height: compact ? 30 : 48,
              border: compact ? '2px solid' : '3px solid',
              borderColor: isUnavailable ? '#D1D5DB' : (isSelected ? THEME_COLOR : 'white'),
              bgcolor: isMonochrome ? '#2a2a2a' : (staff.color || THEME_COLOR),
              color: 'white',
              fontSize: compact ? 11 : 18,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? `0 0 0 ${compact ? 2 : 4}px ${alpha(THEME_COLOR, 0.15)}` : 'none',
              opacity: isUnavailable ? 0.6 : 1,
            }}
            imgProps={{
              onError: (e: any) => {
                // 图片加载失败时隐藏 img 标签，显示首字母背景
                e.target.style.display = 'none';
              }
            }}
          >
            {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Avatar>

          {/* 在线状态指示器 - compact模式下使用更小尺寸，始终保持绿色 */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: compact ? 9 : 14,
              height: compact ? 9 : 14,
              bgcolor: isUnavailable ? '#9CA3AF' : (isWithinWorkingHours ? '#10B981' : '#6B7280'),
              border: compact ? '1.5px solid white' : '2px solid white',
              borderRadius: '50%',
              animation: (isUnavailable || !isWithinWorkingHours) ? 'none' : 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                '70%': { boxShadow: compact ? '0 0 0 4px rgba(16, 185, 129, 0)' : '0 0 0 6px rgba(16, 185, 129, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
              },
            }}
          />
        </Box>

        {/* 中间信息区域 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* 姓名 */}
          <Box sx={{ mb: compact ? 0 : 0.5 }}>
            <Typography
              sx={{
                fontSize: compact ? 12 : 15,
                fontWeight: 700,
                color: isUnavailable ? '#9CA3AF' : '#111827',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {staff.name}
            </Typography>

            {/* compact模式下的工作时间 - 精简版，显示用途 */}
            {compact && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 0.25,
                  gap: 1,
                }}
              >
                {availabilityTime && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.35,
                      opacity: 0.85,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <ScheduleIcon
                      sx={{
                        fontSize: 10,
                        color: hasTemporaryAdjustment ? THEME_COLOR : '#6B7280',
                        flexShrink: 0,
                        mt: 0.15,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 9,
                        fontWeight: 500,
                        color: hasTemporaryAdjustment ? THEME_COLOR : '#6B7280',
                        lineHeight: 1.2,
                        wordBreak: 'keep-all',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {availabilityTime}
                    </Typography>
                  </Box>
                )}

                {/* 预约数量 - 与工作时间对齐 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 14,
                    px: 0.5,
                    borderRadius: '3px',
                    background: `linear-gradient(135deg, ${alpha(THEME_COLOR, 0.12)} 0%, ${alpha(THEME_COLOR, 0.08)} 100%)`,
                    border: '1px solid',
                    borderColor: alpha(THEME_COLOR, 0.25),
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: THEME_COLOR,
                      lineHeight: 1,
                    }}
                  >
                    {appointmentCount}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* 底部指标条 - 非compact模式 */}
          {!compact && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {/* 评分 */}
                {rating > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 14, color: '#FFC107' }} />
                    <Typography sx={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>
                      {rating.toFixed(1)}
                    </Typography>
                  </Box>
                )}

                {/* 利用率进度条 */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={utilization}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: utilizationColor,
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: 10, color: '#6B7280', minWidth: 30 }}>
                    {utilization}%
                  </Typography>
                </Box>
              </Box>

              {/* 今日可用时间 */}
              {availabilityTime && onAdjustAvailability && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                    opacity: 0.8,
                  }}
                >
                  <ScheduleIcon
                    sx={{
                      fontSize: 12,
                      color: hasTemporaryAdjustment ? THEME_COLOR : '#6B7280',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: hasTemporaryAdjustment ? THEME_COLOR : '#6B7280',
                      lineHeight: 1,
                    }}
                  >
                    {availabilityTime}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* 右侧预约统计 - 非compact模式 */}
        {!compact && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {/* 预约数量 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${alpha(THEME_COLOR, 0.1)} 0%, ${alpha(THEME_COLOR, 0.05)} 100%)`,
                border: '1px solid',
                borderColor: alpha(THEME_COLOR, 0.2),
              }}
            >
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: THEME_COLOR,
                  lineHeight: 1,
                }}
              >
                {appointmentCount}
              </Typography>
            </Box>

            {/* 标签 */}
            <Typography
              sx={{
                fontSize: 9,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              Appts
            </Typography>
          </Box>
        )}

        {/* 趋势指示器 - 可选，仅在非compact模式显示 */}
        {!compact && utilization > 70 && (
          <Chip
            icon={<TrendingUpIcon />}
            label="Busy"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 60, // 移到预约统计左侧，避免重叠
              height: 20,
              fontSize: 10,
              bgcolor: alpha('#FF9800', 0.1),
              color: '#FF9800',
              border: 'none',
              '& .MuiChip-icon': {
                fontSize: 12,
                color: '#FF9800',
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default StaffInfoCard;