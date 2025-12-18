import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemText,
  Tooltip,
  Fade,
  Typography,
  Box,
} from '@mui/material';
import {
  Check as CheckIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  variant?: 'default' | 'login' | 'compact';
  size?: 'small' | 'medium' | 'large';
}

interface Language {
  code: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en-US', nativeName: 'English' },
  { code: 'zh-CN', nativeName: '中文' },
  { code: 'ja-JP', nativeName: '日本語' },
  { code: 'ko-KR', nativeName: '한국어' },
  { code: 'es-ES', nativeName: 'Español' },
  { code: 'fr-FR', nativeName: 'Français' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
}) => {
  const { i18n, t } = useTranslation();
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

  const getButtonStyles = () => {
    if (variant === 'login') {
      return {
        color: '#888',
        background: 'transparent',
        borderRadius: 1.5,
        px: 1.5,
        py: 0.5,
        '&:hover': {
          color: '#555',
          background: 'rgba(0, 0, 0, 0.04)',
        },
      };
    }
    return {
      color: '#666',
      borderRadius: 1.5,
      px: 1.5,
      py: 0.5,
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        color: '#333',
      },
    };
  };

  return (
    <>
      <Tooltip title={t('common.language', 'Language')} arrow>
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            ...getButtonStyles(),
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {currentLanguage.nativeName}
          </Typography>
          <ArrowDownIcon sx={{ fontSize: 16, opacity: 0.6 }} />
        </Box>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        disableScrollLock={true}
        marginThreshold={16}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 140,
              mt: 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.06)',
              maxHeight: '80vh',
              overflowY: 'auto',
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
              py: 1,
              px: 2,
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' },
              },
            }}
          >
            <ListItemText
              primary={language.nativeName}
              primaryTypographyProps={{
                fontWeight: i18n.language === language.code ? 600 : 400,
                fontSize: '0.875rem',
                color: i18n.language === language.code ? '#1a1a1a' : '#333'
              }}
            />
            {i18n.language === language.code && (
              <CheckIcon sx={{ fontSize: 16, color: '#1a1a1a', ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
