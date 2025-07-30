import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  variant?: 'default' | 'login';
  size?: 'small' | 'medium' | 'large';
}

const languages = [
  {
    code: 'zh-CN',
    name: '中文',
    flag: '🇨🇳'
  },
  {
    code: 'en-US',
    name: 'English',
    flag: '🇨🇦'
  }
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  size = 'medium'
}) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const getIconButtonStyles = () => {
    if (variant === 'login') {
      return {
        color: 'white',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.2)',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1)',
        },
        transition: 'all 0.3s ease',
      };
    }
    return {
      color: '#6366F1',
      background: 'rgba(99, 102, 241, 0.08)',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      borderRadius: 2,
      '&:hover': {
        background: 'rgba(99, 102, 241, 0.12)',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
      },
      transition: 'all 0.3s ease',
    };
  };

  return (
    <>
      <Tooltip title="切换语言 / Switch Language" arrow>
        <IconButton
          onClick={handleClick}
          size={size}
          sx={getIconButtonStyles()}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: size === 'small' ? '1rem' : '1.2rem',
                fontWeight: 500
              }}
            >
              {currentLanguage.flag}
            </Typography>
            <LanguageIcon sx={{ fontSize: size === 'small' ? 18 : 20 }} />
          </Box>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 160,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              '& .MuiMenuItem-root': {
                borderRadius: 1.5,
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.08)',
                  transform: 'translateX(2px)',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
                  borderLeft: '3px solid #6366F1',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.08))',
                  },
                },
              },
            },
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={i18n.language === language.code}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1.5,
            }}
          >
            <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
              {language.flag}
            </Typography>
            <ListItemText
              primary={language.name}
              primaryTypographyProps={{
                fontWeight: i18n.language === language.code ? 600 : 500,
                fontSize: '0.95rem',
                color: i18n.language === language.code ? '#6366F1' : 'text.primary'
              }}
            />
            {i18n.language === language.code && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 'auto' }}>
                <CheckIcon sx={{
                  fontSize: 18,
                  color: '#6366F1',
                  filter: 'drop-shadow(0 1px 2px rgba(99, 102, 241, 0.3))'
                }} />
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;