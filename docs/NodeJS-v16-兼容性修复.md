# Node.js v16 兼容性修复

## 问题描述

Re.Pack 5.2.3 和 Metro 在 Node.js v16 环境下存在以下兼容性问题：

1. **`availableParallelism` 方法不存在**：Node.js v16 的 `os` 模块没有 `availableParallelism()` 方法，该方法是在 Node.js v19.9.0 中添加的。
2. **`toReversed` 数组方法不存在**：`Array.prototype.toReversed()` 是 Node.js v20+ 的方法。

## 错误信息

```
TypeError: _os.default.availableParallelism is not a function
    at getMaxWorkers (node_modules/metro-config/src/defaults/getMaxWorkers.js:12:29)
```

```
TypeError: configs.toReversed is not a function
    at mergeConfig (node_modules/metro-config/src/loadConfig.js:179:35)
```

## 解决方案

### 方案 1：修复 node_modules 文件（临时解决方案）

已修复以下文件：

#### 1. `node_modules/metro-config/src/defaults/getMaxWorkers.js`

```javascript
function getMaxWorkers(workers) {
  // Node.js v16 兼容性修复：availableParallelism 不存在
  const cores = _os.default.availableParallelism
    ? _os.default.availableParallelism()
    : (_os.default.cpus ? _os.default.cpus().length : 4);
  return typeof workers === "number" && Number.isInteger(workers)
    ? Math.min(cores, workers > 0 ? workers : 1)
    : Math.max(1, Math.ceil(cores * (0.5 + 0.5 * Math.exp(-cores * 0.07)) - 1));
}
```

#### 2. `node_modules/metro-config/src/loadConfig.js`

将 `toReversed()` 替换为 `slice().reverse()`：

```javascript
// 第 179 行
const reversedConfigs = configs.slice().reverse(); // Node.js v16 兼容性：用 reverse() 替代 toReversed()

// 第 184 行
return mergeConfigAsync(nextConfig, reversedConfigs.slice().reverse()); // Node.js v16 兼容性
```

### 方案 2：升级 Node.js 版本（推荐）

Re.Pack 5.x 和 React Native 0.83.x 推荐使用 Node.js v20 或更高版本：

```bash
# 使用 nvm 安装 Node.js v20
nvm install 20
nvm use 20
nvm alias default 20  # 设置为默认版本
```

升级后，可以：
- 使用 Re.Pack 的远程分包功能（`type: 'remote'`）
- 获得更好的构建性能
- 避免兼容性问题

## 当前构建状态

由于 Node.js v16 的限制，当前构建使用 Metro 打包（不支持远程代码分割）：

```
⚠️  警告：Re.Pack 5.x 需要 Node.js v19 或更高版本
当前 Node.js 版本：v16.19.1
将使用 Metro 打包（不支持远程代码分割）
```

**影响：**
- ✅ APK 可以正常构建
- ✅ 应用可以正常运行
- ❌ 远程代码分割功能不可用
- ❌ 所有页面都打包到主 bundle 中

## 如何启用远程代码分割

1. **升级 Node.js 到 v20+**
2. **运行构建脚本**：
   ```bash
   npm run build:android
   ```
3. **验证远程分包生成**：
   ```bash
   ls -la build/output/android/remote/
   ```
   应该看到以下文件：
   - `feature.chunk.bundle`
   - `settings.chunk.bundle`
   - `shop.chunk.bundle`

4. **上传远程分包到服务器**
5. **配置 `index.js` 中的 `remoteBundleConfig`** 指向服务器 URL

## 重新应用修复

如果运行 `npm install`，修复会被覆盖。需要重新应用：

```bash
# 修复 getMaxWorkers.js
cat > node_modules/metro-config/src/defaults/getMaxWorkers.js << 'EOF'
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = getMaxWorkers;
var _os = _interopRequireDefault(require("os"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function getMaxWorkers(workers) {
  // Node.js v16 兼容性修复：availableParallelism 不存在
  const cores = _os.default.availableParallelism
    ? _os.default.availableParallelism()
    : (_os.default.cpus ? _os.default.cpus().length : 4);
  return typeof workers === "number" && Number.isInteger(workers)
    ? Math.min(cores, workers > 0 ? workers : 1)
    : Math.max(1, Math.ceil(cores * (0.5 + 0.5 * Math.exp(-cores * 0.07)) - 1));
}
EOF

# 修复 loadConfig.js
sed -i '' 's/configs\.toReversed()/configs.slice().reverse()/g' node_modules/metro-config/src/loadConfig.js
```

## 相关文件

- [rspack.config.mjs](../rspack.config.mjs) - Re.Pack 配置（需要 Node.js v19+）
- [scripts/build-android.sh](../scripts/build-android.sh) - Android APK 构建脚本
- [index.js](../index.js) - ScriptManager 配置（远程分包加载）
