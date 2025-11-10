import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
  },
  {
    code: 'en-US',
    name: 'English',
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
        border: '1px solid rgba(255, 255, 255, 0.2)',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.2)',
        },
      };
    }
    return {
      color: '#6366F1',
      '&:hover': {
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
      },
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
          <LanguageIcon sx={{ fontSize: size === 'small' ? 18 : 20 }} />
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
              mt: 1,
              '& .MuiMenuItem-root': {
                py: 1,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
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
          >
            <ListItemText
              primary={language.name}
              primaryTypographyProps={{
                fontWeight: i18n.language === language.code ? 600 : 400,
                fontSize: '0.9rem',
                color: i18n.language === language.code ? '#6366F1' : 'text.primary'
              }}
            />
            {i18n.language === language.code && (
              <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>
                <CheckIcon sx={{
                  fontSize: 18,
                  color: '#6366F1'
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