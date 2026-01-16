const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const os = require('os');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// 修复 Node.js v16 兼容性：为 os 模块添加 availableParallelism
if (!os.availableParallelism) {
  os.availableParallelism = () => {
    const cpus = os.cpus();
    return cpus ? cpus.length : 4;
  };
}

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
