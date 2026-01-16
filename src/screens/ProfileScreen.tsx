/**
 * 个人中心页面 - iOS 风格
 * 100% 复刻 profile.html 设计
 * 集成 Zustand 用户信息
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast, { ToastRef } from '../components/Toast';
import Dialog, { DialogRef } from '../components/Dialog';
import { useAppStore } from '../store/useAppStore';
import { isBundleConfigured } from '../../index';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TabParamList } from '../navigation/TabNavigator';
import type { RootStackParamList } from '../navigation/RootNavigator';

// ProfileScreen 可以在 Tab Navigator 中，也可以被 Stack Navigator 导航到
// 所以我们需要支持两种类型的 props
type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList, keyof RootStackParamList>
>;

interface MenuItem {
  icon: string;
  title: string;
  iconColor: string;
  iconBgColor: string;
}

const MENU_GROUPS: MenuItem[][] = [
  [
    { icon: 'bookmark', title: '我的收藏', iconColor: '#ffffff', iconBgColor: '#f97316' },
    { icon: 'settings', title: '设置', iconColor: '#ffffff', iconBgColor: '#64748b' },
    { icon: 'help', title: '帮助与反馈', iconColor: '#ffffff', iconBgColor: '#3b82f6' },
  ],
  [
    { icon: 'notifications', title: '消息通知', iconColor: '#ffffff', iconBgColor: '#ef4444' },
    { icon: 'shield', title: '隐私与安全', iconColor: '#ffffff', iconBgColor: '#a855f7' },
  ],
];

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  // 从 Zustand 获取用户信息（主包登录后这里自动同步）
  const { user, isLoggedIn, cartCount, logout } = useAppStore();
  const toastRef = useRef<ToastRef>(null);
  const dialogRef = useRef<DialogRef>(null);

  const handleMenuPress = (title: string) => {
    // 特殊处理：设置菜单跳转到分包页面
    if (title === '设置') {
      // 检查分包配置是否存在
      if (!isBundleConfigured('settings')) {
        // 配置不存在，跳转到错误页面
        const parentNavigation = navigation.getParent() as any;
        parentNavigation?.navigate('BundleError', { bundleName: 'settings' });
        return;
      }
      // 嵌套导航：获取父级导航器（RootNavigator）并导航到 Settings
      const parentNavigation = navigation.getParent();
      parentNavigation?.navigate('Settings' as never);
      return;
    }

    // 特殊处理：退出登录
    if (title === '退出登录') {
      // 调用全局状态登出
      logout();
      // 获取父级导航器并重置到登录页面
      const parentNavigation = navigation.getParent();
      parentNavigation?.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    // 其他菜单显示 Toast
    toastRef.current?.show({
      type: 'text',
      message: `点击了${title}`,
      duration: 1500,
    });
  };

  // 处理版本升级点击
  const handleVersionUpdate = () => {
    dialogRef.current?.show({
      type: 'update',
      title: '发现新版本',
      message: '我们修复了一些已知问题并提升了性能体验，建议立即更新到最新版本。',
      confirmText: '立即更新',
      cancelText: '稍后提醒',
      onConfirm: () => {
        toastRef.current?.show({
          type: 'loading',
          message: '正在更新...',
          duration: 2000,
        });
      },
    });
  };

  const renderMenuItem = (item: MenuItem, index: number, groupIndex: number) => {
    const isLastInGroup = index === MENU_GROUPS[groupIndex].length - 1;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };

    return (
      <TouchableOpacity
        key={`${groupIndex}-${index}`}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handleMenuPress(item.title)}
      >
        <Animated.View
          style={[
            styles.menuItem,
            !isLastInGroup && styles.menuItemBorder,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.iconBgColor }]}>
            <MaterialIcons name={item.icon} size={20} color={item.iconColor} />
          </View>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // 使用 Zustand 的用户信息，如果没有登录则显示默认值
  const displayName = isLoggedIn ? user?.name || 'Alex' : '未登录';
  const displayBio = isLoggedIn ? '账号设置、个人资料管理' : '请先登录账号';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f7" />
      <Toast ref={toastRef} />
      <Dialog ref={dialogRef} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>个人中心</Text>
        </View>

        {/* User Profile Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleMenuPress('个人资料')}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmy-DpMWHYd7Hd4zGNpg68DobT6rT1Gi8lKrKtvyT-SVPuzjnOAGn1T8qNL_sB_x4nV8StzgYjtasN5rJMw-5OFFM4BeerTqfrTd1XTVSzTM_P_YoMC1M03HQCPXGPsSN1a92j5wHXnBt7y2_C8YcgQeVoRVyjGtxCCwpQDmKLtUcH4AgR8T6OKTvyqUmCWOyy8MveJ2UHvjD2S2RNWBpxf2CIBhdEF7xeaZ_XDtqv30ZClJvEY_CNU5nk8tafklEFUgphmC6BxQST' }}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userBio}>{displayBio}</Text>
              {isLoggedIn && user?.level && (
                <Text style={styles.userLevel}>等级 LV.{user.level}</Text>
              )}
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        {/* Menu Groups */}
        <View style={styles.menuContainer}>
          {MENU_GROUPS.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.menuGroup}>
              {group.map((item, index) => renderMenuItem(item, index, groupIndex))}
            </View>
          ))}
        </View>

        {/* User Stats (if logged in) */}
        {isLoggedIn && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.points?.toLocaleString() || 0}</Text>
              <Text style={styles.statLabel}>积分</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cartCount}</Text>
              <Text style={styles.statLabel}>购物车</Text>
            </View>
          </View>
        )}

        {/* Logout Button (if logged in) */}
        {isLoggedIn && (
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={() => handleMenuPress('退出登录')}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
        )}

        {/* Version Info */}
        <TouchableOpacity
          style={styles.versionContainer}
          activeOpacity={0.8}
          onPress={handleVersionUpdate}
        >
          <View style={styles.versionContent}>
            <Text style={styles.versionText}>版本 1.0.0</Text>
            <View style={styles.updateBadge}>
              <Text style={styles.updateBadgeText}>新</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  // Profile Card
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  userBio: {
    fontSize: 14,
    color: '#64748b',
  },
  userLevel: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 4,
  },
  // Stats Card
  statsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
  },
  // Menu Container
  menuContainer: {
    paddingHorizontal: 16,
    gap: 24,
  },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  // Logout Button
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  // Version Info
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 8,
  },
  versionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  updateBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  updateBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
});
