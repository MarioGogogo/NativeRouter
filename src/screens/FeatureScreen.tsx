/**
 * 分包页面 - FeatureScreen
 * 使用共用组件 BackButton 和 Badge
 */

import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import BackButton, { Badge } from '../components/BackButton';

interface FeatureScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function FeatureScreen({ navigation }: FeatureScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFEBEE" />
      <View style={styles.header}>
        <Text style={styles.title}>🚀 功能页面</Text>
        <Badge text="feature" color="#F44336" />
      </View>
      <Text style={styles.description}>这是 Feature 分包</Text>
      <Text style={styles.info}>使用了共用组件 BackButton 和 Badge</Text>
      <BackButton onPress={() => navigation.goBack()} color="#F44336" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
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
    color: '#C62828',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
});
