import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Link,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Capacitor } from '@capacitor/core';

// 检测是否是原生应用
const isNativeApp = Capacitor.isNativePlatform();

interface TermsOfServiceCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
}

const TermsOfServiceCheckbox: React.FC<TermsOfServiceCheckboxProps> = ({
  checked,
  onChange,
  error = false,
}) => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy'>('terms');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleOpenModal = async (e: React.MouseEvent, type: 'terms' | 'privacy') => {
    e.preventDefault();
    setModalType(type);
    setLoading(true);
    try {
      const lang = i18n.language === 'zh-CN' ? 'zh' : 'en';
      const fileName = type === 'terms' ? 'terms-of-service' : 'privacy-policy';
      const response = await fetch(`/legal/${fileName}-${lang}.md`);
      const text = await response.text();
      setContent(text);
      setShowModal(true);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      setContent(t('auth.termsLoadError') || `Failed to load ${type}`);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // 延迟清空content，避免关闭动画时显示空内容
    setTimeout(() => {
      setContent('');
    }, 200);
  };


  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            sx={{
              color: error ? 'error.main' : '#bbb',
              '&.Mui-checked': {
                color: error ? 'error.main' : '#1a1a1a',
              },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: error ? 'error.main' : 'text.secondary' }}>
            {t('auth.iAgreeToThe')}{' '}
            <Link
              component="button"
              onClick={(e) => handleOpenModal(e, 'terms')}
              sx={{
                color: error ? 'error.main' : '#1a1a1a',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {t('auth.termsOfService')}
            </Link>
            {' '}{t('auth.and')}{' '}
            <Link
              component="button"
              onClick={(e) => handleOpenModal(e, 'privacy')}
              sx={{
                color: error ? 'error.main' : '#1a1a1a',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {t('auth.privacyPolicy')}
            </Link>
          </Typography>
        }
      />

      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth={isNativeApp ? 'sm' : 'lg'}
        fullWidth
        scroll="paper"
        sx={isNativeApp ? {
          '& .MuiDialog-container': {
            alignItems: 'flex-start',
            pt: '60px',
          }
        } : undefined}
        PaperProps={{
          sx: {
            maxHeight: isNativeApp ? '70vh' : '85vh',
            m: isNativeApp ? 2 : 3,
            borderRadius: 3,
          }
        }}
      >
        <DialogContent sx={{ p: isNativeApp ? 2 : 4 }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              {t('common.loading')}...
            </Typography>
          ) : (
            <Box
              sx={{
                py: 2,
                '& h1': {
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginTop: 3,
                  marginBottom: 2,
                },
                '& h2': {
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginTop: 2.5,
                  marginBottom: 1.5,
                },
                '& h3': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  marginTop: 2,
                  marginBottom: 1,
                },
                '& p': {
                  fontSize: '0.875rem',
                  marginBottom: 1,
                  lineHeight: 1.6,
                },
                '& ul, & ol': {
                  marginLeft: 2,
                  marginBottom: 1,
                },
                '& li': {
                  fontSize: '0.875rem',
                  marginBottom: 0.5,
                  lineHeight: 1.6,
                },
                '& strong': {
                  fontWeight: 700,
                },
                '& hr': {
                  margin: '16px 0',
                  border: 'none',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                },
                '& code': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  padding: '2px 6px',
                  borderRadius: 1,
                  fontSize: '0.85em',
                },
                '& a': {
                  color: '#1a1a1a',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#666',
                  },
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            sx={{
              color: '#666',
              borderColor: '#d0d0d0',
              '&:hover': {
                borderColor: '#bbb',
                bgcolor: 'rgba(0,0,0,0.02)',
              },
            }}
          >
            {t('common.close')}
          </Button>
          <Button
            onClick={() => {
              onChange(true);
              handleCloseModal();
            }}
            variant="contained"
            sx={{
              bgcolor: '#1a1a1a',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#333',
                boxShadow: 'none',
              },
            }}
          >
            {t('auth.acceptTerms')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TermsOfServiceCheckbox;
