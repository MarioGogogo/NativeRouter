/**
 * 主应用入口 - 支持多分包 + 错误处理 + 模块更新检测 + iOS 风格滑动动画
 *
 * @format
 */

import React, { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Dimensions, StatusBar, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ErrorScreen from './src/screens/ErrorScreen';
import ChunkErrorBoundary from './src/components/ChunkErrorBoundary';
import UpdateDialog from './src/components/UpdateDialog';
import { useAppStore } from './src/store/useAppStore';
import { setVersionCheckCallback, confirmBundleUpdate } from './index';
import { ScriptManager } from '@callstack/repack/client';
import RNRestart from 'react-native-restart';

// 重启后自动导航的 key
const PENDING_NAVIGATION_KEY = 'pending_navigation_screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 分包屏幕类型（不包含 update，用于测试分包不存在的情况）
type ScreenName = 'feature' | 'settings' | 'profile' | 'shop';
type ScreensMap = Record<ScreenName, React.LazyExoticComponent<React.ComponentType<{ navigation: { goBack: () => void } }>>>;

// 创建 lazy 组件的工厂函数
const createLazyScreens = (): ScreensMap => ({
  feature: React.lazy(
    () => import(/* webpackChunkName: "feature" */ './src/screens/FeatureScreen'),
  ),
  settings: React.lazy(
    () => import(/* webpackChunkName: "settings" */ './src/screens/SettingsScreen'),
  ),
  profile: React.lazy(
    () => import(/* webpackChunkName: "profile" */ './src/screens/ProfileScreen'),
  ),
  shop: React.lazy(
    () => import(/* webpackChunkName: "shop" */ './src/screens/ShopScreen'),
  ),
  // 注意：update 分包故意不在此列表中，用于测试"分包不存在"的错误处理
});

// 动画配置 - iOS 风格
const ANIMATION_DURATION = 350;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [nextScreen, setNextScreen] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  // 记录每个分包的版本，变化时会触发 lazy 组件重新创建
  const [screenVersions, setScreenVersions] = useState<Record<string, number>>({});

  // 动态创建 lazy 组件，当 screenVersions 变化时重新创建
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const screens = useMemo(() => createLazyScreens(), [screenVersions]);

  // 动画值
  const homeProgress = useRef(new Animated.Value(1)).current;
  const nextProgress = useRef(new Animated.Value(0)).current;

  // 从 Zustand 获取更新相关状态
  const { setPendingUpdate, setCheckingUpdate } = useAppStore();

  // 缓存 navigation 对象
  const navigation = useMemo(() => ({
    navigate: (screen: string) => {
      if (currentScreen === 'home' && screen !== 'home') {
        // 直接执行动画逻辑，避免闭包问题
        setNextScreen(screen);
        setIsDetailVisible(true);

        // 并行执行动画
        Animated.parallel([
          Animated.timing(homeProgress, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(nextProgress, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            setCurrentScreen(screen);
            setNextScreen(null);
            homeProgress.setValue(0);
            nextProgress.setValue(1);
          }
        });
      }
    },
  }), [currentScreen, homeProgress, nextProgress]);

  // 滑动进入动画 - iOS 风格从右侧滑入
  const startSlideIn = useCallback((screen: string) => {
    setNextScreen(screen);
    setIsDetailVisible(true);

    // 并行执行动画
    Animated.parallel([
      // 首页向左滑出
      Animated.timing(homeProgress, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      // 新页面从右侧滑入
      Animated.timing(nextProgress, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentScreen(screen);
      setNextScreen(null);
      // 重置首页位置
      homeProgress.setValue(0);
      nextProgress.setValue(1);
    });
  }, [homeProgress, nextProgress]);

  // 返回动画 - iOS 风格滑出
  const startSlideOut = useCallback(() => {
    // 并行执行动画
    Animated.parallel([
      // 首页从左侧滑入
      Animated.timing(homeProgress, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      // 当前页面向右滑出
      Animated.timing(nextProgress, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsDetailVisible(false);
        setCurrentScreen('home');
        // 重置所有状态
        homeProgress.setValue(1);
        nextProgress.setValue(0);
      }
    });
  }, [homeProgress, nextProgress]);

  const goBack = useCallback(() => {
    startSlideOut();
  }, [startSlideOut]);

  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  // 版本检查回调
  const handleVersionCheck = useCallback((updateInfo: { screen: string; currentVersion: string; latestVersion: string; isUpdateAvailable: boolean }) => {
    console.log('[App] Version check found update:', updateInfo);
    setPendingUpdate(updateInfo);
    setCheckingUpdate(false);
  }, [setPendingUpdate, setCheckingUpdate]);

  useEffect(() => {
    setVersionCheckCallback(handleVersionCheck);
  }, [handleVersionCheck]);

  // 启动时检查是否有待导航的页面（用于重启后自动跳转）
  useEffect(() => {
    const checkPendingNavigation = async () => {
      try {
        const pendingScreen = await AsyncStorage.getItem(PENDING_NAVIGATION_KEY);
        if (pendingScreen) {
          console.log(`[App] Found pending navigation to: ${pendingScreen}`);
          // 清除标记
          await AsyncStorage.removeItem(PENDING_NAVIGATION_KEY);
          // 延迟一小段时间等待应用初始化完成
          setTimeout(() => {
            startSlideIn(pendingScreen);
          }, 500);
        }
      } catch (error) {
        console.error('[App] Error checking pending navigation:', error);
      }
    };
    checkPendingNavigation();
  }, []);

  const handleUpdateConfirm = useCallback(async () => {
    console.log('[App] User confirmed update, clearing cache and restarting...');
    const pending = useAppStore.getState().pendingUpdate;
    if (!pending) return;

    try {
      // 1. 清除该模块的缓存
      await ScriptManager.shared.invalidateScripts([pending.screen]);
      console.log(`[App] Cache cleared for ${pending.screen}`);

      // 2. 确认更新，更新已加载版本记录
      confirmBundleUpdate(pending.screen, pending.latestVersion);

      // 3. 保存待导航页面，重启后自动跳转
      await AsyncStorage.setItem(PENDING_NAVIGATION_KEY, pending.screen);
      console.log(`[App] Saved pending navigation: ${pending.screen}`);

      // 4. 关闭弹窗
      setPendingUpdate(null);

      // 5. 重启应用以加载新版本
      console.log('[App] Restarting app to load new version...');
      RNRestart.restart();
    } catch (error) {
      console.error('[App] Failed to update module:', error);
      setPendingUpdate(null);
    }
  }, [setPendingUpdate]);

  const handleUpdateCancel = useCallback(() => {
    console.log('[App] User cancelled update, will use cached version');
    setPendingUpdate(null);
  }, [setPendingUpdate]);

  // 根据 progress 计算位移 - iOS 风格
  const homeTranslateX = homeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.3, 0], // iOS 风格：首页只移动 30%
  });

  const nextTranslateX = nextProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });

  // 渲染首页
  const renderHome = () => (
    <Animated.View
      style={[
        styles.screen,
        {
          transform: [{ translateX: homeTranslateX }],
        },
      ]}
    >
      <HomeScreen navigation={navigation} />
    </Animated.View>
  );

  // 渲染详情页
  const renderDetail = () => {
    if (!isDetailVisible && currentScreen === 'home') return null;

    const screenName = (nextScreen || currentScreen) as ScreenName;
    const Screen = screens[screenName];

    // 如果屏幕不存在于 screens 映射中，显示错误页面
    if (!Screen) {
      return (
        <Animated.View
          style={[
            styles.screen,
            {
              transform: [{ translateX: nextTranslateX }],
            },
          ]}
        >
          <ErrorScreen
            error={new Error(`分包 "${screenName}" 不存在`)}
            onGoBack={goBack}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.screen,
          {
            transform: [{ translateX: nextTranslateX }],
          },
        ]}
      >
        <ChunkErrorBoundary
          key={`${screenName}-${screenVersions[screenName] || retryKey}`}
          onGoBack={goBack}
          onRetry={handleRetry}
        >
          <Suspense fallback={<ActivityIndicator size="large" style={styles.loading} />}>
            <Screen navigation={{ goBack }} />
          </Suspense>
        </ChunkErrorBoundary>
      </Animated.View>
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {renderHome()}
        {renderDetail()}
        <UpdateDialog onUpdate={handleUpdateConfirm} onCancel={handleUpdateCancel} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
