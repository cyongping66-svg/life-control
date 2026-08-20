import Taro, { useLaunch } from '@tarojs/taro';
import type { PropsWithChildren } from 'react';
import { login } from './lib/api';
import './app.scss';

export default function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    void login().catch(() => {
      Taro.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
    });
  });
  return children;
}
