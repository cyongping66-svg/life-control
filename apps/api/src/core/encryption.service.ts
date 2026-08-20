import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class EncryptionService {
  encrypt(value: string) {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.');
  }

  decrypt(value: string) {
    const key = this.getKey();
    const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64'));
    if (!iv || !tag || !encrypted) throw new Error('无效的密文');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  private getKey() {
    const configured = process.env.FIELD_ENCRYPTION_KEY;
    if (!configured) {
      if (process.env.NODE_ENV !== 'production') {
        return Buffer.from('development-key-not-for-prod-32b');
      }
      throw new ServiceUnavailableException('敏感字段加密尚未配置');
    }
    const key = Buffer.from(configured, 'base64');
    if (key.length !== 32) {
      throw new ServiceUnavailableException('字段加密密钥必须是 32 字节 Base64');
    }
    return key;
  }
}
