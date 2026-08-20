import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { IS_LOCAL_MODE } from '../../lib/api';
import { resetLocalData } from '../../lib/local-api';

const areas = [
  { title: '财务管理', detail: '卡包、账号、贷款与信用提醒', path: '/pages/finance/index' },
  { title: '职业生涯', detail: '目标、简历与副业进展', path: '/pages/career/index' },
  { title: '社交关系', detail: '同学录、生日与联系记录', path: '/pages/social/index' },
];

export default function HomePage() {
  const resetPreview = async () => {
    const result = await Taro.showModal({
      title: '清空本机数据？',
      content: '问答、规划、联系人和提醒都会被删除，此操作无法撤销。',
      confirmText: '确认清空',
      confirmColor: '#a33a2b',
    });
    if (result.confirm) {
      await resetLocalData();
      await Taro.showToast({ title: '已清空', icon: 'success' });
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">LIFE WASTE GUIDE</Text>
        <View className="title">把人生浪费在更重要的事上</View>
        <View className="subtitle">在这里托管琐事，理清问题，并保留自己的生活节奏。</View>
        {IS_LOCAL_MODE && <View className="tag">本机预览模式 · 数据不会上传</View>}
      </View>
      <Button className="button" onClick={() => Taro.switchTab({ url: '/pages/ask/index' })}>
        现在问一个问题
      </Button>
      <View className="section-title">我的人生面板</View>
      {areas.map((area) => (
        <View className="card" key={area.path} onClick={() => Taro.switchTab({ url: area.path })}>
          <View className="card-title">{area.title}</View>
          <View className="muted">{area.detail}</View>
        </View>
      ))}
      <View className="card" onClick={() => Taro.navigateTo({ url: '/pages/reminders/index' })}>
        <View className="card-title">提醒中心</View>
        <View className="muted">查看生日、账单日与目标提醒</View>
      </View>
      {IS_LOCAL_MODE && (
        <Button className="button secondary danger" onClick={resetPreview}>
          清空本机预览数据
        </Button>
      )}
    </View>
  );
}
