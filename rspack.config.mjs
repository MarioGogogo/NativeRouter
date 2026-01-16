import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Rspack configuration enhanced with Re.Pack defaults for React Native.
 *
 * Learn about Rspack configuration: https://rspack.dev/config/
 * Learn about Re.Pack configuration: https://re-pack.dev/docs/guides/configuration
 */

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: './index.js',
  output: {
    uniqueName: 'NativeRouter', // 确认远程分包已更新为 NativeRouter，保持一致
  },
  resolve: {
    ...Repack.getResolveOptions(),
  },
  module: {
    rules: [
      {
        test: /\.[cm]?[jt]sx?$/,
        type: 'javascript/auto',
        use: {
          loader: '@callstack/repack/babel-swc-loader',
          parallel: true,
          options: {},
        },
      },
      ...Repack.getAssetTransformRules(),
    ],
  },
  plugins: [
    new Repack.RepackPlugin({
      // 多分包配置：每个功能模块独立打包
      extraChunks: [
        {
          include: /feature/,
          type: 'local',  // 改为 local，打包到 APK 中
        },
        {
          include: /settings/,
          type: 'local',  // 改为 local，打包到 APK 中
        },
        {
          include: /shop/,
          type: 'local',  // 改为 local，打包到 APK 中
        },
      ],
    }),
  ],
});
