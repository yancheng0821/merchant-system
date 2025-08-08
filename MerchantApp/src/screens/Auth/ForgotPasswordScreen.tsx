import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button} from 'react-native-paper';
import type {AuthStackScreenProps} from '../../navigation/types';

type Props = AuthStackScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        忘记密码
      </Text>
      <Text style={styles.description}>
        请输入您的邮箱地址，我们将发送重置密码的链接到您的邮箱。
      </Text>
      <Button mode="outlined" onPress={() => navigation.goBack()}>
        返回登录
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#666',
  },
});

export default ForgotPasswordScreen;