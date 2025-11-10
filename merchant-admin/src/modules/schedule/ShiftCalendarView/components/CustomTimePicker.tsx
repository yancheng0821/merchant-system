import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Popover,
  Typography,
  alpha,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface CustomTimePickerProps {
  label: string;
  value: string; // Format: "HH:MM:SS"
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  themeColor?: string;
  minTime?: string; // Optional minimum time constraint
  maxTime?: string; // Optional maximum time constraint
  container?: HTMLElement | null; // For fullscreen mode support
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText = '',
  required = false,
  disabled = false,
  themeColor = '#1976D2',
  minTime,
  maxTime,
  container,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const minutesScrollRef = useRef<HTMLDivElement>(null);

  // Parse the time value
  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      setHours(parseInt(parts[0], 10));
      setMinutes(parseInt(parts[1], 10));
    }
  }, [value]);

  // Scroll to current minute when popover opens
  useEffect(() => {
    if (anchorEl && minutesScrollRef.current) {
      const minuteElement = minutesScrollRef.current.querySelector(`[data-minute="${minutes}"]`);
      if (minuteElement) {
        minuteElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [anchorEl, minutes]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const updateTime = (newHours: number, newMinutes: number) => {
    // Validate against min/max times
    const newTimeMinutes = newHours * 60 + newMinutes;

    if (minTime) {
      const [minH, minM] = minTime.split(':').map(Number);
      const minTimeMinutes = minH * 60 + minM;
      if (newTimeMinutes < minTimeMinutes) {
        return; // Don't update if below minimum
      }
    }

    if (maxTime) {
      const [maxH, maxM] = maxTime.split(':').map(Number);
      const maxTimeMinutes = maxH * 60 + maxM;
      if (newTimeMinutes > maxTimeMinutes) {
        return; // Don't update if above maximum
      }
    }

    setHours(newHours);
    setMinutes(newMinutes);
    onChange(`${formatTime(newHours, newMinutes)}:00`);
  };

  const handleHourClick = (hour: number) => {
    updateTime(hour, minutes);
  };

  const handleMinuteClick = (minute: number) => {
    updateTime(hours, minute);
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={formatTime(hours, minutes)}
        onClick={handleClick}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <TimeIcon sx={{ mr: 1, fontSize: 20, color: error ? 'error.main' : themeColor }} />
          ),
        }}
        InputLabelProps={{ shrink: true }}
        sx={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            cursor: disabled ? 'not-allowed' : 'pointer',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'error.main' : themeColor,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'error.main' : themeColor,
            },
          },
          '& .MuiOutlinedInput-input': {
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
          },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        container={container || undefined}
        disablePortal={!!container}
        sx={{
          zIndex: 10000, // Higher than Dialog's 9999
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(themeColor, 0.2)}`,
            border: `1px solid ${alpha(themeColor, 0.1)}`,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2.5, minWidth: 320 }}>
          {/* Header */}
          <Box
            sx={{
              mb: 2,
              pb: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: themeColor,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <TimeIcon sx={{ fontSize: 18 }} />
              {label}
            </Typography>
          </Box>

          {/* Selected Time Display */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(themeColor, 0.05),
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: themeColor,
                fontFamily: 'monospace',
              }}
            >
              {String(hours).padStart(2, '0')}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: themeColor,
              }}
            >
              :
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: themeColor,
                fontFamily: 'monospace',
              }}
            >
              {String(minutes).padStart(2, '0')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Hours Section */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mb: 1,
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Hour
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 0.5,
                  maxHeight: 200,
                  overflow: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: alpha(themeColor, 0.05),
                    borderRadius: 3,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(themeColor, 0.3),
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.5),
                    },
                  },
                }}
              >
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Box
                    key={hour}
                    onClick={() => handleHourClick(hour)}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: hours === hour ? 700 : 500,
                      bgcolor: hours === hour ? themeColor : 'transparent',
                      color: hours === hour ? 'white' : 'text.primary',
                      border: '1px solid',
                      borderColor: hours === hour ? themeColor : alpha(themeColor, 0.15),
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: hours === hour ? themeColor : alpha(themeColor, 0.1),
                        borderColor: themeColor,
                        transform: 'scale(1.08)',
                        boxShadow: `0 2px 8px ${alpha(themeColor, 0.2)}`,
                      },
                    }}
                  >
                    {String(hour).padStart(2, '0')}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Minutes Section */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mb: 1,
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Minute
              </Typography>
              <Box
                ref={minutesScrollRef}
                sx={{
                  maxHeight: 200,
                  overflow: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: alpha(themeColor, 0.05),
                    borderRadius: 3,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(themeColor, 0.3),
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.5),
                    },
                  },
                }}
              >
                {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                  <Box
                    key={minute}
                    data-minute={minute}
                    onClick={() => handleMinuteClick(minute)}
                    sx={{
                      p: 1.25,
                      mb: 0.5,
                      textAlign: 'center',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: minutes === minute ? 700 : 500,
                      bgcolor: minutes === minute ? themeColor : 'transparent',
                      color: minutes === minute ? 'white' : 'text.primary',
                      border: '1px solid',
                      borderColor: minutes === minute ? themeColor : alpha(themeColor, 0.15),
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: minutes === minute ? themeColor : alpha(themeColor, 0.1),
                        borderColor: themeColor,
                        transform: 'translateX(3px)',
                        boxShadow: `0 2px 8px ${alpha(themeColor, 0.2)}`,
                      },
                      // Highlight every 5 minutes
                      ...(minute % 5 === 0 && minutes !== minute && {
                        fontWeight: 600,
                        borderColor: alpha(themeColor, 0.25),
                      }),
                      // Highlight every 15 minutes even more
                      ...(minute % 15 === 0 && minutes !== minute && {
                        borderColor: alpha(themeColor, 0.35),
                        bgcolor: alpha(themeColor, 0.03),
                      }),
                    }}
                  >
                    {String(minute).padStart(2, '0')}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default CustomTimePicker;
