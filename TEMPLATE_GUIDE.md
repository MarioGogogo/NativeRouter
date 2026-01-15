# Re.Pack React Native 项目模板使用指南

本指南记录了在真机运行、分包加载中遇到的关键问题，并说明了如何将本项目作为模板用于新项目开发。

## ⚠️ 关键问题与原理：分包加载失败 (Chunk Loading Failed)

### 现象
在真机上报错 `Loading chunk [name] failed`，且错误信息中提示 `exec: [name]`。

### 原因：命名空间不匹配 (Namespace Mismatch)
Re.Pack (基于 Webpack/Rspack) 使用全局变量来存储和加载分包代码。这个全局变量的名称默认由项目名称决定，格式为 `webpackChunk[ProjectName]`。

*   **主包 (Host)**: 期望从 `webpackChunkNativeRouter` 读取代码。
*   **分包 (Remote)**: 编译时如果使用了旧名称（如 `NebulaRN2`），它会把代码存入 `webpackChunkNebulaRN2`。

**后果**: 主包去错误的变量里找代码，导致加载失败。

---

## 🚀 模板化指南：如何改为新项目

如果你使用此项目作为模板创建一个新应用（例如命名为 `MyNewApp`），**必须**修改以下所有文件以确保主包和分包的命名空间一致。

### 1. 基础项目名称 (4处)

*   **`package.json`**:
    ```json
    "name": "MyNewApp"
    ```
*   **`app.json`**:
    ```json
    "name": "MyNewApp",
    "displayName": "MyNewApp"
    ```

### 2. Android 原生配置 (3处)

*   **`android/settings.gradle`**:
    ```gradle
    rootProject.name = 'MyNewApp'
    ```
*   **`android/app/src/main/java/com/[package]/MainActivity.kt`**:
    ```kotlin
    override fun getMainComponentName(): String = "MyNewApp"
    ```
    *(注意：通常也建议同步修改包名 `package com.mynewapp` 和目录结构)*
*   **`android/app/src/main/res/values/strings.xml`**:
    ```xml
    <string name="app_name">MyNewApp</string>
    ```

### 3. iOS 原生配置 (2处)

*   **`ios/Podfile`**:
    ```ruby
    target 'MyNewApp' do
    ```
*   **`AppDelegate.mm`** (如果在 iOS 上运行):
    `moduleName` 需要改为 `MyNewApp`。

### 4. 关键：Re.Pack 构建配置 (1处) ⭐️⭐️⭐️

这是最容易忽略但会导致分包加载失败的地方。

*   **`rspack.config.mjs`**:
    ```javascript
    export default Repack.defineRspackConfig({
      // ...
      output: {
        // 必须与分包构建时的名称一致！
        // 如果你的分包也是在这个项目里构建的，这里改了之后，分包也会自动用新名字，一切正常。
        // 如果你的分包是独立项目构建的，必须确保两边的 uniqueName 完全一致。
        uniqueName: 'MyNewApp', 
      },
      // ...
    });
    ```

### 5. 分包配置 (如适用)

如果你的**远程分包**是独立维护的（即不在同一个 Git 仓库，或者单独构建）：
*   确保构建分包的项目配置了**相同**的 `uniqueName: 'MyNewApp'`。
*   如果分包名字不一致，主包永远无法加载它。

---

## 🛠 调试检查清单

如果遇到 `Loading chunk failed`：
1.  **解压 APK Check**: 解压 `apk`，查看 `assets/index.android.bundle`。
2.  **搜索关键字**: 搜索 `self["webpackChunk..."]` 或 `self.webpackChunk...`。
3.  **对比**: 确认主包里的变量名（如 `webpackChunkMyNewApp`）是否与你下载的远程分包里的变量名完全一致。

## ❓ 常见问题 (FAQ)

### Q: 为什么在本地开发模式 (Debug) 下开启远程加载会报错 `RuntimeError: factory undefined`？
**A: 这是因为构建模式不兼容。**
*   **Debug 模式 (本地开发)**: 使用字符串形式的模块 ID，包含热更新代码 (`dev=true`)。
*   **Release 模式 (远程分包)**: 使用数字形式的模块 ID，经过压缩优化 (`dev=false`)。
*   **冲突**: 当 Debug 主包尝试加载 Release 分包时，由于模块系统内部结构不同，无法找到模块定义，导致应用崩溃。

**结论**: 
*   ❌ **不要**在 `npm start` (Debug) 模式下加载线上的 Release 分包。
*   ✅ **本地开发**：请使用默认的本地 DevServer，分包由本地服务提供。
*   ✅ **测试远程加载**：请构建并安装 Release 包 (`npm run build:android`)，只有 Release 主包才能加载 Release 分包。
