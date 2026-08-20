import { Button, Input, Picker, Textarea, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useResource } from '../../lib/use-resource';

type CareerItem = { id: string; kind: string; title: string; status: string; note: string | null };
type ResumeFile = { id: string; name: string; version: number; createdAt: string };
const kinds = [
  ['goal', '职业目标'],
  ['resume', '简历版本'],
  ['side-project', '副业项目'],
] as const;

export default function CareerPage() {
  const { items, create, remove } = useResource<CareerItem>('/career-items');
  const [kindIndex, setKindIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  useDidShow(() => {
    void apiRequest<ResumeFile[]>('/files/resumes').then(setResumes);
  });

  const submit = async () => {
    if (!title.trim()) return;
    try {
      await create({
        kind: kinds[kindIndex]?.[0],
        title: title.trim(),
        status: 'planned',
        note: note || null,
      });
      setTitle('');
      setNote('');
    } catch {
      await Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  const uploadResume = async () => {
    try {
      const selected = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['pdf', 'doc', 'docx'],
      });
      const file = selected.tempFiles[0];
      if (!file) return;
      const extension = file.name.split('.').pop()?.toLowerCase();
      const mimeType =
        extension === 'pdf'
          ? 'application/pdf'
          : extension === 'doc'
            ? 'application/msword'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const ticket = await apiRequest<{ objectKey: string; uploadUrl: string }>(
        '/files/upload-url',
        {
          method: 'POST',
          data: { purpose: 'resume', filename: file.name, mimeType, size: file.size },
        },
      );
      const data = await new Promise<ArrayBuffer>((resolve, reject) => {
        Taro.getFileSystemManager().readFile({
          filePath: file.path,
          success: (result) => resolve(result.data as ArrayBuffer),
          fail: reject,
        });
      });
      await Taro.request({
        url: ticket.uploadUrl,
        method: 'PUT',
        data,
        header: { 'Content-Type': mimeType },
      });
      await apiRequest('/files/resumes', {
        method: 'POST',
        data: { name: file.name, objectKey: ticket.objectKey, mimeType, size: file.size },
      });
      setResumes(await apiRequest<ResumeFile[]>('/files/resumes'));
      await Taro.showToast({ title: '简历上传成功', icon: 'success' });
    } catch {
      await Taro.showToast({ title: '简历上传失败', icon: 'none' });
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <View className="title">让计划看得见</View>
        <View className="subtitle">把大目标拆成可以开始的小步骤，简历只记录版本信息。</View>
      </View>
      <View className="card">
        <Picker
          mode="selector"
          range={kinds.map((kind) => kind[1])}
          value={kindIndex}
          onChange={(e) => setKindIndex(Number(e.detail.value))}
        >
          <View className="input">{kinds[kindIndex]?.[1]}</View>
        </Picker>
        <Input
          className="input"
          value={title}
          placeholder="目标或项目名称"
          onInput={(e) => setTitle(e.detail.value)}
        />
        <Textarea
          className="textarea"
          value={note}
          placeholder="下一步是什么？"
          onInput={(e) => setNote(e.detail.value)}
        />
        <Button className="button" onClick={submit}>
          加入计划
        </Button>
        <Button className="button secondary" onClick={uploadResume}>
          上传简历文件
        </Button>
      </View>
      {resumes.map((resume) => (
        <View className="card" key={resume.id}>
          <View className="tag">简历 v{resume.version}</View>
          <View className="card-title">{resume.name}</View>
          <View className="muted">{new Date(resume.createdAt).toLocaleDateString()}</View>
        </View>
      ))}
      <View className="section-title">职业事项</View>
      {items.map((item) => (
        <View className="card" key={item.id}>
          <View className="tag">
            {item.kind} · {item.status}
          </View>
          <View className="card-title">{item.title}</View>
          {item.note && <View className="muted">{item.note}</View>}
          <Button className="button secondary" onClick={() => remove(item.id)}>
            删除
          </Button>
        </View>
      ))}
    </View>
  );
}
