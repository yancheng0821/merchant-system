import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AppThemeProvider } from './contexts/ThemeContext';
import './i18n/config';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// 初始化 Capacitor 原生功能
const initializeCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // iOS: 使用 overlay 模式，通过 CSS 控制安全区域
      // Android: 不使用 overlay，状态栏有自己的空间
      const isIOS = Capacitor.getPlatform() === 'ios';

      if (isIOS) {
        // iOS: overlay 模式，让 CSS safe-area 生效
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Light }); // 深色图标
      } else {
        // Android: 不 overlay，状态栏有自己的空间
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        await StatusBar.setStyle({ style: Style.Light }); // 深色图标
      }
    } catch (error) {
      console.error('Failed to initialize StatusBar:', error);
    }
  }
};

// 在应用启动时初始化
initializeCapacitor();

// Suppress MetaMask and browser extension errors in React error overlay
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    if (
      errorString.includes('MetaMask') ||
      errorString.includes('chrome-extension') ||
      errorString.includes('moz-extension')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// 创建MUI主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      letterSpacing: '0.01em',
    },
    body2: {
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      autoHideDuration={3000}
      preventDuplicate
      style={{
        marginTop: '64px',
      }}
    >
      <AuthProvider>
        <WebSocketProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppThemeProvider>
              <App />
            </AppThemeProvider>
          </ThemeProvider>
        </WebSocketProvider>
      </AuthProvider>
    </SnackbarProvider>
  </React.StrictMode>
); // Build: Mon 18 Aug 2025 20:22:24 PDT
