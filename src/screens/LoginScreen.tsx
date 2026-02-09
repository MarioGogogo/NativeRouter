import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Image,
  Platform,
  Keyboard,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppStore } from '../store/useAppStore';
import { fetchBundleConfigWithRetry } from '../services/BundleConfigService';
import { updateRemoteBundleConfig } from '../../index';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

// --- Design Tokens (与 index.html 保持一致) ---
const DESIGN_TOKENS = {
  colors: {
    primary: '#137fec',
    backgroundLight: '#f6f7f8',
    backgroundDark: '#101922',
  },
};

// --- Main Login Screen ---
export default function LoginScreen({ navigation }: LoginScreenProps) {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  // 表单状态
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  // 全局状态管理
  const { login } = useAppStore();

  // 主题颜色
  const themeColors = {
    background: isDark ? DESIGN_TOKENS.colors.backgroundDark : DESIGN_TOKENS.colors.backgroundLight,
    cardBg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#ffffff' : '#0d141b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textTertiary: isDark ? '#64748b' : '#64748b',
    divider: isDark ? '#334155' : '#e2e8f0',
  };

  // 登录处理
  const handleLogin = () => {
    Keyboard.dismiss();
    setLoading(true);

    // 模拟登录延迟
    setTimeout(() => {
      setLoading(false);
      login('mock-token-123', {
        name: 'React Native 开发者',
        level: 10,
        points: 8888,
      });

      // 跳转
      navigation.replace('MainTabs');

      // 后台获取分包配置
      fetchBundleConfigWithRetry()
        .then(config => updateRemoteBundleConfig(config))
        .catch(console.warn);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* 顶部图标和标题区域 */}
      <View style={styles.headerSection}>
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: isDark
                ? 'rgba(19, 126, 236, 0.2)'
                : 'rgba(19, 126, 236, 0.1)',
            },
          ]}
        >
          <MaterialIcons
            name="account_balance"
            size={40}
            color={DESIGN_TOKENS.colors.primary}
          />
        </View>
        <Text style={[styles.appSubtitle, { color: themeColors.textSecondary }]}>
          政务通 移动版
        </Text>
      </View>

      {/* 欢迎区域 */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeTitle, { color: themeColors.text }]}>
          欢迎回来
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: themeColors.textSecondary }]}>
          登录以安全地访问您的数字化政务服务。
        </Text>
      </View>

      {/* 表单区域 */}
      <View style={styles.formSection}>
        {/* 账号输入 */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: themeColors.text }]}>
            身份证号或手机号
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <MaterialIcons
              name="person"
              size={22}
              color="#94a3b8"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="请输入您的账号"
              placeholderTextColor="#94a3b8"
              value={account}
              onChangeText={setAccount}
              keyboardType="default"
            />
          </View>
        </View>

        {/* 密码输入 */}
        <View style={styles.inputContainer}>
          <View style={styles.passwordLabelRow}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>密码</Text>
          </View>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <MaterialIcons
              name="lock"
              size={22}
              color="#94a3b8"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="请输入密码"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
            />
            <TouchableOpacity
              onPress={() => setSecureTextEntry(!secureTextEntry)}
              style={styles.toggleButton}
            >
              <MaterialIcons
                name={secureTextEntry ? 'visibility' : 'visibility-off'}
                size={22}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>忘记密码？</Text>
          </TouchableOpacity>
        </View>

        {/* 登录按钮 */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            {
              backgroundColor: DESIGN_TOKENS.colors.primary,
              shadowColor: DESIGN_TOKENS.colors.primary,
            },
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <View style={styles.loginButtonContent}>
            <Text style={styles.loginButtonText}>
              {loading ? '登录中...' : '登录'}
            </Text>
            {!loading && (
              <MaterialIcons
                name="arrow_forward"
                size={20}
                color="white"
                style={styles.loginButtonIcon}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* 分隔线 */}
        <View style={styles.dividerContainer}>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: themeColors.divider },
            ]}
          />
          <Text
            style={[
              styles.dividerText,
              { color: themeColors.textTertiary },
            ]}
          >
            快速访问
          </Text>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: themeColors.divider },
            ]}
          />
        </View>

        {/* 快速访问按钮 */}
        <View style={styles.quickAccessRow}>
          <TouchableOpacity
            style={[
              styles.quickAccessButton,
              {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="face"
              size={28}
              color={DESIGN_TOKENS.colors.primary}
            />
            <Text style={[styles.quickAccessLabel, { color: themeColors.text }]}>
              面容识别
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAccessButton,
              {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="sms"
              size={28}
              color={DESIGN_TOKENS.colors.primary}
            />
            <Text style={[styles.quickAccessLabel, { color: themeColors.text }]}>
              短信验证码
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 底部注册链接 */}
      <View style={styles.footerSection}>
        <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
          还没有账号？
        </Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>立即注册</Text>
        </TouchableOpacity>
      </View>

      {/* 底部合作伙伴图标 */}
      <View style={styles.partnersContainer}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDscazdea7nNxnORt2jh0cnksPWGTL4IbdadUI45OmAvJqeOB4gWouOnupogyjOZgyj1gqS-szETq37Mo_Hw2hOiIVRrWoEXvTwaonAnXyzWS5yjO8T7ejFltt71wXXtvxrDAH1j4eiC5DQ8D-OwCpBvD0Xkny4LMpAawmNLfBoU4JYMShbEI5_3CFFeaVdlDD5Mg421foKB0uI75ZV-wCO8AuGPpYOVXvLgkMDiNKWb4aMnEaKuoG68s05wUr4wGx4-ug_w63iypM',
          }}
          style={styles.partnerIcon}
          alt="Official government partnership logo"
        />
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Welcome
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Form
  formSection: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButton: {
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
  forgotPasswordText: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  // Login Button
  loginButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  loginButtonIcon: {
    marginLeft: 8,
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // Quick Access
  quickAccessRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  quickAccessButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  quickAccessLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Footer
  footerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerLink: {
    color: DESIGN_TOKENS.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Partners
  partnersContainer: {
    alignItems: 'center',
    opacity: 0.4,
  },
  partnerIcon: {
    height: 24,
    resizeMode: 'contain',
  },
});
