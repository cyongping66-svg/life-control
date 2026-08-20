import { defineConfig, type UserConfigExport } from '@tarojs/cli';

export default defineConfig<'webpack5'>(async (_merge, { command, mode }) => {
  const config: UserConfigExport<'webpack5'> = {
    projectName: '人生浪费指南',
    date: '2026-8-20',
    designWidth: 750,
    deviceRatio: { 750: 1 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: true },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false },
      },
    },
  };
  return command === 'build' ? { ...config, mode } : config;
});
