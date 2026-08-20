import { Button, Image, Input, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { apiRequest, IS_LOCAL_MODE, saveLocalFile } from '../../lib/api';
import { useResource } from '../../lib/use-resource';

type Contact = {
  id: string;
  name: string;
  className: string | null;
  phone: string | null;
  birthday: string | null;
  photoKey: string | null;
};

export default function SocialPage() {
  const { items, create, remove } = useResource<Contact>('/contacts');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [photoKey, setPhotoKey] = useState('');

  const submit = async () => {
    if (!name.trim()) return;
    try {
      await create({
        name: name.trim(),
        className: className.trim() || null,
        phone: phone.trim() || null,
        birthday: birthday.trim() || null,
        photoKey: photoKey || null,
      });
      setName('');
      setClassName('');
      setPhone('');
      setBirthday('');
      setPhotoKey('');
    } catch {
      await Taro.showToast({ title: '保存失败，生日请填写 MM-DD', icon: 'none' });
    }
  };

  const choosePhoto = async () => {
    try {
      const selected = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
      });
      const file = selected.tempFiles[0];
      if (!file) return;
      const mimeType = file.tempFilePath.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';
      const filename = file.tempFilePath.split('/').pop() ?? 'contact.jpg';
      if (IS_LOCAL_MODE) {
        setPhotoKey(await saveLocalFile(file.tempFilePath));
        await Taro.showToast({ title: '照片已保存在本机', icon: 'success' });
        return;
      }
      const ticket = await apiRequest<{ objectKey: string; uploadUrl: string }>(
        '/files/upload-url',
        {
          method: 'POST',
          data: { purpose: 'contact-photo', filename, mimeType, size: file.size },
        },
      );
      const data = await new Promise<ArrayBuffer>((resolve, reject) => {
        Taro.getFileSystemManager().readFile({
          filePath: file.tempFilePath,
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
      setPhotoKey(ticket.objectKey);
      await Taro.showToast({ title: '照片已准备', icon: 'success' });
    } catch {
      await Taro.showToast({ title: '照片上传失败', icon: 'none' });
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <View className="title">记住重要的人</View>
        <View className="subtitle">
          {IS_LOCAL_MODE ? '预览模式下信息只保存在本机；' : '联系方式会加密保存；'}
          录入他人信息前，请先尊重对方意愿。
        </View>
      </View>
      <View className="card">
        <Input
          className="input"
          value={name}
          placeholder="姓名"
          onInput={(e) => setName(e.detail.value)}
        />
        <Input
          className="input"
          value={className}
          placeholder="班级或关系"
          onInput={(e) => setClassName(e.detail.value)}
        />
        <Input
          className="input"
          value={phone}
          placeholder="联系方式（可选）"
          onInput={(e) => setPhone(e.detail.value)}
        />
        <Input
          className="input"
          value={birthday}
          maxlength={5}
          placeholder="生日 MM-DD（可选）"
          onInput={(e) => setBirthday(e.detail.value)}
        />
        <Button className="button secondary" onClick={choosePhoto}>
          {photoKey ? '照片已选择' : '选择照片（可选）'}
        </Button>
        <Button className="button" onClick={submit}>
          保存联系人
        </Button>
      </View>
      <View className="section-title">联系人</View>
      {items.map((item) => (
        <View className="card" key={item.id}>
          {IS_LOCAL_MODE && item.photoKey && (
            <Image className="contact-photo" src={item.photoKey} mode="aspectFill" />
          )}
          <View className="card-title">{item.name}</View>
          <View className="muted">
            {[item.className, item.birthday && `生日 ${item.birthday}`, item.phone]
              .filter(Boolean)
              .join(' · ')}
          </View>
          <Button className="button secondary" onClick={() => remove(item.id)}>
            删除
          </Button>
        </View>
      ))}
    </View>
  );
}
