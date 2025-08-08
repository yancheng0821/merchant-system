import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Paragraph,
  Snackbar,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {useForm, Controller} from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 导入状态管理
import {useAuthStore} from '../../store';
import {authApi} from '../../api';

// 导入导航类型
import type {AuthStackScreenProps} from '../../navigation/types';

// 导入主题
import {designTokens} from '../../theme/theme';

type Props = AuthStackScreenProps<'Login'>;

// 表单数据接口
interface LoginFormData {
  username: string;
  password: string;
  tenantCode: string;
}

/**
 * 登录页面 - 现代化设计
 */
const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {login, setLoading} = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(0.8)).current;

  // 表单控制
  const {
    control,
    handleSubmit,
    formState: {errors, isValid},
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
      tenantCode: '',
    },
  });

  // 初始化动画
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoAnim]);

  /**
   * 处理登录提交 - 模拟登录
   */
  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setLoading(true);

      // 模拟网络请求延时
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模拟登录成功的用户数据
      const mockUser = {
        id: '1',
        username: data.username,
        email: 'demo@example.com',
        realName: '演示用户',
        phone: '13800138000',
        avatar: '',
        tenantCode: data.tenantCode || 'demo',
        roles: ['user'],
        permissions: ['read', 'write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'demo_jwt_token_' + Date.now();

      // 登录成功，更新状态
      login(mockToken, mockUser);
      // 导航会自动处理，因为RootNavigator监听了认证状态变化
      
      console.log('🎉 模拟登录成功:', mockUser);
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.message || t('auth.loginError'));
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  /**
   * 导航到注册页面
   */
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  /**
   * 导航到忘记密码页面
   */
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <>
      <StatusBar backgroundColor="#6366F1" barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          {/* 背景渐变 */}
          <View style={styles.backgroundGradient} />
          
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            
            {/* Logo 和标题区域 */}
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{scale: logoAnim}],
                },
              ]}>
              <View style={styles.logoCircle}>
                <Icon name="storefront" size={48} color="#ffffff" />
              </View>
              <Title style={styles.title}>MerchantApp</Title>
              <Paragraph style={styles.subtitle}>优质商户服务平台</Paragraph>
            </Animated.View>

            {/* 登录表单卡片 */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{translateY: slideAnim}],
                },
              ]}>
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.formTitle}>登录账户</Text>
                  <Text style={styles.formSubtitle}>欢迎回来，请输入您的账户信息</Text>

                  <Controller
                    control={control}
                    name="tenantCode"
                    rules={{
                      required: '租户代码不能为空',
                    }}
                    render={({field: {onChange, onBlur, value}}) => (
                      <View style={styles.inputContainer}>
                        <Icon name="business" size={20} style={styles.inputIcon} />
                        <TextInput
                          mode="outlined"
                          label="租户代码"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.tenantCode}
                          style={styles.input}
                          outlineStyle={styles.inputOutline}
                          contentStyle={styles.inputContent}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="请输入租户代码"
                        />
                      </View>
                    )}
                  />
                  {errors.tenantCode && (
                    <Text style={styles.errorText}>{errors.tenantCode.message}</Text>
                  )}

                  <Controller
                    control={control}
                    name="username"
                    rules={{
                      required: '用户名不能为空',
                    }}
                    render={({field: {onChange, onBlur, value}}) => (
                      <View style={styles.inputContainer}>
                        <Icon name="person" size={20} style={styles.inputIcon} />
                        <TextInput
                          mode="outlined"
                          label="用户名"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.username}
                          style={styles.input}
                          outlineStyle={styles.inputOutline}
                          contentStyle={styles.inputContent}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="请输入用户名"
                        />
                      </View>
                    )}
                  />
                  {errors.username && (
                    <Text style={styles.errorText}>{errors.username.message}</Text>
                  )}

                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      required: '密码不能为空',
                      minLength: {
                        value: 6,
                        message: '密码长度至少6位',
                      },
                    }}
                    render={({field: {onChange, onBlur, value}}) => (
                      <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} style={styles.inputIcon} />
                        <TextInput
                          mode="outlined"
                          label="密码"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={!!errors.password}
                          secureTextEntry={!showPassword}
                          style={styles.input}
                          outlineStyle={styles.inputOutline}
                          contentStyle={styles.inputContent}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="请输入密码"
                          right={
                            <TextInput.Icon
                              icon={showPassword ? 'eye-off' : 'eye'}
                              onPress={() => setShowPassword(!showPassword)}
                            />
                          }
                        />
                      </View>
                    )}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}

                  <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    disabled={!isValid || isSubmitting}
                    style={styles.loginButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}>
                    {isSubmitting ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text style={styles.loadingText}>登录中...</Text>
                      </View>
                    ) : (
                      '立即登录'
                    )}
                  </Button>

                  <Button
                    mode="text"
                    onPress={navigateToForgotPassword}
                    style={styles.forgotButton}
                    labelStyle={styles.forgotButtonLabel}>
                    忘记密码？
                  </Button>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* 底部注册链接 */}
            <Animated.View 
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                  transform: [{translateY: slideAnim}],
                },
              ]}>
              <Text style={styles.footerText}>还没有账户？</Text>
              <Button 
                mode="text" 
                onPress={navigateToRegister}
                labelStyle={styles.registerButtonLabel}>
                立即注册
              </Button>
            </Animated.View>

            {/* 版权信息 */}
            <Animated.View 
              style={[
                styles.copyright,
                {opacity: fadeAnim},
              ]}>
              <Text style={styles.copyrightText}>© 2025 MerchantApp. All rights reserved.</Text>
            </Animated.View>
          </ScrollView>

          <Snackbar
            visible={!!errorMessage}
            onDismiss={() => setErrorMessage('')}
            duration={4000}
            style={styles.snackbar}
            wrapperStyle={styles.snackbarWrapper}>
            {errorMessage}
          </Snackbar>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366F1',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366F1',
    opacity: 0.95,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.xxxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.xxxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: designTokens.fontSize['4xl'],
    fontWeight: designTokens.fontWeight.bold,
    color: '#ffffff',
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: designTokens.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: designTokens.fontWeight.medium,
  },
  formContainer: {
    marginBottom: designTokens.spacing.xl,
  },
  card: {
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: '#ffffff',
    ...designTokens.shadows.large,
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.xxxl,
  },
  formTitle: {
    fontSize: designTokens.fontSize['3xl'],
    fontWeight: designTokens.fontWeight.bold,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  formSubtitle: {
    fontSize: designTokens.fontSize.base,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: designTokens.spacing.xl,
    fontWeight: designTokens.fontWeight.medium,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: designTokens.spacing.lg,
  },
  inputIcon: {
    position: 'absolute',
    left: designTokens.spacing.md,
    top: 28,
    zIndex: 1,
    color: '#64748b',
  },
  input: {
    backgroundColor: '#f8fafc',
    paddingLeft: designTokens.spacing.xxxl,
  },
  inputOutline: {
    borderColor: '#e2e8f0',
    borderWidth: 1.5,
    borderRadius: designTokens.borderRadius.md,
  },
  inputContent: {
    fontSize: designTokens.fontSize.lg,
  },
  errorText: {
    color: '#dc2626',
    fontSize: designTokens.fontSize.sm,
    marginTop: -designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    marginLeft: designTokens.spacing.xs,
    fontWeight: designTokens.fontWeight.medium,
  },
  loginButton: {
    marginTop: designTokens.spacing.xl,
    marginBottom: designTokens.spacing.lg,
    backgroundColor: '#6366F1',
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.medium,
  },
  buttonContent: {
    paddingVertical: designTokens.spacing.md,
  },
  buttonLabel: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: designTokens.fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: designTokens.fontSize.lg,
    fontWeight: designTokens.fontWeight.medium,
  },
  forgotButton: {
    marginTop: designTokens.spacing.sm,
  },
  forgotButtonLabel: {
    color: '#6366F1',
    fontSize: designTokens.fontSize.base,
    fontWeight: designTokens.fontWeight.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xl,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: designTokens.fontSize.lg,
    fontWeight: designTokens.fontWeight.medium,
  },
  registerButtonLabel: {
    color: '#ffffff',
    fontSize: designTokens.fontSize.lg,
    fontWeight: designTokens.fontWeight.bold,
  },
  copyright: {
    alignItems: 'center',
    marginTop: designTokens.spacing.lg,
  },
  copyrightText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: designTokens.fontSize.sm,
    fontWeight: designTokens.fontWeight.medium,
  },
  snackbar: {
    backgroundColor: '#dc2626',
    borderRadius: designTokens.borderRadius.lg,
  },
  snackbarWrapper: {
    bottom: designTokens.spacing.xl,
  },
});

export default LoginScreen;