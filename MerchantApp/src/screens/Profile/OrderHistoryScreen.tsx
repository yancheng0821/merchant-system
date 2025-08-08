import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

const OrderHistoryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Order History</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});

export default OrderHistoryScreen;
