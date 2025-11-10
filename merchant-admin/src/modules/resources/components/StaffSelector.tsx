import React from 'react';
import { Box, Typography, Avatar, Chip, Tooltip, Badge } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Check as CheckIcon } from '@mui/icons-material';

interface StaffSelectorProps {
  staffList: Array<{
    id: number;
    name: string;
    role?: string;
    avatar?: string;
    color?: string;
  }>;
  selectedIds: number[];
  onToggle: (id: number) => void;
}

const StaffSelector: React.FC<StaffSelectorProps> = ({
  staffList,
  selectedIds,
  onToggle,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 2,
        bgcolor: '#FAFBFC',
        borderBottom: '1px solid #E5E7EB',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: 6,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: '#F3F4F6',
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: '#D1D5DB',
          borderRadius: 3,
          '&:hover': {
            bgcolor: '#9CA3AF',
          },
        },
      }}
    >
      {/* 全选/取消全选按钮 */}
      <Chip
        label={selectedIds.length === staffList.length ? 'Clear All' : 'Select All'}
        onClick={() => {
          if (selectedIds.length === staffList.length) {
            // 清空所有选择
            selectedIds.forEach(id => onToggle(id));
          } else {
            // 选择所有
            staffList.forEach(staff => {
              if (!selectedIds.includes(staff.id)) {
                onToggle(staff.id);
              }
            });
          }
        }}
        size="small"
        sx={{
          height: 40,
          borderRadius: '20px',
          px: 1,
          bgcolor: selectedIds.length > 0 ? '#1976D2' : 'white',
          color: selectedIds.length > 0 ? 'white' : '#374151',
          border: '1px solid',
          borderColor: selectedIds.length > 0 ? '#1976D2' : '#D1D5DB',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: selectedIds.length > 0 ? '#1565C0' : '#F9FAFB',
          },
        }}
      />

      {/* 分隔线 */}
      <Box
        sx={{
          width: 1,
          bgcolor: '#E5E7EB',
          my: 1,
        }}
      />

      {/* 员工列表 */}
      {staffList.map((staff) => {
        const isSelected = selectedIds.includes(staff.id);

        return (
          <Tooltip
            key={staff.id}
            title={
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                  {staff.name}
                </Typography>
                {staff.role && (
                  <Typography sx={{ fontSize: 11, opacity: 0.8 }}>
                    {staff.role}
                  </Typography>
                )}
              </Box>
            }
            arrow
            placement="bottom"
          >
            <Box
              onClick={() => onToggle(staff.id)}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                minWidth: 'fit-content',
                height: 40,
                borderRadius: '20px',
                bgcolor: isSelected ? alpha('#1976D2', 0.1) : 'white',
                border: '1px solid',
                borderColor: isSelected ? '#1976D2' : '#E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isSelected ? alpha('#1976D2', 0.15) : '#F9FAFB',
                  borderColor: isSelected ? '#1976D2' : '#9CA3AF',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                },
              }}
            >
              {/* 选中指示器 */}
              {isSelected && (
                <Badge
                  badgeContent={
                    <CheckIcon sx={{ fontSize: 10, color: 'white' }} />
                  }
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    '& .MuiBadge-badge': {
                      width: 16,
                      height: 16,
                      minWidth: 16,
                      bgcolor: '#1976D2',
                      border: '2px solid white',
                    },
                  }}
                />
              )}

              {/* 头像 */}
              <Avatar
                src={staff.avatar}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: staff.color || '#1976D2',
                  fontSize: 12,
                  fontWeight: 600,
                  border: isSelected ? '2px solid #1976D2' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Avatar>

              {/* 名称 */}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? '#1976D2' : '#374151',
                  whiteSpace: 'nowrap',
                }}
              >
                {staff.name}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default StaffSelector;