import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button} from 'react-native-paper';
import type {AuthStackScreenProps} from '../../navigation/types';

type Props = AuthStackScreenProps<'VerifyReset'>;

const VerifyResetScreen: React.FC<Props> = ({navigation, route}) => {
  const {email} = route.params;

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        验证重置密码
      </Text>
      <Text style={styles.description}>
        我们已向 {email} 发送了验证码，请输入验证码以重置密码。
      </Text>
      <Button mode="outlined" onPress={() => navigation.navigate('Login')}>
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

export default VerifyResetScreen;