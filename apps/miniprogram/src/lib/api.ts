import Taro from '@tarojs/taro';

const API_BASE = process.env.TARO_APP_API_BASE ?? 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'life-control-token';
let loginPromise: Promise<string> | null = null;

export async function login(): Promise<string> {
  const existing = Taro.getStorageSync<string>(TOKEN_KEY);
  if (existing) return existing;
  if (loginPromise) return loginPromise;
  loginPromise = (async () => {
    try {
      const { code } = await Taro.login();
      const result = await publicRequest<{ accessToken: string }>('/auth/wechat', {
        method: 'POST',
        data: { code },
      });
      Taro.setStorageSync(TOKEN_KEY, result.accessToken);
      return result.accessToken;
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error;
      const result = await publicRequest<{ accessToken: string }>('/auth/development', {
        method: 'POST',
        data: { displayName: '小程序体验用户' },
      });
      Taro.setStorageSync(TOKEN_KEY, result.accessToken);
      return result.accessToken;
    } finally {
      loginPromise = null;
    }
  })();
  return loginPromise;
}

export async function apiRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; data?: unknown } = {},
) {
  const token = await login();
  const response = await Taro.request<T>({
    url: `${API_BASE}${path}`,
    method: options.method ?? 'GET',
    data: options.data,
    header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`请求失败（${response.statusCode}）`);
  }
  return response.data;
}

async function publicRequest<T>(
  path: string,
  options: { method: 'POST'; data: unknown },
): Promise<T> {
  const response = await Taro.request<T>({
    url: `${API_BASE}${path}`,
    method: options.method,
    data: options.data,
    header: { 'Content-Type': 'application/json' },
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`登录失败（${response.statusCode}）`);
  }
  return response.data;
}

export async function copyExternalLink(url: string) {
  await Taro.setClipboardData({ data: url });
  await Taro.showToast({ title: '链接已复制，请到原平台打开', icon: 'none' });
}
