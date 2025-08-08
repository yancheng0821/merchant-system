import React from 'react';
import {View, StyleSheet} from 'react-native';
import {FAB, Card, Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';


/**
 * 地图视图页面 - 展示商户位置
 */
const MapViewScreen: React.FC = () => {
  const navigation = useNavigation();

  // 示例商户数据
  const merchants = [
    {
      id: '1',
      name: '时尚造型工作室',
      description: '专业美发造型服务',
    },
    {
      id: '2',
      name: '美容美体中心',
      description: '高端美容护理',
    },
    {
      id: '3',
      name: '健身运动馆',
      description: '专业健身指导',
    },
  ];

  return (
    <View style={styles.container}>
      {/* 模拟地图区域 */}
      <View style={styles.mapPlaceholder}>
        <Text variant="headlineMedium" style={styles.mapText}>
          🗺️ 地图视图
        </Text>
        <Text variant="bodyLarge" style={styles.mapSubText}>
          (需要配置Google Maps)
        </Text>
      </View>

      {/* 底部信息卡片 */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>
            附近商户
          </Text>
          <Text variant="bodyMedium">
            找到 {merchants.length} 家附近的服务商户
          </Text>
          {merchants.map((merchant) => (
            <Text key={merchant.id} variant="bodySmall" style={styles.merchantItem}>
              • {merchant.name} - {merchant.description}
            </Text>
          ))}
        </Card.Content>
      </Card>

      {/* 返回按钮 */}
      <FAB
        icon="arrow-left"
        style={styles.backButton}
        size="small"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
  },
  mapText: {
    color: '#333',
    marginBottom: 8,
  },
  mapSubText: {
    color: '#666',
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    elevation: 8,
  },
  infoTitle: {
    color: '#333',
    marginBottom: 8,
  },
  merchantItem: {
    color: '#666',
    marginTop: 4,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#ffffff',
  },
});

export default MapViewScreen;