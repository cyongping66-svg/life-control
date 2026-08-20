import Taro, { useDidShow } from '@tarojs/taro';
import { useCallback, useState } from 'react';
import { apiRequest } from './api';

export function useResource<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await apiRequest<T[]>(path));
    } catch {
      await Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [path]);

  useDidShow(() => void refresh());

  const create = async (data: unknown) => {
    await apiRequest(path, { method: 'POST', data });
    await refresh();
  };

  const remove = async (id: string) => {
    await apiRequest(`${path}/${id}`, { method: 'DELETE' });
    await refresh();
  };

  return { items, loading, create, remove, refresh };
}
