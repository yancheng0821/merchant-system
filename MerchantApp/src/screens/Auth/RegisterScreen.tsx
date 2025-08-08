import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {useForm, Controller} from 'react-hook-form';

// 导入状态管理
import {useAuthStore} from '../../store';
import {authApi} from '../../api';

// 导入导航类型
import type {AuthStackScreenProps} from '../../navigation/types';

type Props = AuthStackScreenProps<'Register'>;

// 表单数据接口
interface RegisterFormData {
  username: string;
  email: string;
  realName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  invitationCode: string;
}

/**
 * 注册页面
 */
const RegisterScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {login, setLoading} = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单控制
  const {
    control,
    handleSubmit,
    watch,
    formState: {errors, isValid},
  } = useForm<RegisterFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      realName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      invitationCode: '',
    },
  });

  // 监听密码字段用于确认密码验证
  const password = watch('password');

  /**
   * 处理注册提交
   */
  const onSubmit = async (data: RegisterFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setLoading(true);

      // 调用注册API
      const response = await authApi.register({
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        realName: data.realName,
        phone: data.phone,
        invitationCode: data.invitationCode,
      });

      if (response.success && response.data) {
        // 注册成功，自动登录
        login(response.data.token, response.data.user);
        // 导航会自动处理，因为RootNavigator监听了认证状态变化
      } else {
        setErrorMessage(response.message || t('auth.registerError'));
      }
    } catch (error: any) {
      console.error('Register error:', error);
      setErrorMessage(error.message || t('auth.registerError'));
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.formTitle}>{t('auth.register')}</Title>

            <Controller
              control={control}
              name="username"
              rules={{
                required: t('auth.usernameRequired'),
                minLength: {
                  value: 3,
                  message: '用户名长度至少3位',
                },
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label={t('auth.username')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.username}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username.message}</Text>
            )}

            <Controller
              control={control}
              name="realName"
              rules={{
                required: t('auth.realNameRequired'),
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label={t('auth.realName')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.realName}
                  style={styles.input}
                  autoCorrect={false}
                />
              )}
            />
            {errors.realName && (
              <Text style={styles.errorText}>{errors.realName.message}</Text>
            )}

            <Controller
              control={control}
              name="email"
              rules={{
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: '邮箱格式不正确',
                },
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label={t('auth.email')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.email}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}

            <Controller
              control={control}
              name="phone"
              rules={{
                required: t('auth.phoneRequired'),
                pattern: {
                  value: /^1[3-9]\d{9}$/,
                  message: '手机号格式不正确',
                },
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label={t('auth.phone')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.phone}
                  style={styles.input}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              )}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}

            <Controller
              control={control}
              name="invitationCode"
              rules={{
                required: '邀请码不能为空',
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label="邀请码"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.invitationCode}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.invitationCode && (
              <Text style={styles.errorText}>{errors.invitationCode.message}</Text>
            )}

            <Controller
              control={control}
              name="password"
              rules={{
                required: t('auth.passwordRequired'),
                minLength: {
                  value: 6,
                  message: '密码长度至少6位',
                },
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label={t('auth.password')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: '请确认密码',
                validate: (value) =>
                  value === password || '两次输入的密码不一致',
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <TextInput
                  mode="outlined"
                  label={t('auth.confirmPassword')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                t('auth.registerButton')
              )}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage('')}
        duration={4000}
        style={styles.snackbar}>
        {errorMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 24,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  registerButton: {
    marginTop: 16,
    backgroundColor: '#6366F1',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: '#d32f2f',
  },
});

export default RegisterScreen;