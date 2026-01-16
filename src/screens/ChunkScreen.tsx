/**
 * 分包页面 - 展示分包列表和全局状态
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing, StatusBar, ActivityIndicator, Modal } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { updateRemoteBundleConfig, checkBundleVersion, isBundleConfigured, confirmBundleUpdate } from '../../index';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/TabNavigator';

type ChunkScreenProps = BottomTabScreenProps<TabParamList, 'Chunks'>;

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

// 屏幕映射配置（提供默认彩色样式，API 返回的数据会覆盖这些默认值）
const screenMapping: Record<string, { label: string; color: string; emoji: string }> = {
  shop: { label: '商城页面', color: '#FF9800', emoji: '🛒' },
  feature: { label: '功能页面', color: '#F44336', emoji: '🚀' },
  update: { label: '更新测试', color: '#673AB7', emoji: '🔄' },
  settings: { label: '设置页面', color: '#2196F3', emoji: '⚙️' },
  profile: { label: '个人中心', color: '#4CAF50', emoji: '👤' },
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
    console.log('[ChunkScreen] API response:', data);

    if (data.code !== '200' || !data.results) {
      throw new Error(data.msg || '请求失败');
    }

    // 过滤掉用户中心和设置页面分包
    const filteredResults = data.results.filter((item: { url: string }) => {
      const urlParts = item.url.split('/').filter(Boolean);
      const fileName = urlParts[urlParts.length - 1]?.replace('.chunk.bundle', '') || '';
      // 排除 profile 和 settings 分包
      // 注意：update 分包现在是真正的分包，不再排除
      return fileName !== 'profile' && fileName !== 'settings';
    });

    return filteredResults.map((item: { des: string; url: string; version: string }, index: number) => {
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
    console.error('[ChunkScreen] 请求分包列表失败:', error);
    throw error;
  }
};

// 更新对话框组件
function UpdateDialog({ visible, updateInfo, onConfirm, onCancel }: {
  visible: boolean;
  updateInfo: { screen: string; currentVersion: string; latestVersion: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔄 发现新版本</Text>
          <Text style={styles.modalMessage}>
            分包 "{updateInfo?.screen}" 有新版本可用{'\n'}
            当前版本: {updateInfo?.currentVersion}{'\n'}
            最新版本: {updateInfo?.latestVersion}
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={onCancel}>
              <Text style={styles.modalButtonTextCancel}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonConfirm} onPress={onConfirm}>
              <Text style={styles.modalButtonTextConfirm}>立即更新</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ChunkScreen({ navigation }: ChunkScreenProps) {
  const { isLoggedIn, user, cartCount, darkMode, login, logout, bundleConfigs, setBundleConfigs, pendingUpdate } = useAppStore();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = React.useState(false);
  const [updatesAvailable, setUpdatesAvailable] = React.useState<Set<string>>(new Set());

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
      console.log('[ChunkScreen] 分包配置已更新:', urlConfig);

      // 检查所有分包的更新状态
      checkAllUpdates(list);
    } catch (error) {
      console.error('[ChunkScreen] 加载分包配置失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setBundleConfigs]);

  // 检查所有分包是否有更新
  const checkAllUpdates = useCallback(async (bundles: Array<{ screen: string }>) => {
    const updates = new Set<string>();

    for (const bundle of bundles) {
      try {
        const updateInfo = await checkBundleVersion(bundle.screen);
        if (updateInfo && updateInfo.isUpdateAvailable) {
          updates.add(bundle.screen);
          console.log(`[ChunkScreen] ${bundle.screen} 有新版本可用`);
        }
      } catch (error) {
        console.warn(`[ChunkScreen] 检查 ${bundle.screen} 更新失败:`, error);
      }
    }

    setUpdatesAvailable(updates);
  }, []);

  useEffect(() => {
    // 如果已经有缓存数据，不再请求
    if (bundleConfigs.length > 0) {
      console.log('[ChunkScreen] 使用缓存的分包配置');
      setLoading(false);
      return;
    }

    console.log('[ChunkScreen] 加载分包配置...');
    loadBundleConfigs(false);
  }, []); // 只在组件挂载时执行一次

  // 监听 pendingUpdate 状态变化，显示更新对话框
  useEffect(() => {
    if (pendingUpdate) {
      console.log('[ChunkScreen] 检测到待更新:', pendingUpdate);
      setShowUpdateDialog(true);
    }
  }, [pendingUpdate]);

  // 确认更新
  const handleConfirmUpdate = useCallback(() => {
    if (!pendingUpdate) return;

    console.log('[ChunkScreen] 用户确认更新:', pendingUpdate);
    const needReload = confirmBundleUpdate(pendingUpdate.screen, pendingUpdate.latestVersion);

    // 清除更新状态
    useAppStore.getState().setPendingUpdate(null);
    setShowUpdateDialog(false);

    if (needReload) {
      // 需要重新加载页面
      console.log('[ChunkScreen] 需要重新加载分包');
      const parentNavigation = navigation.getParent();
      parentNavigation?.navigate(pendingUpdate.screen as never);
    }
  }, [pendingUpdate, navigation]);

  // 取消更新
  const handleCancelUpdate = useCallback(() => {
    console.log('[ChunkScreen] 用户取消更新');
    useAppStore.getState().setPendingUpdate(null);
    setShowUpdateDialog(false);
  }, []);

  // 点击分包时检查配置和版本
  const handleNavigate = useCallback(async (screen: string) => {
    console.log('[ChunkScreen] 点击分包:', screen);

    // 首先检查分包配置是否存在
    if (!isBundleConfigured(screen)) {
      console.log('[ChunkScreen] 分包配置不存在:', screen);
      // 配置不存在，跳转到错误页面
      const parentNavigation = navigation.getParent() as any;
      parentNavigation?.navigate('BundleError', { bundleName: screen });
      return;
    }

    // 检查版本更新
    const updateInfo = await checkBundleVersion(screen);

    if (updateInfo && updateInfo.isUpdateAvailable) {
      console.log('[ChunkScreen] 该分包有更新:', updateInfo);
      // 显示更新对话框
      useAppStore.getState().setPendingUpdate(updateInfo);
      useAppStore.getState().setCheckingUpdate(false);
    } else {
      // 没有更新，使用父级导航器跳转（分包页面在 RootNavigator 中）
      const parentNavigation = navigation.getParent();
      parentNavigation?.navigate(screen as never);
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
      <UpdateDialog
        visible={showUpdateDialog}
        updateInfo={pendingUpdate}
        onConfirm={handleConfirmUpdate}
        onCancel={handleCancelUpdate}
      />
      <Text style={[styles.title, darkMode && styles.darkText]}>📦 分包页面</Text>

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
          {bundleConfigs.map((item) => {
            const hasUpdate = updatesAvailable.has(item.screen);
            return (
              <TouchableOpacity
                key={item.uniqueKey}
                style={[styles.navButton, { backgroundColor: item.color }]}
                onPress={() => handleNavigate(item.screen)}
              >
                {/* 更新徽章 */}
                {hasUpdate && (
                  <View style={styles.updateBadge}>
                    <Text style={styles.updateBadgeText}>NEW</Text>
                  </View>
                )}
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
            );
          })}
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
    overflow: 'visible', // 允许徽章超出按钮边界
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
  updateBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  updateBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
