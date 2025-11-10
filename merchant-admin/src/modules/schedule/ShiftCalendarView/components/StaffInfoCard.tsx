import React from 'react';
import { Box, Typography, Avatar, Chip, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Star as StarIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Circle as DotIcon,
} from '@mui/icons-material';

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
}

const StaffInfoCard: React.FC<StaffInfoCardProps> = ({
  staff,
  appointmentCount,
  isSelected = false,
  onClick,
  utilization = 0,
  rating = 0,
}) => {
  // 根据利用率计算颜色
  const getUtilizationColor = (value: number) => {
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
        height: 80,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        '&:hover': onClick ? {
          bgcolor: '#F9FAFB',
          borderBottom: '2px solid #1976D2',
        } : {},
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
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
            bgcolor: isSelected ? '#1976D2' : 'transparent',
            borderRadius: '0 4px 4px 0',
            transition: 'all 0.2s ease',
          }}
        />

        {/* 头像区域 - 带状态环 */}
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={staff.avatar}
            sx={{
              width: 48,
              height: 48,
              border: '2px solid',
              borderColor: isSelected ? '#1976D2' : '#E5E7EB',
              bgcolor: staff.color || '#1976D2',
              fontSize: 18,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? `0 0 0 4px ${alpha('#1976D2', 0.1)}` : 'none',
            }}
          >
            {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Avatar>

          {/* 在线状态指示器 */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              bgcolor: '#10B981',
              border: '2px solid white',
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                '70%': { boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
              },
            }}
          />
        </Box>

        {/* 中间信息区域 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* 姓名和角色 */}
          <Box sx={{ mb: 0.5 }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {staff.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: '#6B7280',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {staff.role}
            </Typography>
          </Box>

          {/* 底部指标条 */}
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
        </Box>

        {/* 右侧预约统计 */}
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
              background: `linear-gradient(135deg, ${alpha('#1976D2', 0.1)} 0%, ${alpha('#1976D2', 0.05)} 100%)`,
              border: '1px solid',
              borderColor: alpha('#1976D2', 0.2),
            }}
          >
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1976D2',
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

        {/* 趋势指示器 - 可选 */}
        {utilization > 70 && (
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