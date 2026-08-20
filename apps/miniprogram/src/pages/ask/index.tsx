import { Button, Textarea, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiRequest, copyExternalLink } from '../../lib/api';

type Answer = {
  id: string;
  question: string;
  answer: string;
  category: string;
  disclaimer: string | null;
  sources: Array<{ id: string; platform: string; title: string; summary: string; url: string }>;
};

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [asking, setAsking] = useState(false);

  const loadHistory = async () => {
    try {
      setAnswers(await apiRequest<Answer[]>('/questions'));
    } catch {
      await Taro.showToast({ title: '历史记录加载失败', icon: 'none' });
    }
  };
  useDidShow(() => void loadHistory());

  const ask = async () => {
    if (question.trim().length < 2) return;
    setAsking(true);
    try {
      const answer = await apiRequest<Answer>('/questions', {
        method: 'POST',
        data: { question: question.trim() },
      });
      setAnswers((current) => [answer, ...current]);
      setQuestion('');
    } catch {
      await Taro.showToast({ title: '暂时无法回答，请稍后再试', icon: 'none' });
    } finally {
      setAsking(false);
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <View className="title">问清楚，再出发</View>
        <View className="subtitle">回答会优先关联官方资料；重要政策请以办理机构最新要求为准。</View>
      </View>
      <Textarea
        className="textarea"
        value={question}
        maxlength={2000}
        placeholder="例如：社保和公积金怎么查？"
        onInput={(event) => setQuestion(event.detail.value)}
      />
      <Button className="button" loading={asking} disabled={asking} onClick={ask}>
        {asking ? '正在整理资料' : '提交问题'}
      </Button>

      <View className="section-title">最近问答</View>
      {answers.map((item) => (
        <View className="card" key={item.id}>
          <View className="tag">{item.category}</View>
          <View className="card-title">{item.question}</View>
          <View>{item.answer}</View>
          {item.disclaimer && <View className="muted">{item.disclaimer}</View>}
          {item.sources.map((source) => (
            <View className="card" key={source.id} onClick={() => copyExternalLink(source.url)}>
              <View className="tag">{source.platform}</View>
              <View className="card-title">{source.title}</View>
              <View className="muted">{source.summary}</View>
              <View className="muted">点击复制原始链接</View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
