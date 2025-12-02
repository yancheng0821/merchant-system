import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'support';
}

const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      if (type === 'support') {
        // Support page has static content
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const lang = i18n.language === 'zh-CN' ? 'zh' : 'en';
        const fileName = type === 'terms' ? 'terms-of-service' : 'privacy-policy';
        const response = await fetch(`/legal/${fileName}-${lang}.md`);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error(`Failed to load ${type}:`, error);
        setContent(t('common.loadError') || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [type, i18n.language, t]);

  const getTitle = () => {
    switch (type) {
      case 'privacy':
        return t('auth.privacyPolicy');
      case 'terms':
        return t('auth.termsOfService');
      case 'support':
        return t('support.title', 'Support');
      default:
        return '';
    }
  };

  const renderSupportContent = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Box
        component="img"
        src="/va.png"
        alt="VA Merchant"
        sx={{
          width: 80,
          height: 80,
          borderRadius: 2,
          mb: 3,
        }}
      />
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
        {t('support.needHelp', 'Need Help?')}
      </Typography>
      <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 500, mx: 'auto' }}>
        {t('support.description', 'Our support team is here to help you with any questions or issues you may have.')}
      </Typography>

      <Box
        sx={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          bgcolor: '#f8fafc',
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
          {t('support.emailUs', 'Email Us')}
        </Typography>
        <Typography
          component="a"
          href="mailto:support@vamerchant.app"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1a1a1a',
            textDecoration: 'none',
            '&:hover': {
              color: '#3B82F6',
              textDecoration: 'underline',
            },
          }}
        >
          support@vamerchant.app
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
          {t('support.responseTime', 'We typically respond within 24 hours')}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
                sx={{
                  color: '#666',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                {t('common.back', 'Back')}
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {getTitle()}
              </Typography>
            </Box>
            <LanguageSwitcher variant="default" size="small" />
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: isMobile ? 3 : 5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : type === 'support' ? (
          renderSupportContent()
        ) : (
          <Box
            sx={{
              '& h1': {
                fontSize: isMobile ? '1.75rem' : '2rem',
                fontWeight: 700,
                marginTop: 3,
                marginBottom: 2,
                color: '#1a1a1a',
              },
              '& h2': {
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 600,
                marginTop: 3,
                marginBottom: 1.5,
                color: '#1a1a1a',
              },
              '& h3': {
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: 600,
                marginTop: 2,
                marginBottom: 1,
                color: '#1a1a1a',
              },
              '& p': {
                fontSize: isMobile ? '0.875rem' : '1rem',
                marginBottom: 1.5,
                lineHeight: 1.7,
                color: '#444',
              },
              '& ul, & ol': {
                marginLeft: 2,
                marginBottom: 1.5,
              },
              '& li': {
                fontSize: isMobile ? '0.875rem' : '1rem',
                marginBottom: 0.75,
                lineHeight: 1.7,
                color: '#444',
              },
              '& strong': {
                fontWeight: 600,
                color: '#1a1a1a',
              },
              '& hr': {
                margin: '24px 0',
                border: 'none',
                borderTop: '1px solid rgba(0,0,0,0.08)',
              },
              '& code': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: '0.9em',
              },
              '& a': {
                color: '#3B82F6',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          py: 3,
          mt: 4,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
              © {new Date().getFullYear()} VAMerchant. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LegalPage;
