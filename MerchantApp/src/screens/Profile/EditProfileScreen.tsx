import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

const EditProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">‘*ºD™</Text>
      <Text>ÙÌ/‘*ºD™„ub</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

export default EditProfileScreen;