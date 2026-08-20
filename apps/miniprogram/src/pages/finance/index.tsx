import { Button, Input, Picker, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { useResource } from '../../lib/use-resource';

type FinanceItem = {
  id: string;
  kind: string;
  institution: string;
  alias: string | null;
  lastFour: string | null;
};

const kinds = [
  ['bank-card', '银行卡'],
  ['payment-account', '支付账号'],
  ['loan', '贷款'],
  ['credit', '信用事项'],
] as const;

export default function FinancePage() {
  const { items, create, remove } = useResource<FinanceItem>('/finance-items');
  const [kindIndex, setKindIndex] = useState(0);
  const [institution, setInstitution] = useState('');
  const [alias, setAlias] = useState('');
  const [lastFour, setLastFour] = useState('');

  const submit = async () => {
    if (!institution.trim()) return;
    try {
      await create({
        kind: kinds[kindIndex]?.[0] ?? 'bank-card',
        institution: institution.trim(),
        alias: alias.trim() || null,
        lastFour: lastFour || null,
      });
      setInstitution('');
      setAlias('');
      setLastFour('');
    } catch {
      await Taro.showToast({ title: '保存失败，请检查尾号', icon: 'none' });
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <View className="title">管信息，不管密码</View>
        <View className="subtitle">
          这里只记录机构、别名和尾号。请勿填写完整卡号、密码或验证码。
        </View>
      </View>
      <View className="card">
        <Picker
          mode="selector"
          range={kinds.map((kind) => kind[1])}
          value={kindIndex}
          onChange={(event) => setKindIndex(Number(event.detail.value))}
        >
          <View className="input">{kinds[kindIndex]?.[1]}</View>
        </Picker>
        <Input
          className="input"
          value={institution}
          placeholder="机构名称"
          onInput={(e) => setInstitution(e.detail.value)}
        />
        <Input
          className="input"
          value={alias}
          placeholder="别名（可选）"
          onInput={(e) => setAlias(e.detail.value)}
        />
        <Input
          className="input"
          type="number"
          maxlength={4}
          value={lastFour}
          placeholder="尾号 4 位（可选）"
          onInput={(e) => setLastFour(e.detail.value)}
        />
        <Button className="button" onClick={submit}>
          保存
        </Button>
      </View>
      <View className="section-title">我的财务事项</View>
      {items.map((item) => (
        <View className="card" key={item.id}>
          <View className="tag">{item.kind}</View>
          <View className="card-title">{item.alias || item.institution}</View>
          <View className="muted">
            {item.institution}
            {item.lastFour ? ` · 尾号 ${item.lastFour}` : ''}
          </View>
          <Button className="button secondary" onClick={() => remove(item.id)}>
            删除
          </Button>
        </View>
      ))}
    </View>
  );
}
