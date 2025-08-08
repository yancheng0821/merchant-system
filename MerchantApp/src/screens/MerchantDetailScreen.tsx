import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

const MerchantDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">F7Ê≈</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});

export default MerchantDetailScreen;