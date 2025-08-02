import React from 'react';
import { Tooltip, IconButton, alpha } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';

interface HelpTooltipProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  title, 
  placement = 'top',
  size = 'small'
}) => {
  return (
    <Tooltip 
      title={title} 
      placement={placement}
      arrow
      sx={{
        '& .MuiTooltip-tooltip': {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          fontSize: '0.75rem',
          maxWidth: 300,
          padding: '8px 12px',
          borderRadius: 2,
          lineHeight: 1.4,
        },
        '& .MuiTooltip-arrow': {
          color: 'rgba(0, 0, 0, 0.9)',
        },
      }}
    >
      <IconButton
        size={size}
        sx={{
          color: 'text.secondary',
          padding: '4px',
          minWidth: 'auto',
          minHeight: 'auto',
          borderRadius: '50%',
          '&:hover': {
            color: '#667eea',
            backgroundColor: alpha('#667eea', 0.08),
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <HelpIcon fontSize={size === 'small' ? 'small' : 'medium'} />
      </IconButton>
    </Tooltip>
  );
};

export default HelpTooltip;