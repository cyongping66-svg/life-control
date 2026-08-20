import { Button, Input, Picker, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { IS_LOCAL_MODE } from '../../lib/api';
import { useResource } from '../../lib/use-resource';

type Reminder = {
  id: string;
  title: string;
  remindAt: string;
  channel: string;
  status: string;
};

export default function RemindersPage() {
  const { items, create, remove } = useResource<Reminder>('/reminders');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');

  const submit = async (wechat: boolean) => {
    if (!title.trim()) return;
    let channel = 'in-app';
    if (wechat) {
      const templateId = process.env.TARO_APP_WECHAT_REMINDER_TEMPLATE_ID;
      if (!templateId) {
        await Taro.showToast({ title: '微信提醒模板尚未配置，将改为应用内提醒', icon: 'none' });
      } else {
        const result = await Taro.requestSubscribeMessage({
          tmplIds: [templateId],
          entityIds: [],
        });
        if ((result as Record<string, string>)[templateId] === 'accept') channel = 'wechat';
      }
    }
    try {
      await create({
        title: title.trim(),
        remindAt: new Date(`${date}T${time}:00`).toISOString(),
        channel,
      });
      setTitle('');
    } catch {
      await Taro.showToast({ title: '提醒创建失败', icon: 'none' });
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <View className="title">别靠记忆硬撑</View>
        <View className="subtitle">
          {IS_LOCAL_MODE
            ? '预览模式会在你下次打开小程序时提示到期事项。'
            : '微信提醒每次都需要你的主动授权；未授权时仍可在这里查看。'}
        </View>
      </View>
      <View className="card">
        <Input
          className="input"
          value={title}
          placeholder="提醒事项"
          onInput={(e) => setTitle(e.detail.value)}
        />
        <View className="row">
          <Picker mode="date" value={date} onChange={(e) => setDate(e.detail.value)}>
            <View className="input">{date}</View>
          </Picker>
          <Picker mode="time" value={time} onChange={(e) => setTime(e.detail.value)}>
            <View className="input">{time}</View>
          </Picker>
        </View>
        <Button className="button" onClick={() => submit(false)}>
          创建应用内提醒
        </Button>
        {!IS_LOCAL_MODE && (
          <Button className="button secondary" onClick={() => submit(true)}>
            授权并创建微信提醒
          </Button>
        )}
      </View>
      <View className="section-title">我的提醒</View>
      {items.map((item) => (
        <View className="card" key={item.id}>
          <View className="tag">
            {item.channel} · {item.status}
          </View>
          <View className="card-title">{item.title}</View>
          <View className="muted">{new Date(item.remindAt).toLocaleString()}</View>
          <Button className="button secondary" onClick={() => remove(item.id)}>
            取消
          </Button>
        </View>
      ))}
    </View>
  );
}
