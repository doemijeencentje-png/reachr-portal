import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  return Buffer.from(key.slice(0, 32));
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combine IV + Tag + Encrypted data
  return iv.toString('hex') + tag.toString('hex') + encrypted;
}

export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();

  // Extract IV, Tag, and encrypted data
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
  const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2), 'hex');
  const encrypted = encryptedData.slice(IV_LENGTH * 2 + TAG_LENGTH * 2);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
