#!/bin/bash

# ============================================
# Android APK 构建脚本 - 使用 Re.Pack (支持代码分割)
# 用法: ./scripts/build-android-repack.sh [debug|release]
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 构建类型 (默认 release)
BUILD_TYPE="${1:-release}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  React Native Android APK 构建脚本 (Re.Pack)${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}构建类型: ${BUILD_TYPE}${NC}"
echo -e "${YELLOW}项目路径: ${PROJECT_ROOT}${NC}"
echo ""

# Step 1: 清理旧的打包文件
echo -e "${GREEN}[1/5] 清理旧的 bundle 文件...${NC}"
rm -rf android/app/src/main/assets/*.bundle*
rm -rf android/app/build/generated/assets/react/release/*
rm -rf build/output
mkdir -p android/app/src/main/assets
mkdir -p android/app/build/generated/assets/react/release

# Step 2: 使用 Re.Pack webpack 打包 JS Bundle (支持代码分割)
echo -e "${GREEN}[2/5] 使用 Re.Pack webpack 打包 JS Bundle (支持代码分割)...${NC}"

if [ "$BUILD_TYPE" = "debug" ]; then
    echo -e "${YELLOW}  Debug 模式：从 DevServer 加载（不支持代码分割）${NC}"
    npx react-native bundle \
        --entry-file index.js \
        --platform android \
        --dev true \
        --bundle-output android/app/src/main/assets/index.android.bundle \
        --assets-dest android/app/src/main/res
else
    echo -e "${YELLOW}  Release 模式：使用 webpack 打包（支持代码分割）${NC}"
    NODE_ENV=production npx webpack-cli \
        --config webpack.config.js \
        --env mini-app=true \
        --env platform=android \
        --env dev=false \
        --progress
fi

# Step 3: 显示打包结果
echo -e "${GREEN}[3/5] Bundle 打包完成，检查生成的文件...${NC}"
echo -e "${YELLOW}主包文件:${NC}"
ls -lh android/app/build/generated/assets/react/release/index.android.bundle 2>/dev/null || \
    ls -lh android/app/src/main/assets/index.android.bundle 2>/dev/null || \
    echo "  无主 bundle 文件"

echo ""
echo -e "${YELLOW}分包文件 (Chunk):${NC}"
find android/app/build/generated/assets/react/release -name "*.chunk.bundle" 2>/dev/null | while read file; do
    echo "  $(basename "$file"): $(ls -lh "$file" | awk '{print $5}')"
done || echo "  无 chunk 文件（可能全部在主包中）"
echo ""

# 检查远程分包
if [ -d "build/output" ]; then
    echo -e "${YELLOW}远程分包输出:${NC}"
    find build/output -name "*.bundle" -exec ls -lh {} \; 2>/dev/null || echo "  无远程分包"
    echo ""
fi

# Step 4: 生成 Codegen 并构建 APK
echo -e "${GREEN}[4/5] 生成 Codegen 并构建 Android APK...${NC}"
cd android

# 先确保 codegen 生成（New Architecture 需要）
echo -e "${YELLOW}  -> 运行 codegen...${NC}"
./gradlew generateCodegenArtifactsFromSchema --quiet

if [ "$BUILD_TYPE" = "debug" ]; then
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

cd ..

# Step 5: 显示结果
echo ""
echo -e "${GREEN}[5/5] 构建完成!${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -f "android/$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "android/$APK_PATH" | awk '{print $5}')
    echo -e "${GREEN}✅ APK 生成成功!${NC}"
    echo -e "   路径: ${YELLOW}android/$APK_PATH${NC}"
    echo -e "   大小: ${YELLOW}$APK_SIZE${NC}"
    echo ""

    # 询问是否安装到设备
    echo -e "${BLUE}安装到设备: ${NC}"
    echo -e "   adb install -r android/$APK_PATH"
    echo ""

    # 复制 APK 到项目根目录方便访问
    cp "android/$APK_PATH" "./NativeRouter-${BUILD_TYPE}.apk"
    echo -e "${GREEN}已复制 APK 到项目根目录: NativeRouter-${BUILD_TYPE}.apk${NC}"
else
    echo -e "${RED}❌ APK 生成失败，请检查错误日志${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
