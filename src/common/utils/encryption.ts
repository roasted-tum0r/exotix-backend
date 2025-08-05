// src/utils/encryption.ts
import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_SECRET_KEY || 'your-32-char-secret-key!'; // must be 32 chars
const iv = process.env.ENCRYPTION_IV || 'your-16-char-iv!!'; // must be 16 chars

if (secretKey.length !== 32 || iv.length !== 16) {
  throw new Error('ENCRYPTION_SECRET_KEY must be 32 chars and IV must be 16 chars');
}

export function encryptId(id: number): string {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(id.toString(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptId(encryptedId: string): number {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedId, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  const id = parseInt(decrypted, 10);
  if (isNaN(id)) {
    throw new Error('Invalid ID');
  }
  return id;
}
