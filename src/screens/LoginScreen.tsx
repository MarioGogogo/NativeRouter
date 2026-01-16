import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  useColorScheme,
  Image,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppStore } from '../store/useAppStore';
import { fetchBundleConfigWithRetry } from '../services/BundleConfigService';
import { updateRemoteBundleConfig } from '../../index';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

// --- Colors & Theme Configuration ---
const COLORS = {
  primary: '#5b5bf0', // slightly more vibrant indigo
  white: '#ffffff',
  backgroundLight: '#f5f6ff', // lighter, slightly blueish white to match screenshot
  backgroundDark: '#0f172a',
  slate900: '#1e293b',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate700: '#334155',
  slate800: '#1e293b',
  slate50: '#f8fafc',
};

const MeshGradient = ({ isDark }: { isDark: boolean }) => {
  const bgColor = isDark ? COLORS.backgroundDark : COLORS.backgroundLight;
  // Increase opacity for visibility and adjust colors to match screenshot lavender tone
  const color1 = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'; // Indigo
  const color2 = isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.25)'; // Purple

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="grad1"
            cx="0"
            cy="0"
            rx="80%" // Larger radius
            ry="60%"
            fx="0"
            fy="0"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={color1} stopOpacity="1" />
            <Stop offset="1" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id="grad2"
            cx="100%"
            cy="0"
            rx="80%" // Larger radius
            ry="60%"
            fx="100%"
            fy="0"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={color2} stopOpacity="1" />
            <Stop offset="1" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={bgColor} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
      </Svg>
    </View>
  );
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // 全局状态管理
  const { login } = useAppStore();

  // 登录处理函数
  const handleLogin = () => {
    // 模拟登录成功，更新全局状态
    login('mock-token-123', {
      name: 'React Native 开发者',
      level: 10,
      points: 8888,
    });

    // 立即跳转到主页面（不等待分包配置加载）
    navigation.replace('MainTabs');

    // 后台异步获取分包配置（不阻塞页面跳转）
    fetchBundleConfigWithRetry()
      .then(config => {
        console.log('[LoginScreen] Bundle config loaded:', config);
        updateRemoteBundleConfig(config);
      })
      .catch(error => {
        console.warn('[LoginScreen] Failed to fetch bundle config:', error);
      });
  };

  const themeColors = isDark ? COLORS.backgroundDark : COLORS.backgroundLight;
  const textColor = isDark ? COLORS.white : COLORS.slate900;
  const subTextColor = isDark ? COLORS.slate400 : COLORS.slate500;
  const inputBg = isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  const inputBorder = isDark ? COLORS.slate700 : COLORS.slate200;
  const socialBtnBg = isDark ? COLORS.slate800 : COLORS.white;
  const socialBtnBorder = isDark ? COLORS.slate700 : COLORS.slate200;

  return (
    <View style={[styles.container, { backgroundColor: themeColors }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Full Screen Mesh Gradient */}
      <MeshGradient isDark={isDark} />

      {/* Main Content */}
      <View style={styles.mainContent}>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, isDark ? styles.iconContainerDark : styles.iconContainerLight]}>
            <MaterialIcons name="bolt" size={32} color={COLORS.primary} />
          </View>
          <Text style={[styles.title, { color: textColor }]}>登录</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>欢迎回来</Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <MaterialIcons name="alternate-email" size={24} color={COLORS.slate400} />
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
              placeholder="邮箱地址"
              placeholderTextColor={COLORS.slate400}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <MaterialIcons name="lock" size={24} color={COLORS.slate400} />
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
              placeholder="密码"
              placeholderTextColor={COLORS.slate400}
              secureTextEntry={secureTextEntry}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setSecureTextEntry(!secureTextEntry)}
            >
              <MaterialIcons
                name={secureTextEntry ? "visibility" : "visibility-off"}
                size={24}
                color={COLORS.slate400}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <View style={styles.forgotPassword}>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>忘记密码？</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleLogin}>
            <Text style={styles.buttonText}>进入</Text>
            <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { borderTopColor: isDark ? COLORS.slate700 : COLORS.slate200 }]} />
            <View style={styles.dividerTextContainer}>
              <Text style={{ backgroundColor: themeColors, paddingHorizontal: 8, color: COLORS.slate500, fontSize: 14, fontWeight: '500' }}>或继续</Text>
            </View>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialGrid}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: socialBtnBg, borderColor: socialBtnBorder }]}>
              <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyGQWb5biHvs-Dz5qAyK_peD_YuXX6BtOmKnWzKJ10GNpZjbA0jKgXfOeFF6c2K25zu-xnGxRTOnu1JOGFXeraikEq1tfRIhO-GGXaY0y0dVVvT424kAhxiXGKjN3STi_PMPxa0kaB9YYTv5ZhnbB-esb7pPV6_jyzpJx5dXBr1eXnABFxJ-EfQfRGViHeQOfPlOcu2MhvkHc5nAVk3pJ329r3jEQUfueWLBY2IVuTqKue4EA5w9NTkTwLgspXabF1zT49xbinge7I' }} style={styles.socialIcon} />
              <Text style={[styles.socialText, { color: isDark ? COLORS.slate200 : COLORS.slate700 }]}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialButton, { backgroundColor: socialBtnBg, borderColor: socialBtnBorder }]}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW2cRwB1o7qWLWF9WMQMKExjdB1bjA2-kwqVVE5bS5Qlxe-F6_ld8hRhRtKwz3bnsc0ebjDpmF3GxXhQ3M6vVeQmU3nSs-GELw48PUTW2yDyQU7yRXCXNXCQre04nU5YNKBsUgxb13L-JFSHuUNfGO2sRkih31K1PKsc10Fu7bRl0Eua-LgQ2XbQgkxqX8_yfV9CErs_UjpCN-8kFioG0ZkhVP27Ru6RweD-fN0uB06px9xWEZTYYZh51Hzizy2KrOuaTzaZq76Caj' }}
                style={[styles.socialIcon, isDark && { tintColor: 'white' }]}
              />
              <Text style={[styles.socialText, { color: isDark ? COLORS.slate200 : COLORS.slate700 }]}>Apple</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: subTextColor }]}>
          还没有账户？{' '}
        </Text>
        <TouchableOpacity>
          <Text style={styles.signupText}>立即注册</Text>
        </TouchableOpacity>
      </View>

      {/* Home Indicator */}
      <View style={styles.homeIndicatorContainer}>
        <View style={[styles.homeIndicator, { backgroundColor: isDark ? COLORS.slate700 : COLORS.slate300 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Use minHeight logic from web if needed, but in RN flex:1 covers safe area usually
    // We'll rely on Flexbox to distribute space
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    maxWidth: 420, // max-w-[390px] a bit generous in RN
    width: '100%',
    alignSelf: 'center', // mx-auto
  },
  header: {
    marginBottom: 48,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24, // mb-6
  },
  iconContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Softer, lighter background for icon
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconContainerDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  title: {
    fontSize: 36, // text-4xl
    fontWeight: '800',
    marginBottom: 8, // mb-2
    letterSpacing: -1,
    fontFamily: 'System', // Fallback
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    gap: 24, // space-y-6 can be approximated with margin on items or gap in newer RN
  },
  inputGroup: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 68,
    paddingLeft: 48,
    paddingRight: 16, // pr-4, for password pr-12 handled by paddingRight + icon space if needed
    borderRadius: 34,
    borderWidth: 1,
    fontSize: 16,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    // marginBottom: 0, // removed margin bottom since we use form gap logic conceptually or explicit margins
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    width: '100%',
    height: 68, // higher
    backgroundColor: COLORS.primary,
    borderRadius: 34, // fully rounded
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  dividerContainer: {
    position: 'relative',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
  },
  dividerTextContainer: {
    position: 'relative',
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, // adjusted vertical padding for higher look
    borderRadius: 34, // fully rounded
    borderWidth: 1,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
  },
  socialText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingBottom: 48,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Space for home indicator
  },
  footerText: {
    fontWeight: '500',
    fontSize: 16,
  },
  signupText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  homeIndicatorContainer: {
    paddingBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  homeIndicator: {
    width: 128,
    height: 6,
    borderRadius: 3,
  },
});
