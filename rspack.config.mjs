/*
 * @Author: EdisonChan 148373644@qq.com
 * @Date: 2026-01-16 16:21:53
 * @LastEditors: EdisonChan 148373644@qq.com
 * @LastEditTime: 2026-01-16 16:34:53
 * @FilePath: /NativeRouter/rspack.config.mjs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
      platform: 'android', // 明确指定平台
      // 多分包配置：每个功能模块独立打包
      extraChunks: [
        {
          include: /feature/,
          type: 'remote',
          outputPath: path.join(__dirname, 'build/output/android/remote'),
        },
        {
          include: /settings/,
          type: 'remote',
          outputPath: path.join(__dirname, 'build/output/android/remote'),
        },
        {
          include: /shop/,
          type: 'remote',
          outputPath: path.join(__dirname, 'build/output/android/remote'),
        },
        {
          include: /update/,
          type: 'remote',
          outputPath: path.join(__dirname, 'build/output/android/remote'),
        },
      ],
    }),
  ],
});
