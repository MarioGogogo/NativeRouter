/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { ScriptManager, Script } from '@callstack/repack/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from './App';
import { fetchBundleConfigWithRetry } from './src/services/BundleConfigService';

const appJson = require('./app.json');
const appName = appJson.name;

// 远程分包配置（完全由 API 动态提供）
let remoteBundleConfig = {};

// 初始化配置
if (__DEV__) {
  console.log(
    '[Index] Running in development mode (Local), skipping cloud config...',
  );
} else {
  // 生产环境：从云端获取最新的分包配置
  console.log('[Index] Running in Production mode, fetching cloud config...');
  fetchBundleConfigWithRetry()
    .then(config => {
      console.log('[Index] Cloud bundle config loaded successfully:', config);
      updateRemoteBundleConfig(config);
    })
    .catch(error => {
      console.error('[Index] Failed to load cloud bundle config:', error);
      // 失败时使用之前缓存的配置或等待手动更新
    });
}

// 更新回调（供 App.tsx 设置）
let onVersionCheckCallback = null;

// 设置版本检查回调
export function setVersionCheckCallback(callback) {
  onVersionCheckCallback = callback;
  console.log('[ScriptManager] Version check callback set');
}

// 确认更新某个分包（用户点击更新对话框的确认按钮后调用）
// 返回 true 表示需要重新加载
export function confirmBundleUpdate(screen, version) {
  const oldVersion = loadedVersions[screen];
  loadedVersions[screen] = version;
  console.log(
    `[ScriptManager] Bundle ${screen} confirmed: ${oldVersion} -> ${version}`,
  );
  return oldVersion && oldVersion !== version;
}

// 更新远程分包配置（供外部调用）
export function updateRemoteBundleConfig(config) {
  // 在更新配置前，保存旧版本到 loadedVersions（如果还没有记录的话）
  // 这样当新版本到来时，我们可以检测到变化
  for (const scriptId in config) {
    const oldConfig = remoteBundleConfig[scriptId];
    if (oldConfig && !loadedVersions[scriptId]) {
      const oldVersion =
        typeof oldConfig === 'string' ? null : oldConfig.version;
      if (oldVersion) {
        loadedVersions[scriptId] = oldVersion;
        console.log(
          `[ScriptManager] Initialize loadedVersions for ${scriptId}: ${oldVersion}`,
        );
      }
    }
  }

  remoteBundleConfig = { ...remoteBundleConfig, ...config };

  console.log(
    '[ScriptManager] Remote bundle config updated:',
    remoteBundleConfig,
  );
  console.log('[ScriptManager] Loaded versions:', loadedVersions);
}

// 检查分包配置是否存在（供外部调用）
export function isBundleConfigured(scriptId) {
  // 开发模式下总是返回 true（使用 DevServer）
  if (__DEV__) {
    return true;
  }
  const config = remoteBundleConfig[scriptId];
  return !!config;
}

// 直接检查某个分包是否有更新（供外部调用）
export async function checkBundleVersion(scriptId) {
  const config = remoteBundleConfig[scriptId];
  if (!config) {
    // 如果没有配置且是在本地开发模式下，这是正常的，不报警
    if (__DEV__) {
      return null;
    }
    console.warn(`[ScriptManager] No config for chunk: ${scriptId}`);
    return null;
  }

  const latestVersion = typeof config === 'string' ? null : config.version;
  if (!latestVersion) {
    return null;
  }

  const cachedVersion = loadedVersions[scriptId];
  // 只有当已经加载过且版本不同时才是更新
  const isUpdateAvailable = cachedVersion && cachedVersion !== latestVersion;

  console.log(
    `[ScriptManager] Check version for ${scriptId}: cached=${cachedVersion}, latest=${latestVersion}, isUpdateAvailable=${isUpdateAvailable}`,
  );

  if (isUpdateAvailable) {
    return {
      screen: scriptId,
      currentVersion: cachedVersion,
      latestVersion: latestVersion,
      isUpdateAvailable: true,
    };
  }

  return null;
}

// 配置 ScriptManager 用于代码分割（使用 AsyncStorage 实现可靠的缓存管理）
ScriptManager.shared.setStorage(AsyncStorage);

// 缓存已加载的模块版本信息（首次加载后记录版本，用于后续比较）
const loadedVersions = {};

ScriptManager.shared.addResolver(async scriptId => {
  console.log(`[ScriptManager] Resolving: ${scriptId}, DEV: ${__DEV__}`);

  // 开发模式：从 DevServer 加载所有分包
  if (__DEV__) {
    const devUrl = Script.getDevServerURL(scriptId);
    console.log(`[ScriptManager] DevServer URL: ${devUrl}`);
    return { url: devUrl, cache: false };
  }

  // 生产模式：从远程服务器加载分包
  const config = remoteBundleConfig[scriptId];
  if (!config) {
    console.warn(`[ScriptManager] No config configured for chunk: ${scriptId}`);
    throw new Error(`Chunk ${scriptId} not configured`);
  }

  const url = typeof config === 'string' ? config : config.url;
  const latestVersion = typeof config === 'string' ? null : config.version;
  const cachedVersion = loadedVersions[scriptId];

  // 在 URL 中添加版本参数，让 Re.Pack 自动检测变化
  const versionedUrl = latestVersion ? `${url}?v=${latestVersion}` : url;

  // 首次加载时，记录版本
  if (!cachedVersion && latestVersion) {
    loadedVersions[scriptId] = latestVersion;
    console.log(
      `[ScriptManager] First load ${scriptId} version: ${latestVersion}`,
    );
  }

  console.log(
    `[ScriptManager] Loading remote chunk: ${scriptId} from ${versionedUrl}`,
  );
  return {
    url: versionedUrl,
    cache: true, // Re.Pack 会基于 URL 变化自动更新缓存
  };
});

AppRegistry.registerComponent(appName, () => App);
