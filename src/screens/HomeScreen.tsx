/**
 * 主包页面 - HomeScreen
 * 使用 Zustand 展示全局状态
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing, StatusBar, ActivityIndicator } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { updateRemoteBundleConfig, checkBundleVersion } from '../../index';

// 脉冲动画 Loading 组件
function LoadingView() {
  const pulseAnim = useRef(new Animated.Value(0.3));
  const rotateAnim = useRef(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim.current, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim.current, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim.current, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      pulseAnim.current.stopAnimation();
      rotateAnim.current.stopAnimation();
    };
  }, []);

  const spin = rotateAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingDialog}>
        <Animated.View
          style={[
            styles.loadingRing,
            {
              transform: [{ rotate: spin }],
              opacity: pulseAnim.current,
            },
          ]}
        >
          <View style={styles.loadingInner} />
        </Animated.View>
        <Text style={styles.loadingText}>正在加载分包配置</Text>
        <Text style={styles.loadingSubtext}>请稍候...</Text>
      </View>
    </View>
  );
}

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

// 屏幕映射配置
const screenMapping: Record<string, { label: string; color: string; emoji: string }> = {
  profile: { label: '用户中心', color: '#2196F3', emoji: '👤' },
  settings: { label: '设置页面', color: '#4CAF50', emoji: '⚙️' },
  shop: { label: '商城页面', color: '#FF9800', emoji: '🛒' },
  feature: { label: '功能页面', color: '#F44336', emoji: '🚀' },
  update: { label: '更新测试', color: '#673AB7', emoji: '🔄' },
};

// API 地址
const API_URL = 'https://m1.apifoxmock.com/m1/1149415-2096860-default/listdes';

// 请求获取分包列表
const fetchBundleList = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    console.log('[HomeScreen] API response:', data);

    if (data.code !== '200' || !data.results) {
      throw new Error(data.msg || '请求失败');
    }

    return data.results.map((item: { des: string; url: string; version: string }, index: number) => {
      // 使用 URL 路径中的目录名 + 文件名作为唯一标识
      const urlParts = item.url.split('/').filter(Boolean);
      const fileName = urlParts[urlParts.length - 1]?.replace('.chunk.bundle', '') || `bundle-${index}`;
      const dirName = urlParts[urlParts.length - 2] || 'default';
      const screen = `${dirName}_${fileName}`; // 例如: doudizhu_profile

      const mapping = screenMapping[fileName] || { label: item.des, color: '#9E9E9E', emoji: '📦' };

      return {
        screen: fileName, // 保持原有逻辑用于导航
        uniqueKey: screen, // 用于 React key
        label: mapping.label,
        color: mapping.color,
        emoji: mapping.emoji,
        url: item.url,
        version: item.version,
        des: item.des,
      };
    });
  } catch (error) {
    console.error('[HomeScreen] 请求分包列表失败:', error);
    throw error;
  }
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isLoggedIn, user, cartCount, darkMode, login, logout, bundleConfigs, setBundleConfigs } = useAppStore();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // 加载分包配置
  const loadBundleConfigs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (bundleConfigs.length === 0) {
      setLoading(true);
    }

    try {
      const list = await fetchBundleList();
      setBundleConfigs(list);
      // 更新 ScriptManager 配置（包含版本信息）
      const urlConfig: Record<string, { url: string; version: string }> = {};
      list.forEach((bundle: { screen: string; url: string; version: string }) => {
        urlConfig[bundle.screen] = { url: bundle.url, version: bundle.version };
      });
      updateRemoteBundleConfig(urlConfig);
      console.log('[HomeScreen] 分包配置已更新:', urlConfig);
    } catch (error) {
      console.error('[HomeScreen] 加载分包配置失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setBundleConfigs]);

  useEffect(() => {
    // 如果已经有缓存数据，不再请求
    if (bundleConfigs.length > 0) {
      console.log('[HomeScreen] 使用缓存的分包配置');
      setLoading(false);
      return;
    }

    console.log('[HomeScreen] 加载分包配置...');
    loadBundleConfigs(false);
  }, []); // 只在组件挂载时执行一次

  // 点击分包时直接检查版本
  const handleNavigate = useCallback(async (screen: string) => {
    console.log('[HomeScreen] 点击分包:', screen);

    // 直接检查版本
    const updateInfo = await checkBundleVersion(screen);

    if (updateInfo && updateInfo.isUpdateAvailable) {
      console.log('[HomeScreen] 该分包有更新:', updateInfo);
      // 显示更新对话框
      useAppStore.getState().setPendingUpdate(updateInfo);
      useAppStore.getState().setCheckingUpdate(false);
    } else {
      // 没有更新，直接导航
      navigation.navigate(screen);
    }
  }, [navigation]);

  const handleLogin = () => {
    login('mock-token-123', {
      name: 'React Native 开发者',
      level: 10,
      points: 8888,
    });
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={darkMode ? '#1a1a1a' : '#f5f5f5'} />
      <Text style={[styles.title, darkMode && styles.darkText]}>📦 Re.Pack 分包演示</Text>

      {/* 状态展示区域 */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>🔗 Zustand 全局状态</Text>
        <Text style={styles.statusItem}>
          登录状态: {isLoggedIn ? `✅ ${user?.name}` : '❌ 未登录'}
        </Text>
        <Text style={styles.statusItem}>购物车: 🛒 {cartCount} 件</Text>
        <Text style={styles.statusItem}>深色模式: {darkMode ? '🌙 开启' : '☀️ 关闭'}</Text>

        <TouchableOpacity
          style={[styles.loginButton, isLoggedIn && styles.logoutButton]}
          onPress={isLoggedIn ? logout : handleLogin}
        >
          <Text style={styles.loginButtonText}>
            {isLoggedIn ? '退出登录' : '模拟登录'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>点击按钮加载分包，状态会共享</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadBundleConfigs(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.refreshButtonText}>刷新</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingView />
      ) : bundleConfigs.length > 0 ? (
        <ScrollView style={styles.buttonList} showsVerticalScrollIndicator={false}>
          {bundleConfigs.map((item) => (
            <TouchableOpacity
              key={item.uniqueKey}
              style={[styles.navButton, { backgroundColor: item.color }]}
              onPress={() => handleNavigate(item.screen)}
            >
              <Text style={styles.buttonEmoji}>{item.emoji}</Text>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonLabel}>{item.label}</Text>
                <Text style={styles.buttonChunk}>chunk: {item.screen} ({item.version})</Text>
              </View>
              {item.screen === 'shop' && cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 50,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#757575',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonList: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  buttonContent: {
    flex: 1,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  buttonChunk: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingDialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#2196F3',
    borderTopColor: '#64B5F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#673AB7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
