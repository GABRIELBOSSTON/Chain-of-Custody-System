import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY || 'default_secret_key_32_bytes_long_123';
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptField(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (e) {
    Logger.error('Failed to encrypt field', e);
    return text;
  }
}

export function decryptField(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  const parts = text.split(':');
  if (parts.length !== 2) return text;
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return text;
  }
}

export function encryptRoute(route: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(route, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encodeURIComponent(iv.toString('base64') + ':' + encrypted);
}

export function decryptRoute(payload: string): string {
  try {
    const decoded = decodeURIComponent(payload);
    const parts = decoded.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'base64');
    const encryptedText = Buffer.from(parts[1], 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return '';
  }
}
