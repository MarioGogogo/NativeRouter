import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast, { ToastRef, ToastType } from '../components/Toast';
import Dialog, { DialogRef, DialogType } from '../components/Dialog';

const { width } = Dimensions.get('window');

// Mock Data
const CATEGORIES: {
  id: string;
  name: string;
  icon: string;
  color: string;
  iconColor: string;
  isDashed?: boolean;
  toastType?: ToastType;
  toastMsg?: string;
  dialogType?: DialogType; // Add dialog trigger support
}[] = [
    { id: '1', name: '日程', icon: 'calendar-today', color: '#eef2ff', iconColor: '#6366f1', toastType: 'success', toastMsg: '日程已同步' },
    { id: '2', name: '健康', icon: 'favorite-border', color: '#fff1f2', iconColor: '#f43f5e', dialogType: 'warning' }, // Trigger Warning Dialog
    { id: '3', name: '钱包', icon: 'account-balance-wallet', color: '#ecfdf5', iconColor: '#10b981', toastType: 'warning', toastMsg: '余额不足' },
    { id: '4', name: '消息', icon: 'chat-bubble-outline', color: '#faf5ff', iconColor: '#a855f7', toastType: 'info', toastMsg: '收到3条新消息' },
    { id: '5', name: '统计', icon: 'bar-chart', color: '#fff7ed', iconColor: '#f97316', dialogType: 'success' }, // Trigger Success Dialog
    { id: '6', name: '文件', icon: 'cloud-queue', color: '#ecfeff', iconColor: '#06b6d4', toastType: 'text', toastMsg: '文件已归档' },
    { id: '7', name: '更多', icon: 'add', color: '#f8fafc', iconColor: '#cbd5e1', isDashed: true, dialogType: 'update' }, // Trigger Update Dialog
  ];

const ACTIVITIES = [
  { id: '1', title: '收到新通知', time: '2 分钟前', icon: 'shopping-bag', bg: '#eef2ff', color: '#6366f1' },
  { id: '2', title: '会议邀请', time: '45 分钟前', icon: 'mail-outline', bg: '#fdf2f8', color: '#db2777' },
];

export default function RecommendScreen() {
  const toastRef = useRef<ToastRef>(null);
  const dialogRef = useRef<DialogRef>(null);

  const handleGridPress = (item: typeof CATEGORIES[0]) => {
    // Priority: Dialog > Toast
    if (item.dialogType && dialogRef.current) {
      if (item.dialogType === 'warning') {
        dialogRef.current.show({
          type: 'warning',
          title: '确认删除？',
          message: '删除后数据将无法恢复，请您在操作前再次确认。',
          confirmText: '确认',
          cancelText: '取消',
          onConfirm: () => toastRef.current?.show({ type: 'success', message: '已删除' }),
        });
      } else if (item.dialogType === 'success') {
        dialogRef.current.show({
          type: 'success',
          title: '提交成功',
          message: '您的操作已成功处理，点击下方按钮返回主页。',
          confirmText: '确定',
        });
      } else if (item.dialogType === 'update') {
        dialogRef.current.show({
          type: 'update',
          title: '发现新版本',
          message: '我们修复了一些已知问题并提升了性能体验。',
          confirmText: '立即更新',
          cancelText: '以后再说',
          onConfirm: () => toastRef.current?.show({ type: 'loading', message: '正在更新...', duration: 3000 }),
        });
      }
    } else if (item.toastType && toastRef.current) {
      toastRef.current.show({
        type: item.toastType,
        message: item.toastMsg || 'Toast Message',
        duration: item.toastType === 'loading' ? 3000 : 2000,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <Toast ref={toastRef} />
      <Dialog ref={dialogRef} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>今日推荐</Text>
          <Text style={styles.headerSubtitle}>欢迎回来，Alex</Text>
        </View>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80' }}
          style={styles.avatar}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Highlight Cards */}
        <View style={styles.cardsContainer}>
          {/* Left Card - Active */}
          <LinearGradient
            colors={['#8B5CF6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.leftCard]}
          >
            <View style={styles.cardIconCircle}>
              <MaterialIcons name="flash-on" size={20} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.cardLabelWhite}>今日活跃</Text>
              <Text style={styles.cardValueWhite}>+24%</Text>
            </View>
          </LinearGradient>

          {/* Right Card - Progress */}
          <View style={[styles.card, styles.rightCard]}>
            <View style={styles.rightCardHeader}>
              <View style={styles.awardIconCircle}>
                <MaterialIcons name="verified" size={20} color="#d97706" />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>高级版</Text>
              </View>
            </View>
            <View>
              <Text style={styles.cardLabelGray}>每月目标进度</Text>
              <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
              </View>
            </View>
          </View>
        </View>

        {/* Categories Grid */}
        <Text style={styles.sectionTitle}>全部分类 (点击触发 Toast)</Text>
        <View style={styles.gridContainer}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => handleGridPress(item)}
            >
              <View
                style={[
                  styles.gridIconContainer,
                  { backgroundColor: item.color },
                  item.isDashed && styles.dashedBorder
                ]}
              >
                <MaterialIcons name={item.icon} size={28} color={item.iconColor} />
              </View>
              <Text style={styles.gridLabel}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Latest Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最新动态</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>查看全部</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          {ACTIVITIES.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View style={[styles.listIconContainer, { backgroundColor: item.bg }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{item.title}</Text>
                <Text style={styles.listTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Extra space for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50
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
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  // Cards
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flex: 1,
    height: 160,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  leftCard: {
    // Gradient handled by LinearGradient wrapper
  },
  rightCard: {
    backgroundColor: '#ffffff',
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabelWhite: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  cardValueWhite: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  rightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  awardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7', // amber-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardLabelGray: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: 6,
    width: '70%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  // Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  gridItem: {
    width: '25%', // 4 columns
    alignItems: 'center',
    marginBottom: 24,
  },
  gridIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20, // Squircle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dashedBorder: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  gridLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  // List
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  seeAllText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  listTime: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
