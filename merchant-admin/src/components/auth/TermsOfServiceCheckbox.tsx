import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Link,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const loadContent = async (type: 'terms' | 'privacy') => {
    setLoading(true);
    try {
      const lang = i18n.language === 'zh-CN' ? 'zh' : 'en';
      const fileName = type === 'terms' ? 'terms-of-service' : 'privacy-policy';
      const response = await fetch(`/legal/${fileName}-${lang}.md`);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      setContent(t('auth.termsLoadError') || `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (e: React.MouseEvent, type: 'terms' | 'privacy') => {
    e.preventDefault();
    setModalType(type);
    setShowModal(true);
    await loadContent(type);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };


  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            sx={{
              color: error ? 'error.main' : 'inherit',
              '&.Mui-checked': {
                color: error ? 'error.main' : 'primary.main',
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
                color: error ? 'error.main' : 'primary.main',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {t('auth.termsOfService')}
            </Link>
            {' '}{t('auth.and')}{' '}
            <Link
              component="button"
              onClick={(e) => handleOpenModal(e, 'privacy')}
              sx={{
                color: error ? 'error.main' : 'primary.main',
                textDecoration: 'underline',
                cursor: 'pointer',
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
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {modalType === 'terms' ? t('auth.termsOfService') : t('auth.privacyPolicy')}
        </DialogTitle>
        <DialogContent dividers>
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
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="outlined">
            {t('common.close')}
          </Button>
          <Button
            onClick={() => {
              onChange(true);
              handleCloseModal();
            }}
            variant="contained"
          >
            {t('auth.acceptTerms')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TermsOfServiceCheckbox;
