/**
 * 共用组件 - BackButton
 * 用于演示共用组件在分包中的行为
 * 
 * 这个组件会被 feature, settings, profile, shop 分包共同使用
 * Rspack 会自动将其提取到主包中，避免重复打包
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
  label?: string;
  color?: string;
}

export default function BackButton({ 
  onPress, 
  label = '返回首页',
  color = '#666' 
}: BackButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.arrow}>←</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

// 同时导出一个 Badge 组件，展示多个共用组件
export function Badge({ text, color = '#FF5722' }: { text: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  arrow: {
    color: '#fff',
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
