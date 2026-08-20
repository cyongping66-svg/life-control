import Taro, { useLaunch } from '@tarojs/taro';
import type { PropsWithChildren } from 'react';
import { IS_LOCAL_MODE, login } from './lib/api';
import { getDueLocalReminders } from './lib/local-api';
import './app.scss';

export default function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    void login().catch(() => {
      Taro.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
    });
    if (IS_LOCAL_MODE) {
      const reminders = getDueLocalReminders();
      if (reminders.length > 0) {
        void Taro.showModal({
          title: '到期提醒',
          content: reminders
            .slice(0, 5)
            .map((item) => `· ${String(item.title)}`)
            .join('\n'),
          showCancel: false,
          confirmText: '知道了',
        });
      }
    }
  });
  return children;
}
