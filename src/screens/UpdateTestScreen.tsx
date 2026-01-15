/**
 * 分包页面 - UpdateTestScreen
 * 用于测试分包更新功能
 */

import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import BackButton, { Badge } from '../components/BackButton';

interface UpdateTestScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function UpdateTestScreen({ navigation }: UpdateTestScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE7F6" />
      <View style={styles.header}>
        <Text style={styles.title}>🔄 更新测试</Text>
        <Badge text="update" color="#673AB7" />
      </View>
      <Text style={styles.description}>这是 Update 分包</Text>
      <Text style={styles.version}>当前版本: 1.0.0</Text>
      <Text style={styles.info}>
        修改此页面内容并重新部署分包，{'\n'}
        可测试热更新功能
      </Text>
      <BackButton onPress={() => navigation.goBack()} color="#673AB7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4527A0',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  version: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#673AB7',
    marginBottom: 16,
  },
  info: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
});
