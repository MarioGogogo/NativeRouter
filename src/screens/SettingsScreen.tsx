/**
 * 分包页面 - SettingsScreen
 * 使用 Zustand 管理设置状态（与主包共享）
 */

import React from 'react';
import { View, Text, StyleSheet, Switch, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAppStore } from '../store/useAppStore';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  // 使用 Zustand 全局状态（与主包共享！）
  const { darkMode, notifications, setDarkMode, setNotifications } = useAppStore();

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={darkMode ? '#1a1a1a' : '#f2f2f7'} />

      {/* Header */}
      <View style={[styles.header, darkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={darkMode ? '#fff' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.title, darkMode && styles.darkText]}>设置</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, darkMode && styles.darkText]}>通用设置</Text>

        <View style={[styles.card, darkMode && styles.darkCard]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="dark-mode" size={24} color="#6366f1" />
              <Text style={[styles.settingLabel, darkMode && styles.darkText]}>深色模式</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
            />
          </View>

          <View style={[styles.divider, darkMode && styles.darkDivider]} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="notifications" size={24} color="#ef4444" />
              <Text style={[styles.settingLabel, darkMode && styles.darkText]}>通知提醒</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
            />
          </View>
        </View>

        <Text style={[styles.subtitle, darkMode && styles.darkText]}>关于</Text>

        <View style={[styles.card, darkMode && styles.darkCard]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="info" size={24} color="#10b981" />
              <Text style={[styles.settingLabel, darkMode && styles.darkText]}>版本号</Text>
            </View>
            <Text style={[styles.settingValue, darkMode && styles.darkText]}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.hintContainer}>
          <Text style={[styles.hint, darkMode && styles.darkText]}>
            💡 这些设置使用 Zustand 管理，返回个人中心后状态保持同步
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#f2f2f7',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  darkText: {
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  darkCard: {
    backgroundColor: '#2a2a2a',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 52,
  },
  darkDivider: {
    backgroundColor: '#3a3a3a',
  },
  hintContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  hint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});
