import React, { useState } from 'react';
import { Tooltip, IconButton, alpha, Box, Typography, Fade, Chip } from '@mui/material';
import { 
  HelpOutline as HelpIcon, 
  Info as InfoIcon, 
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon 
} from '@mui/icons-material';

interface HelpTooltipProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  variant?: 'help' | 'info' | 'tip' | 'warning';
  color?: 'primary' | 'secondary' | 'default' | 'warning';
  animated?: boolean;
  showIcon?: boolean;
  compact?: boolean; // 新增：紧凑模式，用于输入框内部
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  title, 
  placement = 'top',
  size = 'small',
  variant = 'help',
  color = 'default',
  animated = true,
  showIcon = false,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getColorConfig = () => {
    switch (color) {
      case 'primary':
        return {
          iconColor: '#667eea',
          hoverColor: '#5a6fd8',
          hoverBg: alpha('#667eea', 0.12),
          glowColor: alpha('#667eea', 0.3),
          tooltipBg: 'rgba(102, 126, 234, 0.95)',
        };
      case 'secondary':
        return {
          iconColor: '#764ba2',
          hoverColor: '#6a4190',
          hoverBg: alpha('#764ba2', 0.12),
          glowColor: alpha('#764ba2', 0.3),
          tooltipBg: 'rgba(118, 75, 162, 0.95)',
        };
      case 'warning':
        return {
          iconColor: '#f59e0b',
          hoverColor: '#d97706',
          hoverBg: alpha('#f59e0b', 0.12),
          glowColor: alpha('#f59e0b', 0.3),
          tooltipBg: 'rgba(245, 158, 11, 0.95)',
        };
      default:
        return {
          iconColor: '#6b7280',
          hoverColor: '#667eea',
          hoverBg: alpha('#667eea', 0.08),
          glowColor: alpha('#667eea', 0.2),
          tooltipBg: 'rgba(17, 24, 39, 0.95)',
        };
    }
  };

  const getIconComponent = () => {
    // 统一使用InfoIcon，不再根据variant改变图标
    return InfoIcon;
  };

  const colorConfig = getColorConfig();
  const IconComponent = getIconComponent();

  const getVariantLabel = () => {
    switch (variant) {
      case 'info':
        return '信息';
      case 'tip':
        return '提示';
      case 'warning':
        return '注意';
      default:
        return '帮助';
    }
  };

  return (
    <Tooltip 
      title={
        <Box sx={{ p: 0.5 }}>
          {showIcon && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={getVariantLabel()}
                size="small"
                sx={{
                  backgroundColor: alpha(colorConfig.tooltipBg, 0.3),
                  color: 'white',
                  fontSize: '0.75rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>
          )}
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              lineHeight: 1.5,
              fontWeight: 400,
              color: 'white',
              textAlign: 'left',
            }}
          >
            {title}
          </Typography>
        </Box>
      }
      placement={placement}
      arrow
      enterDelay={300}
      leaveDelay={200}
      sx={{
        '& .MuiTooltip-tooltip': {
          backgroundColor: colorConfig.tooltipBg,
          backdropFilter: 'blur(8px)',
          color: 'white',
          fontSize: '0.875rem',
          maxWidth: 320,
          padding: '12px 16px',
          borderRadius: '12px',
          lineHeight: 1.5,
          fontWeight: 400,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            zIndex: -1,
          },
        },
        '& .MuiTooltip-arrow': {
          color: colorConfig.tooltipBg,
          '&::before': {
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      }}
    >
      <IconButton
        size={size}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          color: colorConfig.iconColor,
          padding: compact ? '3px' : (size === 'small' ? '6px' : size === 'medium' ? '8px' : '10px'),
          minWidth: 'auto',
          minHeight: 'auto',
          width: compact ? '24px' : 'auto',
          height: compact ? '24px' : 'auto',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          fontSize: compact ? '1rem' : 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': animated && !compact ? {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colorConfig.glowColor} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%) scale(0)',
            transition: 'transform 0.3s ease',
            zIndex: -1,
          } : {},
          '&:hover': {
            color: colorConfig.hoverColor,
            backgroundColor: compact ? 'transparent' : colorConfig.hoverBg,
            border: compact ? '1px solid transparent' : `1px solid ${alpha(colorConfig.hoverColor, 0.2)}`,
            transform: compact ? 'scale(1.05)' : 'scale(1.1) translateY(-1px)',
            boxShadow: compact ? 'none' : `0 4px 12px ${alpha(colorConfig.hoverColor, 0.3)}`,
            '&::before': animated && !compact ? {
              transform: 'translate(-50%, -50%) scale(1.5)',
            } : {},
          },
          '&:active': {
            transform: compact ? 'scale(0.98)' : 'scale(0.95)',
            transition: 'all 0.1s ease',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: compact ? 'none' : `0 0 0 3px ${alpha(colorConfig.hoverColor, 0.2)}`,
          },
        }}
      >
        <Fade in={true} timeout={300}>
          <IconComponent 
            fontSize={compact ? 'large' : (size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large')} 
            sx={{
              filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
              transition: 'filter 0.3s ease',
              fontSize: compact ? '1.125rem' : 'inherit',
            }}
          />
        </Fade>
      </IconButton>
    </Tooltip>
  );
};

export default HelpTooltip;

// 演示组件 - 展示所有类型的HelpTooltip
export const HelpTooltipDemo: React.FC = () => {
  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">HelpTooltip 演示</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>默认帮助提示:</Typography>
        <HelpTooltip title="这是一个默认的帮助提示" />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>信息提示:</Typography>
        <HelpTooltip 
          title="这是一个信息提示，用于显示重要信息" 
          variant="info" 
          color="primary"
          showIcon={true}
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>技巧提示:</Typography>
        <HelpTooltip 
          title="这是一个技巧提示，用于提供有用的建议" 
          variant="tip" 
          color="secondary"
          showIcon={true}
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>警告提示:</Typography>
        <HelpTooltip 
          title="这是一个警告提示，用于提醒用户注意" 
          variant="warning" 
          color="warning"
          showIcon={true}
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography>不同尺寸:</Typography>
        <HelpTooltip title="小尺寸" size="small" />
        <HelpTooltip title="中尺寸" size="medium" />
        <HelpTooltip title="大尺寸" size="large" />
      </Box>
    </Box>
  );
};